/**
 * DOM-based town renderer: background, overlays, clickable zones.
 * All positions use virtual coordinates; scaled to actual container size at runtime.
 */
export class TownRenderer {
  /**
   * @param {HTMLElement} container - The DOM element to render into
   * @param {Object} config - Parsed game config
   * @param {import('./events.js').EventBus} events - Event bus instance
   */
  constructor(container, config, events) {
    this._container = container;
    this._config = config;
    this._events = events;
    this._scale = 1;
    this._zones = new Map();
    this._overlays = new Map();
    this._zoneElements = new Map();
    this._overlayElements = new Map();
    this._zoneOverlays = new Map(); // zone id → [overlay id]
    this._highlightedZones = new Set();
    this._bgElement = null;
    this._townLayer = null;
  }

  /** Initialize rendering. Call once after construction. */
  init() {
    const { virtualWidth, virtualHeight } = this._config.meta;

    // Create town layer (DOM layer for bg, overlays, zones)
    this._townLayer = document.createElement('div');
    this._townLayer.classList.add('medusa-town-layer');
    this._townLayer.style.aspectRatio = `${virtualWidth} / ${virtualHeight}`;
    this._container.appendChild(this._townLayer);

    this._renderBackground();
    this._renderOverlays();
    this._renderZones();
    this._buildZoneOverlayLinks();
    this._computeScale();
    this._layoutAll();

    // Apply zone highlight config as CSS custom properties
    const hl = this._config.zoneHighlight;
    if (hl) {
      if (hl.color) this._container.style.setProperty('--zone-highlight-color', hl.color);
      if (hl.borderWidth) this._container.style.setProperty('--zone-highlight-border-width', `${hl.borderWidth}px`);
    }

    // Resize observer
    this._resizeObserver = new ResizeObserver(() => {
      this._computeScale();
      this._layoutAll();
      this._events.emit('engine:resize', {
        scale: this._scale,
        width: this._townLayer.clientWidth,
        height: this._townLayer.clientHeight
      });
    });
    this._resizeObserver.observe(this._townLayer);
  }

  /** Compute scale factor from virtual coords to actual pixels. */
  _computeScale() {
    const { virtualWidth } = this._config.meta;
    this._scale = this._townLayer.clientWidth / virtualWidth;
    this._container.style.setProperty('--medusa-scale', this._scale);
  }

  /** Reposition all overlays and zones based on current scale. */
  _layoutAll() {
    const s = this._scale;

    for (const [id, cfg] of this._overlays) {
      const el = this._overlayElements.get(id);
      if (cfg.x != null) el.style.left = `${cfg.x * s}px`;
      if (cfg.y != null) el.style.top = `${cfg.y * s}px`;
      if (cfg.width != null) el.style.width = `${cfg.width * s}px`;
      if (cfg.height != null) el.style.height = `${cfg.height * s}px`;
    }

    for (const [id, cfg] of this._zones) {
      const el = this._zoneElements.get(id);
      el.style.left = `${cfg.x * s}px`;
      el.style.top = `${cfg.y * s}px`;
      el.style.width = `${cfg.width * s}px`;
      el.style.height = `${cfg.height * s}px`;

      // Scale font size for label
      const label = el.querySelector('.medusa-zone-label');
      if (label) {
        label.style.fontSize = `${24 * s}px`;
      }
    }
  }

  _renderBackground() {
    const img = document.createElement('img');
    img.classList.add('medusa-bg');
    img.src = this._config.background.image;
    img.alt = 'Town background';
    img.draggable = false;
    this._bgElement = img;
    this._townLayer.appendChild(img);
  }

  _renderOverlays() {
    for (const cfg of this._config.overlays) {
      this._createOverlayElement(cfg);
    }
  }

  _createOverlayElement(cfg) {
    const img = document.createElement('img');
    img.classList.add('medusa-overlay');
    img.src = cfg.image;
    img.alt = cfg.id;
    img.draggable = false;
    if (cfg.z != null) img.style.zIndex = cfg.z;
    if (cfg.visible === false) img.style.display = 'none';

    this._overlays.set(cfg.id, cfg);
    this._overlayElements.set(cfg.id, img);
    this._townLayer.appendChild(img);
  }

  _renderZones() {
    // Ensure zones always render above overlays
    const maxOverlayZ = this._config.overlays.reduce((max, o) => Math.max(max, o.z ?? 0), 0);
    const zoneZ = maxOverlayZ + 1;

    for (const cfg of this._config.zones) {
      const el = document.createElement('div');
      el.classList.add('medusa-zone');
      el.style.zIndex = zoneZ;
      if (cfg.cssClass) el.classList.add(cfg.cssClass);
      el.dataset.zoneId = cfg.id;

      // Label
      if (cfg.label) {
        const label = document.createElement('span');
        label.classList.add('medusa-zone-label');
        label.textContent = cfg.label;
        el.appendChild(label);
      }

      // Store zone config with state
      const zoneState = { ...cfg, state: 'default' };
      this._zones.set(cfg.id, zoneState);
      this._zoneElements.set(cfg.id, el);

      // Event handlers (mouse + touch)
      el.addEventListener('click', (e) => {
        if (zoneState.state === 'disabled') return;
        this._events.emit('zone:click', { id: cfg.id, data: cfg.data, event: e });
      });
      el.addEventListener('pointerenter', () => {
        if (zoneState.state === 'disabled') return;
        this._events.emit('zone:hover', { id: cfg.id, data: cfg.data });
      });
      el.addEventListener('pointerleave', () => {
        this._events.emit('zone:leave', { id: cfg.id, data: cfg.data });
      });

      this._townLayer.appendChild(el);
    }
  }

  /** Build zone → overlay link map from zone configs. */
  _buildZoneOverlayLinks() {
    for (const [id, cfg] of this._zones) {
      if (cfg.overlays && cfg.overlays.length > 0) {
        this._zoneOverlays.set(id, cfg.overlays);
      }
    }
  }

  /** Get overlay IDs linked to a zone. */
  getLinkedOverlays(zoneId) {
    return this._zoneOverlays.get(zoneId) || [];
  }

  // --- Public API ---

  /** Get zone config + state by id. */
  getZone(id) {
    return this._zones.get(id) || null;
  }

  /** Set visual state on a zone.
   * @param {string} id
   * @param {'default'|'highlighted'|'active'|'disabled'} state
   */
  setZoneState(id, state) {
    const zone = this._zones.get(id);
    const el = this._zoneElements.get(id);
    if (!zone || !el) return;

    // Remove previous state class
    el.classList.remove(`medusa-zone--${zone.state}`);
    zone.state = state;
    if (state !== 'default') {
      el.classList.add(`medusa-zone--${state}`);
    }
  }

  /** Enable or disable pointer interaction on all zones. */
  setZonesInteractive(enabled) {
    for (const el of this._zoneElements.values()) {
      el.style.pointerEvents = enabled ? '' : 'none';
    }
  }

  /** Show an overlay by id. */
  showOverlay(id) {
    const el = this._overlayElements.get(id);
    if (el) el.style.display = '';
  }

  /** Hide an overlay by id. */
  hideOverlay(id) {
    const el = this._overlayElements.get(id);
    if (el) el.style.display = 'none';
  }

  /** Dynamically add an overlay at runtime. */
  addOverlay(cfg) {
    if (this._overlays.has(cfg.id)) return;
    this._createOverlayElement(cfg);
    this._computeScale();
    this._layoutAll();
  }

  /** Remove an overlay by id. */
  removeOverlay(id) {
    const el = this._overlayElements.get(id);
    if (el) el.remove();
    this._overlays.delete(id);
    this._overlayElements.delete(id);
    // Remove from any zone links
    for (const [zoneId, overlayIds] of this._zoneOverlays) {
      const idx = overlayIds.indexOf(id);
      if (idx !== -1) overlayIds.splice(idx, 1);
    }
  }

  /** Get the overlay DOM element by id. */
  getOverlayElement(id) {
    return this._overlayElements.get(id) || null;
  }

  /** Update an overlay's size in virtual coordinates. */
  setOverlaySize(id, width, height) {
    const overlay = this._overlays.get(id);
    if (!overlay) return;
    overlay.width = width;
    overlay.height = height;
    const s = this._scale;
    const el = this._overlayElements.get(id);
    if (el) {
      el.style.width = `${width * s}px`;
      el.style.height = `${height * s}px`;
    }
  }

  /** Update an overlay's image source. */
  setOverlayImage(id, image) {
    const overlay = this._overlays.get(id);
    if (!overlay) return;
    overlay.image = image;
    const el = this._overlayElements.get(id);
    if (el) el.src = image;
  }

  /** Get the town layer element (for canvas overlay positioning). */
  getTownLayer() {
    return this._townLayer;
  }

  /** Get current scale factor. */
  getScale() {
    return this._scale;
  }

  /** Get all zone configs as an array. */
  getAllZones() {
    return Array.from(this._zones.values());
  }

  /** Get all overlay configs as an array. */
  getAllOverlays() {
    return Array.from(this._overlays.values());
  }

  /** Update a zone's position in virtual coordinates. Linked overlays move with it. */
  setZonePosition(id, x, y) {
    const zone = this._zones.get(id);
    if (!zone) return;
    const dx = x - zone.x;
    const dy = y - zone.y;
    zone.x = x;
    zone.y = y;
    const s = this._scale;
    const el = this._zoneElements.get(id);
    if (el) {
      el.style.left = `${x * s}px`;
      el.style.top = `${y * s}px`;
    }
    // Move linked overlays by the same delta
    for (const overlayId of this.getLinkedOverlays(id)) {
      const overlay = this._overlays.get(overlayId);
      if (overlay) this.setOverlayPosition(overlayId, overlay.x + dx, overlay.y + dy);
    }
  }

  /** Update an overlay's position in virtual coordinates. */
  setOverlayPosition(id, x, y) {
    const overlay = this._overlays.get(id);
    if (!overlay) return;
    overlay.x = x;
    overlay.y = y;
    const s = this._scale;
    const el = this._overlayElements.get(id);
    if (el) {
      el.style.left = `${x * s}px`;
      el.style.top = `${y * s}px`;
    }
  }

  /** Get the zone DOM element by id. */
  getZoneElement(id) {
    return this._zoneElements.get(id) || null;
  }

  /** Dynamically add a zone at runtime. */
  addZone(cfg) {
    if (this._zones.has(cfg.id)) return;
    const maxOverlayZ = this._config.overlays.reduce((max, o) => Math.max(max, o.z ?? 0), 0);
    const zoneZ = maxOverlayZ + 1;

    const el = document.createElement('div');
    el.classList.add('medusa-zone');
    el.style.zIndex = zoneZ;
    if (cfg.cssClass) el.classList.add(cfg.cssClass);
    el.dataset.zoneId = cfg.id;

    if (cfg.label) {
      const label = document.createElement('span');
      label.classList.add('medusa-zone-label');
      label.textContent = cfg.label;
      el.appendChild(label);
    }

    const zoneState = { ...cfg, state: 'default' };
    this._zones.set(cfg.id, zoneState);
    this._zoneElements.set(cfg.id, el);

    el.addEventListener('click', (e) => {
      if (zoneState.state === 'disabled') return;
      this._events.emit('zone:click', { id: cfg.id, data: cfg.data, event: e });
    });
    el.addEventListener('pointerenter', () => {
      if (zoneState.state === 'disabled') return;
      this._events.emit('zone:hover', { id: cfg.id, data: cfg.data });
    });
    el.addEventListener('pointerleave', () => {
      this._events.emit('zone:leave', { id: cfg.id, data: cfg.data });
    });

    this._townLayer.appendChild(el);

    if (cfg.overlays && cfg.overlays.length > 0) {
      this._zoneOverlays.set(cfg.id, cfg.overlays);
    }

    this._layoutAll();
  }

  /** Remove a zone by id. */
  removeZone(id) {
    const el = this._zoneElements.get(id);
    if (el) el.remove();
    this._zones.delete(id);
    this._zoneElements.delete(id);
    this._zoneOverlays.delete(id);
  }

  /** Update a zone's size in virtual coordinates. */
  setZoneSize(id, width, height) {
    const zone = this._zones.get(id);
    if (!zone) return;
    zone.width = width;
    zone.height = height;
    const s = this._scale;
    const el = this._zoneElements.get(id);
    if (el) {
      el.style.width = `${width * s}px`;
      el.style.height = `${height * s}px`;
    }
  }

  /** Update a zone's label text. */
  setZoneLabel(id, label) {
    const zone = this._zones.get(id);
    if (!zone) return;
    zone.label = label;
    const el = this._zoneElements.get(id);
    if (!el) return;
    let span = el.querySelector('.medusa-zone-label');
    if (label) {
      if (!span) {
        span = document.createElement('span');
        span.classList.add('medusa-zone-label');
        el.appendChild(span);
      }
      span.textContent = label;
    } else if (span) {
      span.remove();
    }
  }

  /** Highlight one or more zones with the configured highlight style. */
  highlightZones(ids) {
    const list = Array.isArray(ids) ? ids : [ids];
    for (const id of list) {
      const el = this._zoneElements.get(id);
      if (el) {
        el.classList.add('medusa-zone--highlight');
        this._highlightedZones.add(id);
      }
    }
  }

  /** Clear highlights from zones. Without args, clears all. */
  clearHighlights(ids) {
    const list = ids ? (Array.isArray(ids) ? ids : [ids]) : [...this._highlightedZones];
    for (const id of list) {
      const el = this._zoneElements.get(id);
      if (el) el.classList.remove('medusa-zone--highlight');
      this._highlightedZones.delete(id);
    }
  }

  /** Cleanup. */
  destroy() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    this._townLayer.remove();
    this._zones.clear();
    this._overlays.clear();
    this._zoneElements.clear();
    this._overlayElements.clear();
  }
}
