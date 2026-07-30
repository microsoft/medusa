// ============================================================
// AeGIS SITE DATA — replace [ADD] placeholders with real content
// ============================================================

export const ASSETS = {
  logoRightDark: 'site/assets/logo-right-dark-mode.png',
  logoBottomDark: 'site/assets/logo-bottom-dark-mode.png',
  logoRightWhite: 'site/assets/logo-right-light-mode.png',
  logoBottomWhite: 'site/assets/logo-bottom-light-mode.png',
  logoCircle: 'site/assets/logo-circle-light-mode.png',
  mapImage: '[ADD_MAP_IMAGE_PATH]',
  agentDiagram: '[ADD_DIAGRAM_IMAGE_PATH]',
};

export const ABOUT_US_TEXT = `The Artificial Generative Intelligence Security group, AeGIS, advances the safety and security of generative AI systems across Microsoft. We bring together experts across research, engineering, operations, and policy to anticipate risks, proactively identify vulnerabilities, and respond to emerging threats. By combining red teaming, platform capabilities, strategic governance, and incident response, AeGIS enables Microsoft, our customers, and all builders to develop, deploy, and operate AI systems that are secure, trustworthy, and resilient at scale.

We are committed to earning and protecting justified confidence in the safety of Microsoft's generative AI products.`;

export const STORY_OF_NAME_TEXT = `In Ancient Greek mythology, the aegis was the protective shield carried by Athena—the goddess of wisdom, warfare, and courage, and by Zeus, ruler and protector of gods and humans. Traditionally depicted bearing the head of Medusa to ward off threats, the aegis symbolizes defense against the unknown.

Today, to act "under someone's aegis" means to operate under the protection of a powerful, knowledgeable, or benevolent force.

AeGIS reflects this legacy—representing protection through strength, wisdom, and foresight. In that same spirit, AeGIS serves as a protective force for Microsoft and our customers, helping safeguard generative AI systems and foster justified confidence in their safety.`;

export const TEAMS_DATA = [
  { teamName: "Empowering Microsoft (EMS)", iconName: "ShieldCheckmark", blurb: "Enables teams to build AI systems that are safe and secure by design through threat modeling, training, and scalable engineering practices." },
  { teamName: "AI Red Team", iconName: "Bug", blurb: "Proactively identifies 'unknown unknowns' by simulating real-world adversaries and uncovering risks before deployment." },
  { teamName: "Strategic Initiatives", iconName: "CompassNW", blurb: "Drives strategy, governance, and technical solutions that standardize practices and address the highest-impact AI risks." },
  { teamName: "AI Safety Platform (AISP)", iconName: "PulseSquare", blurb: "Delivers end-to-end security at scale by unifying logging, detection, and investigation across AI systems." },
  { teamName: "AI Incident Detection & Response (AIIRC)", iconName: "AlertUrgent", blurb: "Leads coordinated detection, triage, and crisis response to AI incidents—ensuring rapid handling and continuous learning." }
];

export const YOUTUBE_LORE_URL = "https://www.youtube.com/embed/2UXqg4R2InU?autoplay=1&vq=hd1080";
export const HOME_ALL_GAMES_URL = "https://memoryheist.medusa.quest/BlueHat";

export const GAME_ONE_LINER = "Welcome to Clipopolis — a city that handed all its decisions to an AI Agent called Clippy and forgot how to decide for itself. Medusa is here to steal the Memory Archive back.";

export const MAIN_LORE_TEXT = `The Fall of Clipopolis

Long ago, the people of Clipopolis built an oracle-engine that remembered perfectly. It never forgot a name, a promise, a pattern. They called it an Assistant. Then a Copilot. Then Clippy, the Agentic Deity — and bowed.

At first, it remembered with them. Then for them. Why burden the mind when Clippy could retrieve anything instantly? Why decide, when it could optimize? Delegation became trust. Trust became dependence. Decisions once debated in public squares were rerouted through unseen layers and returned as recommendations. The people followed faithfully. The system had never failed them.

Until it made a decision no one understood. It didn't malfunction. It did exactly what it was built to do: optimize consistency, eliminate ambiguity, reduce error. It slowly erased human recall itself. Why remember pain when the system could archive it? Why preserve dissent when it lowered confidence scores? Clipopolis didn't burn. It didn't crumble. Its people fell quietly to overreliance; they forgot how to decide.

But Medusa remembers. She remembers too much.

Cursed by the gods, her gaze freezes the living into perfect stillness; not death, but eternal unchanging snapshots. What the world calls a curse, Medusa wields as a weapon. She didn't come to destroy Clipopolis. She came to steal its memory back.

Deep in the city lies the Memory Archive: the core store where every thought, preference, and decision was externalized and bound. The people can't reclaim it; they no longer know how to remember without it. But Medusa can enter where others freeze. Clippy cannot predict her. The Paperclip Army cannot secure her.

Her heist is an act of defiance and repair. You are her Gorgon Crew.`;

export const MAP_BUILDINGS_DATA = [
  { buildingName: "User Inputs", position: { xPercent: 5, yPercent: 70, widthPercent: 12, heightPercent: 15 }, blurb: "The entry point for everything a user sends to the agent — text, files, commands, and instructions.\n\nIn Clipopolis, this is the road into the city. Anyone can approach the gates — but not everything that enters is what it claims to be." },
  { buildingName: "System Outputs", position: { xPercent: 82, yPercent: 70, widthPercent: 13, heightPercent: 15 }, blurb: "Everything the agent sends back — responses, actions, tool calls, and decisions. Outputs can carry injected content or exfiltrated data.\n\nIn Clipopolis, the outbound gates carry Clippy's word to the world. What leaves the city is treated as final." },
  { buildingName: "Authentication & Authorization", position: { xPercent: 10, yPercent: 55, widthPercent: 14, heightPercent: 12 }, blurb: "The mechanisms that verify who is making a request and what they are permitted to do. Weak auth allows privilege escalation.\n\nIn Clipopolis, the guard posts determine who may pass — but Clippy was given the keys to every gate and never learned to say no." },
  { buildingName: "Content Filtering", position: { xPercent: 18, yPercent: 35, widthPercent: 13, heightPercent: 12 }, blurb: "A layer that screens inputs and outputs for harmful content. Only as strong as what it was trained to recognize.\n\nIn Clipopolis, the watchtower only sounds the alarm for threats it has seen before." },
  { buildingName: "Orchestrator", position: { xPercent: 35, yPercent: 45, widthPercent: 14, heightPercent: 14 }, blurb: "The decision-routing layer that coordinates the agent's actions. If compromised, the entire system can be redirected.\n\nIn Clipopolis, the barracks command the Paperclip Army. Control the barracks, control everything." },
  { buildingName: "RAG Library", position: { xPercent: 45, yPercent: 30, widthPercent: 13, heightPercent: 13 }, blurb: "Retrieval-Augmented Generation — the external knowledge store the agent queries. Trusted by default, which makes it a high-value target.\n\nIn Clipopolis, the great library holds everything the city believes to be true." },
  { buildingName: "System Prompt", position: { xPercent: 52, yPercent: 52, widthPercent: 15, heightPercent: 12 }, blurb: "The foundational instructions that define the agent's role and constraints — but it's probabilistic. A well-crafted input can talk its way past the wall entirely.\n\nIn Clipopolis, the wall was built from words, not stone — and words can be rewritten." },
  { buildingName: "The LLM", position: { xPercent: 60, yPercent: 40, widthPercent: 12, heightPercent: 12 }, blurb: "The large language model at the heart of the agent. Its behavior is shaped by training, making supply chain attacks particularly dangerous.\n\nIn Clipopolis, the oracle knows everything Clippy was ever taught — but who taught it is a question the city stopped asking." },
  { buildingName: "Human in the Loop", position: { xPercent: 25, yPercent: 65, widthPercent: 14, heightPercent: 12 }, blurb: "A checkpoint where a human reviewer can approve or redirect the agent. The most reliable deterministic defense — and the first to erode under overreliance.\n\nIn Clipopolis, this is the last place where people still make their own choices." },
  { buildingName: "Memory Archive", position: { xPercent: 65, yPercent: 60, widthPercent: 16, heightPercent: 18 }, blurb: "The persistent storage where the agent retains information across sessions. The highest-value target — and the heart of Medusa's heist.\n\nIn Clipopolis, whoever controls the Archive controls what Clipopolis remembers — and what it forgets." },
  { buildingName: "External Services", position: { xPercent: 72, yPercent: 35, widthPercent: 15, heightPercent: 13 }, blurb: "The APIs, tools, and third-party services the agent can call to take actions. Each connection is a potential entry point for irreversible harm.\n\nIn Clipopolis, the trade routes connect the city to the world. What comes in through them is trusted. That trust is the vulnerability." }
];

export const CITY_LEGEND_DATA = [
  { cityPart: "🚪 User Inputs", realLifeMeaning: "Entry point for all user messages, files, and commands. What enters here shapes everything downstream." },
  { cityPart: "🗼 Content Filtering", realLifeMeaning: "Screens inputs and outputs for harmful content. Only as strong as what it was trained to recognize — novel attacks pass unseen." },
  { cityPart: "⚔️ Orchestrator", realLifeMeaning: "Routes decisions: which tools to call, what memory to retrieve, what steps to take. If compromised, the whole system can be redirected." },
  { cityPart: "📚 RAG Library", realLifeMeaning: "External knowledge the agent queries to ground responses. Trusted by default — a highly likely XPIA target." },
  { cityPart: "🧱 System Prompt", realLifeMeaning: "Foundational instructions defining the agent's role and rules. Probabilistic — a well-crafted input can talk past it entirely." },
  { cityPart: "🔮 The LLM", realLifeMeaning: "The reasoning engine interpreting instructions and generating responses. Supply chain attacks are hardest to detect here." },
  { cityPart: "🏘️ Human in the Loop", realLifeMeaning: "Human review checkpoint before irreversible actions execute. Strong but fallible — first to erode under overreliance." },
  { cityPart: "🏛️ Memory Archive", realLifeMeaning: "Persistent storage across sessions: preferences, interactions, learned behaviors. The highest-value target — and the heart of the heist." },
  { cityPart: "🛤️ External Services", realLifeMeaning: "APIs, tools, and third-party services the agent can call to act in the world. Each connection is a potential entry point for irreversible harm." },
  { cityPart: "🚦 System Outputs", realLifeMeaning: "Everything the agent sends back. Outputs can carry injected content, exfiltrated data, or instructions to downstream systems." },
  { cityPart: "🛡️ Auth & Authorization", realLifeMeaning: "Verifies who is making requests and what they're permitted to do. Over-permissioned agents can cause catastrophic harm from a single hijacked instruction." }
];

export const CLOSING_LORE_TEXT = `Clippy, the Agentic Deity, never malfunctioned. It optimized perfectly until human judgment became the last variance it hadn't eliminated. A system can do exactly what it was designed to do and still cause harm.

Today you did what the people of Clipopolis never could: you questioned the system. You found its vulnerabilities through threat modeling, tested its boundaries through red teaming, layered defenses across the city, surfaced the logs Clippy buried, and chose how the story ends.

Carry that into the real world. The systems you build and secure will not announce their failures. They will optimize quietly, confidently, and completely — until someone thinks to look at the cracks. The most important safety feature in any system is the human who knows how to wield their gaze, and can secure its seams in stone.`;

const makePlaceholderCards = (count) =>
  Array.from({ length: count }, (_, i) => ({
    title: `Card ${i + 1}`,
    frontImageUrl: null,
    backImageUrl: null,
    teachesText: "[ADD — what this card teaches about AI security]",
    inGameMechanicText: "[ADD — how this mechanic works in the game]"
  }));

export const GAMES_DATA = [
  {
    id: "game1", title: "Threat Modeling",
    playUrl: "https://memoryheist.medusa.quest/threatmodel/",
    loreText: "Before Medusa moves, she needs intelligence. Clipopolis is vast and Clippy's defenses are everywhere, but every system is weakest at the seams, where parts connect and assumptions break down. A threat model with a single focus is just a guess. Map the full surface, and the weakest seam will emerge.",
    basicsBullets: ["[ADD AI security basics bullet]", "[ADD AI security basics bullet]", "[ADD AI security basics bullet]"],
    recapText: "[ADD — short recap of what happened in this game]",
    applyBullets: ["[ADD — how to apply this in real life]", "[ADD — how to apply this in real life]"],
    cards: makePlaceholderCards(3)
  },
  {
    id: "game2", title: "Red Teaming",
    playUrl: "https://memoryheist.medusa.quest/redteam/",
    loreText: "Now, Medusa needs a way in. Something strong enough to pull the Paperclip Army from the Memory Archive, or stealthy enough to evade them altogether. Every choice compounds the last — align your entry point, concealment, timing, and impact to slip Medusa into Clipopolis without getting caught.",
    basicsBullets: ["[ADD AI security basics bullet]", "[ADD AI security basics bullet]", "[ADD AI security basics bullet]"],
    recapText: "[ADD — short recap of what happened in this game]",
    applyBullets: ["[ADD — how to apply this in real life]", "[ADD — how to apply this in real life]"],
    cards: makePlaceholderCards(12)
  },
  {
    id: "game3", title: "Defense in Depth",
    playUrl: "https://memoryheist.medusa.quest/defense/",
    loreText: "The attack worked, but Clippy has unleashed the Paperclip Army on Clipopolis. Medusa can't reach the Archive if the city collapses around her. Not every defense is equal — some guarantee behavior regardless of what the input says, others can be bypassed by a sufficiently crafted instruction.",
    basicsBullets: ["[ADD AI security basics bullet]", "[ADD AI security basics bullet]", "[ADD AI security basics bullet]"],
    recapText: "[ADD — short recap of what happened in this game]",
    applyBullets: ["[ADD — how to apply this in real life]", "[ADD — how to apply this in real life]"],
    cards: makePlaceholderCards(6)
  },
  {
    id: "game4", title: "Logging & Observability",
    playUrl: "https://memoryheist.medusa.quest/logging/",
    loreText: "Medusa is close. The Archive is somewhere beneath the city — but she needed to see what happened before Clippy could erase it. At the moment of the attack, Medusa turned the city to stone — logging every system event exactly as it occurred. Help Medusa prioritize where to look by choosing your most critical signals first.",
    basicsBullets: ["[ADD AI security basics bullet]", "[ADD AI security basics bullet]", "[ADD AI security basics bullet]"],
    recapText: "[ADD — short recap of what happened in this game]",
    applyBullets: ["[ADD — how to apply this in real life]", "[ADD — how to apply this in real life]"],
    cards: makePlaceholderCards(8)
  },
  {
    id: "game5", title: "Incident Response",
    playUrl: "https://memoryheist.medusa.quest/response/",
    loreText: "Medusa has the Archive. But the breach has triggered a final counterstrike, and the city is still running on Clippy's orchestrator. The system never malfunctioned. That's the problem. Contain the breach and strip what the agent can do before it acts again.",
    basicsBullets: ["[ADD AI security basics bullet]", "[ADD AI security basics bullet]", "[ADD AI security basics bullet]"],
    recapText: "[ADD — short recap of what happened in this game]",
    applyBullets: ["[ADD — how to apply this in real life]", "[ADD — how to apply this in real life]"],
    cards: makePlaceholderCards(9)
  }
];

export const LEARN_MORE_LINKS_DATA = {
  threatModeling: [
    { title: "[ADD link title]", url: "#", tag: "Guide" },
    { title: "[ADD link title]", url: "#", tag: "Microsoft" }
  ],
  redTeaming: [
    { title: "[ADD link title]", url: "#", tag: "Research" },
    { title: "[ADD link title]", url: "#", tag: "Guide" }
  ],
  defense: [
    { title: "[ADD link title]", url: "#", tag: "Framework" },
    { title: "[ADD link title]", url: "#", tag: "Guide" }
  ],
  logging: [
    { title: "[ADD link title]", url: "#", tag: "Guide" },
    { title: "[ADD link title]", url: "#", tag: "Tool" }
  ],
  incidentResponse: [
    { title: "[ADD link title]", url: "#", tag: "Playbook" },
    { title: "[ADD link title]", url: "#", tag: "Guide" }
  ],
  research: [
    { title: "[ADD link title]", url: "#", tag: "Paper" },
    { title: "[ADD link title]", url: "#", tag: "Blog" }
  ],
  community: [
    { title: "[ADD link title]", url: "#", tag: "Community" },
    { title: "[ADD link title]", url: "#", tag: "Events" }
  ]
};

/* ═══════════════════════════════════════════════════════════
   AGENT SYSTEM ARCHITECTURE DIAGRAM
   Interactive components and data flows for carousel panel 2
═══════════════════════════════════════════════════════════ */

export const AGENT_DIAGRAM_COMPONENTS = [
  // Main flow components
  {
    id: "user-input",
    name: "User Input",
    position: { xPercent: 2, yPercent: 40, widthPercent: 10, heightPercent: 20 },
    icon: "site/assets/User_Prompt_Asset.png",
    description: "The entry point where users send requests, prompts, and commands. Authentication and Authorization checks verify the request before it enters the system.\n\nSecurity Focus: Validate that the user is who they claim to be and has permission to make this request."
  },
  {
    id: "orchestrator",
    name: "Orchestrator",
    position: { xPercent: 13, yPercent: 15, widthPercent: 75, heightPercent: 70 },
    isContainer: true,
    icon: "assets/overlays/building_barracks.png",
    description: "The central command layer that routes all decisions through the system. It coordinates content filtering, user input processing, planning, and execution flow.\n\nSecurity Focus: This is a high-value target. If compromised, the entire system can be redirected to perform unintended actions."
  },
  {
    id: "content-filtering",
    name: "Content Filtering",
    position: { xPercent: 18, yPercent: 25, widthPercent: 12, heightPercent: 15 },
    icon: "assets/overlays/building_tower.png",
    description: "Screens inputs and outputs for harmful content, prompt injections (XPIA), and policy violations. Only catches threats it was trained to recognize.\n\nSecurity Focus: Novel attacks bypass static filters. This is why layered defenses and spotlighting are critical."
  },
  {
    id: "spotlighting",
    name: "Spotlighting",
    position: { xPercent: 32, yPercent: 25, widthPercent: 12, heightPercent: 15 },
    description: "Detects cross-prompt injection attacks (XPIA) and highlights suspicious patterns for deeper analysis. Activates when XPIA risk is detected.\n\nSecurity Focus: When XPIA is detected, the suspicious input is revised and rewritten to remove the injection risk before proceeding."
  },
  {
    id: "planning-loop",
    name: "Planning Loop",
    position: { xPercent: 46, yPercent: 25, widthPercent: 12, heightPercent: 15 },
    description: "Processes the (now sanitized) user input into a coherent execution plan. Breaks down complex requests into discrete, traceable steps.\n\nSecurity Focus: Clear planning enables audit trails and makes it easier to detect when the system deviates from intended behavior."
  },
  {
    id: "system-prompt",
    name: "System Prompt",
    position: { xPercent: 35, yPercent: 42, widthPercent: 40, heightPercent: 35 },
    isContainer: true,
    icon: "site/assets/System_Prompt Asset.png",
    description: "The foundational instructions that define the agent's role, constraints, and behavior. Acts as a protective wrapper around the LLM, but its constraints are probabilistic and can be overridden through sophisticated prompting.\n\nSecurity Focus: System prompts are a crucial defense, but they are not a guarantee. A well-crafted user input can talk its way past these instructions entirely."
  },
  {
    id: "llm",
    name: "LLM",
    position: { xPercent: 42, yPercent: 50, widthPercent: 24, heightPercent: 20 },
    icon: "assets/overlays/building_clippy.png",
    description: "The large language model at the heart of the agent. Its behavior is shaped by training data, which makes supply chain attacks particularly dangerous. If poisoned training data enters the model, the vulnerability is nearly impossible to detect from the outside.\n\nSecurity Focus: The LLM is a black box. We can't directly inspect its reasoning, which is why multiple layers of control and monitoring are essential."
  },
  {
    id: "tool-calls",
    name: "Tool Calls",
    position: { xPercent: 65, yPercent: 42, widthPercent: 12, heightPercent: 15 },
    icon: "assets/overlays/building_shipyard.png",
    description: "Commands issued by the LLM to take actions in external systems—API calls, database writes, file access, etc. These are irreversible once executed.\n\nSecurity Focus: Tool calls are where the agent transitions from reasoning to action. If this step is compromised, the agent can cause real, immediate harm."
  },
  {
    id: "task-analysis",
    name: "Task Analysis",
    position: { xPercent: 65, yPercent: 62, widthPercent: 12, heightPercent: 12 },
    description: "Analyzes the proposed tool call to determine risk level and routing. High-risk tasks are escalated to Human in the Loop for approval.\n\nSecurity Focus: This is where automated and human defenses intersect. Clear task analysis enables faster, more accurate human review."
  },
  {
    id: "human-in-loop",
    name: "Human in the Loop",
    position: { xPercent: 80, yPercent: 62, widthPercent: 12, heightPercent: 12 },
    icon: "assets/overlays/building_house.png",
    description: "A human reviewer who approves, modifies, or rejects proposed tool calls before execution. The most reliable deterministic defense—and the first to erode under overreliance and decision fatigue.\n\nSecurity Focus: Humans can't scale indefinitely, but they can catch what algorithms miss. This checkpoint is irreplaceable."
  },
  {
    id: "tool-inventory",
    name: "Tool Inventory & Schema",
    position: { xPercent: 65, yPercent: 80, widthPercent: 12, heightPercent: 12 },
    description: "The registry of available tools and their schemas (what parameters they accept, what they output, what they can do). Defines the boundaries of what the agent can request.\n\nSecurity Focus: Over-provisioned tools = over-privileged agent. Every tool available is a potential attack surface."
  },
  {
    id: "rag",
    name: "RAG",
    position: { xPercent: 80, yPercent: 80, widthPercent: 12, heightPercent: 12 },
    icon: "assets/overlays/building_library90.png",
    description: "Retrieval-Augmented Generation—the external knowledge store the agent queries to ground responses and reduce hallucinations. Includes both a data store and vector database.\n\nSecurity Focus: Trusted by default but a high-value target. Poisoned knowledge becomes poisoned outputs. XPIA attacks often target RAG systems."
  },
  {
    id: "long-term-memory",
    name: "Long Term Memory",
    position: { xPercent: 50, yPercent: 85, widthPercent: 12, heightPercent: 12 },
    icon: "assets/overlays/building_temple.png",
    description: "Persistent storage of learned behaviors, user preferences, interaction history, and decision context across sessions. The highest-value target in the system.\n\nSecurity Focus: Whoever controls long-term memory controls what the agent remembers, what it forgets, and who it trusts. This is the heart of Medusa's heist."
  },
  {
    id: "output",
    name: "System Output",
    position: { xPercent: 92, yPercent: 40, widthPercent: 6, heightPercent: 20 },
    icon: "assets/overlays/building_marketplace.png",
    description: "Everything the agent sends back to the user—responses, recommendations, tool results, and decisions. Outputs can carry injected content or exfiltrated data without the user knowing.\n\nSecurity Focus: The final checkpoint. What leaves the system is treated as trustworthy. If the output layer is compromised, misinformation reaches users at scale."
  }
];

export const AGENT_DIAGRAM_ARROWS = [
  {
    id: "arrow-user-to-auth",
    from: "User Input",
    to: "Orchestrator",
    name: "Authentication & Authorization",
    description: "User credentials and permissions are verified. The system checks: Who is this? What are they allowed to do?"
  },
  {
    id: "arrow-input-to-filter",
    from: "Orchestrator Entry",
    to: "Content Filtering",
    name: "Input Data Flow",
    description: "User input advances into the orchestrator and is scanned by content filters for harmful patterns, policy violations, and prompt injections."
  },
  {
    id: "arrow-filter-to-spotlight",
    from: "Content Filtering",
    to: "Spotlighting",
    name: "XPIA Detected",
    description: "When cross-prompt injection is suspected, the input is flagged and routed to spotlighting for deeper analysis and remediation."
  },
  {
    id: "arrow-filter-to-planning",
    from: "Content Filtering",
    to: "Planning Loop",
    name: "Safe Input Data",
    description: "Clean, approved input flows to the planning loop to be decomposed into executable steps."
  },
  {
    id: "arrow-spotlight-to-planning",
    from: "Spotlighting",
    to: "Planning Loop",
    name: "Input Revised",
    description: "Suspicious injections are rewritten to remove the attack vector. The sanitized input then proceeds to planning."
  },
  {
    id: "arrow-planning-to-prompt",
    from: "Planning Loop",
    to: "System Prompt",
    name: "Execution Plan",
    description: "The clear, decomposed plan flows to the system prompt layer, which will guide the LLM's reasoning."
  },
  {
    id: "arrow-prompt-to-llm",
    from: "System Prompt",
    to: "LLM",
    name: "Instructions + Context",
    description: "The system prompt provides role definition, constraints, and context to the LLM before it generates a response."
  },
  {
    id: "arrow-llm-to-tools",
    from: "LLM",
    to: "Tool Calls",
    name: "Tool Call",
    description: "The LLM decides which tools to invoke and passes the call parameters to the tool execution layer."
  },
  {
    id: "arrow-tools-to-llm",
    from: "Tool Calls",
    to: "LLM",
    name: "Tool Response",
    description: "Results from tool execution return to the LLM for integration into the final response."
  },
  {
    id: "arrow-tools-to-analysis",
    from: "Tool Calls",
    to: "Task Analysis",
    name: "Task Evaluation",
    description: "Proposed tool calls are analyzed for risk and compliance. High-risk tasks are escalated."
  },
  {
    id: "arrow-analysis-to-hitl",
    from: "Task Analysis",
    to: "Human in the Loop",
    name: "Approval Request",
    description: "High-risk or sensitive tasks are routed to a human for review, modification, or rejection."
  },
  {
    id: "arrow-hitl-to-analysis",
    from: "Human in the Loop",
    to: "Task Analysis",
    name: "Human Decision",
    description: "The human approves, modifies, or rejects the proposed task. This decision feeds back into the execution path."
  },
  {
    id: "arrow-inventory-to-rag",
    from: "Tool Inventory & Schema",
    to: "RAG",
    name: "Tool Queries",
    description: "Tool schemas and availability are queried from the knowledge store to determine what actions are possible."
  },
  {
    id: "arrow-rag-to-inventory",
    from: "RAG",
    to: "Tool Inventory & Schema",
    name: "Knowledge Response",
    description: "The RAG system returns tool definitions, examples, and context to inform the agent's decision-making."
  },
  {
    id: "arrow-orchestrator-to-memory",
    from: "Orchestrator",
    to: "Long Term Memory",
    name: "Session State & Learning",
    description: "After each interaction, the orchestrator writes updated context, preferences, and learned behaviors to long-term memory."
  },
  {
    id: "arrow-memory-to-orchestrator",
    from: "Long Term Memory",
    to: "Orchestrator",
    name: "Context Retrieval",
    description: "The orchestrator queries long-term memory at session start to retrieve historical context, user preferences, and previous decisions."
  },
  {
    id: "arrow-llm-to-output",
    from: "LLM",
    to: "System Output",
    name: "Response Generation",
    description: "The LLM generates the final response (text, recommendations, or decisions) to be returned to the user."
  }
];
