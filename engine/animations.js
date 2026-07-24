/**
 * Canvas-based animation manager for travel-path sprites.
 * Renders animated sprites on a canvas overlay (pointer-events: none).
 * All positions in virtual coordinates, scaled at runtime.
 */
export class AnimationManager {
  /**
   * @param {HTMLElement} townLayer - The town layer element to overlay
   * @param {Object} config - Parsed game config
   * @param {Function} getScale - Function that returns current scale factor
   */
  constructor(townLayer, config, getScale) {
    this._townLayer = townLayer;
    this._config = config;
    this._getScale = getScale;
    this._canvas = null;
    this._ctx = null;
    this._animations = new Map();
    this._images = new Map();
    this._running = false;
    this._rafId = null;
  }

  /** Initialize: create canvas, load images, start loop. */
  async init() {
    this._canvas = document.createElement('canvas');
    this._canvas.classList.add('medusa-canvas-overlay');
    this._townLayer.appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d');

    this._resizeCanvas();
    this._resizeObserver = new ResizeObserver(() => this._resizeCanvas());
    this._resizeObserver.observe(this._townLayer);

    // Load all animation images
    await Promise.all(
      this._config.animations.map(anim => this._loadImage(anim.id, anim.image))
    );

    // Initialize animation states
    for (const anim of this._config.animations) {
      this._animations.set(anim.id, {
        config: anim,
        startTime: null,
        paused: false,
        delayRemaining: anim.delay || 0
      });
    }

    this._running = true;
    this._rafId = requestAnimationFrame((t) => this._tick(t));
  }

  _resizeCanvas() {
    this._canvas.width = this._townLayer.clientWidth;
    this._canvas.height = this._townLayer.clientHeight;
  }

  _loadImage(id, src) {
    return new Promise((resolve, reject) => {
      if (this._images.has(id)) { resolve(); return; }
      const img = new Image();
      img.onload = () => { this._images.set(id, img); resolve(); };
      img.onerror = () => {
        console.warn(`Failed to load animation image: ${src}`);
        resolve(); // Don't block on missing images
      };
      img.src = src;
    });
  }

  _tick(timestamp) {
    if (!this._running) return;

    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    const scale = this._getScale();
    const completed = [];

    for (const [id, state] of this._animations) {
      if (state.paused) continue;

      const img = this._images.get(id);
      if (!img) continue;

      const { config } = state;

      // Initialize start time (accounting for delay)
      if (state.startTime === null) {
        state.startTime = timestamp + (config.delay || 0);
      }

      // Still in delay period
      if (timestamp < state.startTime) continue;

      const elapsed = timestamp - state.startTime;
      const duration = config.duration;
      let progress = elapsed / duration;

      if (!config.loop && progress >= 1) {
        completed.push(id);
        progress = 1;
      } else {
        progress = progress % 1;
      }

      // Interpolate position along path
      const pos = this._interpolatePath(config.path, progress);

      // Draw sprite centered at position
      const drawWidth = (config.width || img.naturalWidth) * scale;
      const drawHeight = (config.height || img.naturalHeight) * scale;
      const drawX = pos.x * scale - drawWidth / 2;
      const drawY = pos.y * scale - drawHeight / 2;

      // Optional opacity from path waypoints
      const opacity = pos.opacity != null ? pos.opacity : 1;
      this._ctx.globalAlpha = opacity;
      this._ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      this._ctx.globalAlpha = 1;
    }

    for (const id of completed) {
      const state = this._animations.get(id);
      if (state && state.onComplete) state.onComplete();
      this._animations.delete(id);
      this._images.delete(id);
    }

    this._rafId = requestAnimationFrame((t) => this._tick(t));
  }

  /**
   * Interpolate position along a path at a given progress (0-1).
   * Each waypoint has { x, y, t } where t is normalized (0-1).
   * Optionally { opacity } for fade effects.
   */
  _interpolatePath(path, progress) {
    // Clamp
    if (progress <= path[0].t) return { x: path[0].x, y: path[0].y, opacity: path[0].opacity };
    if (progress >= path[path.length - 1].t) {
      const last = path[path.length - 1];
      return { x: last.x, y: last.y, opacity: last.opacity };
    }

    // Find segment
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      if (progress >= a.t && progress <= b.t) {
        const segProgress = (progress - a.t) / (b.t - a.t);
        return {
          x: a.x + (b.x - a.x) * segProgress,
          y: a.y + (b.y - a.y) * segProgress,
          opacity: a.opacity != null && b.opacity != null
            ? a.opacity + (b.opacity - a.opacity) * segProgress
            : undefined
        };
      }
    }

    return { x: path[0].x, y: path[0].y };
  }

  // --- Public API ---

  /** Play (resume) an animation by id. */
  play(id) {
    const state = this._animations.get(id);
    if (state) {
      state.paused = false;
      state.startTime = null; // Reset timing
    }
  }

  /** Pause an animation by id. */
  pause(id) {
    const state = this._animations.get(id);
    if (state) state.paused = true;
  }

  /** Remove an animation by id. */
  remove(id) {
    this._animations.delete(id);
    this._images.delete(id);
  }

  /** Add a new animation at runtime. Returns a promise (loads image). */
  async add(animConfig) {
    await this._loadImage(animConfig.id, animConfig.image);
    this._animations.set(animConfig.id, {
      config: animConfig,
      startTime: null,
      paused: false,
      delayRemaining: animConfig.delay || 0,
      onComplete: animConfig.onComplete || null
    });
  }

  /** Get the canvas element. */
  getCanvas() {
    return this._canvas;
  }

  /** Cleanup. */
  destroy() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    if (this._canvas) this._canvas.remove();
    this._animations.clear();
    this._images.clear();
  }
}
