const fs = require('fs');
const path = require('path');
const os = require('os');
const JSZip = require('jszip');
const { XMLParser } = require('fast-xml-parser');
const PPTtoJSON = require('ppt-to-json');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_INPUT = path.join(ROOT, 'assets', 'Diagram.pptx');
const DEFAULT_OUTPUT = path.join(ROOT, 'site', 'diagram-hotspots.json');

const LABEL_NORMALIZATION_RULES = [
  [/^User\s*Requestor\s*Trigger$/i, 'User Request or Trigger'],
  [/^Planning\s*Loop$/i, 'Planning Loop'],
  [/^PlanningLoop$/i, 'Planning Loop'],
  [/^Execution\s*\(\s*Call\s*Tools\s*\)$/i, 'Execution (Call Tools)'],
  [/^Execution\s*Call\s*Tools$/i, 'Execution (Call Tools)'],
  [/^Tools\s*\(\s*Inventory\s*\+\s*Schema\s*\)$/i, 'Tools (Inventory + Schema)'],
  [/^Tools\s*\(\s*Inventory\s*\+\s*Schema\)$/i, 'Tools (Inventory + Schema)'],
  [/^Vector\s*Data\s*Base$/i, 'Vector Database'],
  [/^Invoke\s*HITL$/i, 'Invoke HITL'],
  [/^Task\s*\(\s*Turn\s*\)\s*Context$/i, 'Task (Turn) Context'],
  [/^Tool\s*Call\s*Response$/i, 'Tool Call Response'],
  [/^Tool\s*Call$/i, 'Tool Call'],
  [/^Long\s*-\s*Term\s*Memory\s*Storage$/i, 'Long-Term Memory Storage'],
  [/^Authentication\s*&\s*Authorization$/i, 'Authentication & Authorization'],
  [/^XPIA\s*Detected$/i, 'XPIA Detected'],
  [/^Abort\s*or\s*HITL$/i, 'Abort or HITL'],
  [/^LLM\s*Reasoning\s*\/\s*Planning$/i, 'LLM Reasoning / Planning']
];

const COMPONENT_DESCRIPTIONS = {
  'User Request or Trigger': 'The user entry point where prompts, commands, and requests begin execution.',
  Orchestrator: 'Central coordination layer that routes requests, controls flow, and orchestrates model/tool interactions.',
  'Content Filtering': 'Screens content for unsafe instructions and policy violations before deeper processing.',
  Spotlighting: 'Isolation stage for suspicious prompt segments, especially potential XPIA patterns.',
  'Prompt Editing': 'Sanitizes or rewrites unsafe prompt text before it reaches planning and execution.',
  'Planning Loop': 'Builds the task execution strategy and iterates until plan quality checks pass.',
  'Task (Turn) Context': 'Holds immediate turn-specific context used for this request cycle.',
  'LLM Reasoning / Planning': 'Model reasoning stage that interprets plan + context and decides the next action.',
  'Execution (Call Tools)': 'Runtime execution layer where tools are called and results are returned.',
  'Tools (Inventory + Schema)': 'Registry of available tools and their callable schema contracts.',
  'Task Analysis': 'Evaluates task/tool intent for policy, risk, and escalation requirements.',
  'Abort or HITL': 'Decision checkpoint where risky actions are either blocked or escalated to human review.',
  'System Prompt': 'Core control instructions constraining the model behavior and output style.',
  'Other External Services, Including MCP': 'External systems and services invoked beyond local tool inventory.',
  RAG: 'Retrieval pipeline entry for grounding responses with external knowledge.',
  'Data Store': 'Structured backing store used by retrieval and lookup operations.',
  'Vector Database': 'Embedding index used for semantic retrieval during RAG.',
  Output: 'Final response channel back to the user or calling surface.',
  'Long-Term Memory Storage': 'Persistent memory store used across sessions.'
};

const ARROW_DESCRIPTIONS = {
  'Authentication & Authorization': 'Performs identity and permission checks before entering orchestration flow.',
  'Tool Call': 'Outgoing request from model/orchestrator to execute a tool action.',
  'Tool Call Response': 'Return payload from tool execution back into reasoning/planning flow.',
  'Invoke HITL': 'Escalation path requesting Human-in-the-Loop review.',
  'XPIA Detected': 'Indicates a potential cross-prompt injection pattern was identified.',
  Approved: 'Approval signal allowing execution path to continue.',
  OK: 'Validation/health signal indicating this path passed checks.',
  Request: 'Request-direction flow into a downstream component.',
  Response: 'Response-direction flow returning to an upstream component.'
};

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function safeName(value, fallback) {
  const name = String(value || fallback || '').trim();
  return name.length ? name : fallback;
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';
}

function normalizeLabel(label) {
  const raw = String(label || '').trim().replace(/\s+/g, ' ');
  if (!raw) return raw;
  for (const [pattern, replacement] of LABEL_NORMALIZATION_RULES) {
    if (pattern.test(raw)) return replacement;
  }
  return raw;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function collectTextInfoFromTxBody(txBody) {
  if (!txBody) return '';
  const paragraphs = toArray(txBody['a:p']);
  const lines = paragraphs.map((p) => {
    const runs = [
      ...toArray(p?.['a:r']),
      ...toArray(p?.['a:fld'])
    ];
    const runText = runs
      .map((r) => {
        const t = r?.['a:t'];
        return typeof t === 'string' ? t : '';
      })
      .filter(Boolean)
      .join('');

    const endPara = typeof p?.['a:endParaRPr'] !== 'undefined';
    const plain = typeof p?.['a:t'] === 'string' ? p['a:t'] : '';
    const out = (runText || plain || '').trim();
    return out || (endPara ? '' : '');
  });

  const textLines = lines.filter(Boolean);
  return {
    text: textLines.join(' ').replace(/\s+/g, ' ').trim(),
    lineCount: Math.max(1, textLines.length)
  };
}

function estimateTextHotspot(position, text, lineCount) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const chars = String(text || '').length;

  const targetWidth = clamp(chars * 0.42, 4.2, 18.0);
  const targetHeight = clamp(lineCount * 2.5 + 1.4, 2.8, 9.0);

  const hugeContainerLabel = position.widthPercent > 20 && position.heightPercent > 20 && words.length <= 4;

  const width = Math.min(targetWidth, position.widthPercent);
  const height = Math.min(targetHeight, position.heightPercent);

  const x = position.xPercent + ((position.widthPercent - width) / 2);
  const y = hugeContainerLabel
    ? position.yPercent + 1.0
    : position.yPercent + ((position.heightPercent - height) / 2);

  return {
    xPercent: Number(x.toFixed(3)),
    yPercent: Number(y.toFixed(3)),
    widthPercent: Number(width.toFixed(3)),
    heightPercent: Number(height.toFixed(3))
  };
}

function emuToPct(value, max) {
  if (!max) return 0;
  return Number(((Number(value || 0) / Number(max)) * 100).toFixed(3));
}

async function resolveInput(inputArg) {
  const input = inputArg || DEFAULT_INPUT;
  if (/^https?:\/\//i.test(input)) {
    const response = await fetch(input);
    if (!response.ok) {
      throw new Error(`Failed to download PPT: HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('SharePoint link returned an HTML sign-in page. Download the .pptx locally and pass the local file path.');
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    const ext = input.toLowerCase().includes('.ppt') ? '.pptx' : '.pptx';
    const tempPath = path.join(os.tmpdir(), `diagram-${Date.now()}${ext}`);
    fs.writeFileSync(tempPath, bytes);
    return { filePath: tempPath, cleanup: () => fs.rmSync(tempPath, { force: true }) };
  }

  const resolved = path.resolve(input);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Input PPT/PPTX file not found: ${resolved}`);
  }
  return { filePath: resolved, cleanup: null };
}

async function extractTextBySlideWithPptToJson(pptPath) {
  try {
    const slides = await PPTtoJSON.readPath(pptPath);
    return toArray(slides).map((slideLines, idx) => ({
      slideIndex: idx + 1,
      lines: toArray(slideLines).map((line) => String(line || '').trim()).filter(Boolean)
    }));
  } catch (error) {
    return [{
      slideIndex: 1,
      lines: [`ppt-to-json parse failed: ${error.message}`]
    }];
  }
}

async function parsePptxGeometry(pptPath, slideIndex = 1) {
  const bytes = fs.readFileSync(pptPath);
  const zip = await JSZip.loadAsync(bytes);
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

  const presentationXml = await zip.file('ppt/presentation.xml')?.async('text');
  if (!presentationXml) {
    throw new Error('Invalid pptx: missing ppt/presentation.xml');
  }
  const presentation = parser.parse(presentationXml);
  const sldSz = presentation?.['p:presentation']?.['p:sldSz'] || {};
  const slideWidth = Number(sldSz.cx || 0);
  const slideHeight = Number(sldSz.cy || 0);

  const slidePath = `ppt/slides/slide${slideIndex}.xml`;
  const slideXml = await zip.file(slidePath)?.async('text');
  if (!slideXml) {
    throw new Error(`Slide not found: ${slidePath}`);
  }

  const slide = parser.parse(slideXml);
  const tree = slide?.['p:sld']?.['p:cSld']?.['p:spTree'];
  if (!tree) {
    throw new Error('Unable to read shape tree from slide');
  }

  const components = [];
  const arrows = [];
  const textZones = [];
  let shapeCount = 0;
  let arrowCount = 0;

  function parseShape(sp) {
    const nv = sp?.['p:nvSpPr']?.['p:cNvPr'] || {};
    const xfrm = sp?.['p:spPr']?.['a:xfrm'] || {};
    const off = xfrm?.['a:off'] || {};
    const ext = xfrm?.['a:ext'] || {};
    const textInfo = collectTextInfoFromTxBody(sp?.['p:txBody']);
    const text = textInfo.text;
    const lineCount = textInfo.lineCount;

    const x = Number(off.x || 0);
    const y = Number(off.y || 0);
    const w = Number(ext.cx || 0);
    const h = Number(ext.cy || 0);

    if (!w || !h) return;

    shapeCount += 1;
    const rawName = text || nv.name || '';
    const isLikelyNoise = /^textNoShape|^Freeform|^Straight Connector|^Line\s+\d+/i.test(rawName);
    const name = normalizeLabel(safeName(text || (!isLikelyNoise ? nv.name : ''), `Shape ${shapeCount}`));

    // Keep only useful text boxes (named/visible semantic elements), skip XML-noise placeholders.
    const hasUsefulText = text && text.length >= 2;
    const hasUsefulName = !isLikelyNoise && String(nv.name || '').trim().length > 0;
    if (!hasUsefulText && !hasUsefulName) return;

    const position = {
      xPercent: emuToPct(x, slideWidth),
      yPercent: emuToPct(y, slideHeight),
      widthPercent: emuToPct(w, slideWidth),
      heightPercent: emuToPct(h, slideHeight)
    };

    // Ignore out-of-bounds or tiny text fragments; keep actual diagram boxes.
    const inBounds =
      position.xPercent >= -1 &&
      position.yPercent >= -1 &&
      position.xPercent <= 100 &&
      position.yPercent <= 100;
    const minBoxSize = position.widthPercent >= 1.0 && position.heightPercent >= 0.35;
    if (!inBounds || !minBoxSize) return;

    const textPosition = estimateTextHotspot(position, text, lineCount);

    const item = {
      id: `shape-${slugify(name)}-${shapeCount}`,
      name,
      position: textPosition,
      description: ''
    };

    textZones.push(item);
  }

  function parseConnector() {
    // Intentionally ignored for precision pass.
    // Arrow hovers are now derived from action text labels in the slide.
  }

  function walkGroup(group) {
    toArray(group?.['p:sp']).forEach(parseShape);
    toArray(group?.['p:cxnSp']).forEach(parseConnector);
    toArray(group?.['p:grpSp']).forEach(walkGroup);
  }

  toArray(tree['p:sp']).forEach(parseShape);
  toArray(tree['p:cxnSp']).forEach(parseConnector);
  toArray(tree['p:grpSp']).forEach(walkGroup);

  const arrowNames = new Set([
    'authenticationauthorization',
    'toolcall',
    'toolcallresponse',
    'approved',
    'invokehitl',
    'xpiadetected',
    'ok',
    'response',
    'request'
  ]);

  textZones.forEach((z) => {
    const normalizedName = normalizeLabel(z.name || '');
    const normalized = String(normalizedName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (arrowNames.has(normalized)) {
      arrowCount += 1;
      arrows.push({
        id: `arrow-label-${slugify(normalizedName)}-${arrowCount}`,
        name: normalizedName,
        position: z.position,
        midX: Number((z.position.xPercent + (z.position.widthPercent / 2)).toFixed(3)),
        midY: Number((z.position.yPercent + (z.position.heightPercent / 2)).toFixed(3)),
        description: ''
      });
    } else {
      components.push(z);
    }
  });

  return {
    canvas: {
      width: slideWidth,
      height: slideHeight,
      unit: 'emu'
    },
    components,
    arrows
  };
}

function mergeDescriptions(components, arrows, pptTextSlides) {
  const lines = pptTextSlides.flatMap((s) => s.lines || []);

  const namedComponentLines = components.map((c) => {
    const canonicalName = normalizeLabel(c.name || '');
    const name = String(canonicalName).toLowerCase();
    const match = lines.find((line) => name && line.toLowerCase().includes(name));
    return {
      ...c,
      name: canonicalName,
      description: COMPONENT_DESCRIPTIONS[canonicalName] || (match ? `Extracted from PPT text: ${match}` : '')
    };
  });

  const namedArrowLines = arrows.map((a) => {
    const canonicalName = normalizeLabel(a.name || '');
    const name = String(canonicalName).toLowerCase();
    const match = lines.find((line) => name && line.toLowerCase().includes(name));
    return {
      ...a,
      name: canonicalName,
      description: ARROW_DESCRIPTIONS[canonicalName] || (match ? `Extracted from PPT text: ${match}` : '')
    };
  });

  return {
    components: namedComponentLines,
    arrows: namedArrowLines
  };
}

async function main() {
  const inputArg = process.argv[2];
  const outputArg = process.argv[3];
  const slideArg = Number(process.argv[4] || 1);

  const outputPath = path.resolve(outputArg || DEFAULT_OUTPUT);
  let cleanup = null;

  try {
    const resolved = await resolveInput(inputArg);
    cleanup = resolved.cleanup;

    const pptTextSlides = await extractTextBySlideWithPptToJson(resolved.filePath);
    const geometry = await parsePptxGeometry(resolved.filePath, slideArg);
    const merged = mergeDescriptions(geometry.components, geometry.arrows, pptTextSlides);

    const output = {
      version: 1,
      generatedAt: new Date().toISOString(),
      source: {
        input: inputArg || DEFAULT_INPUT,
        resolvedPath: resolved.filePath,
        slideIndex: slideArg,
        parser: 'ppt-to-json + pptx-xml'
      },
      canvas: geometry.canvas,
      components: merged.components,
      arrows: merged.arrows,
      pptTextSlides
    };

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

    console.log(`Generated: ${outputPath}`);
    console.log(`Components: ${output.components.length}`);
    console.log(`Arrows: ${output.arrows.length}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    if (cleanup) cleanup();
  }
}

main();
