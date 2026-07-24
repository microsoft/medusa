/**
 * Reusable help dialog with a toggle button.
 * Shows a modal dialog on startup and adds a help button to toggle it.
 */
export class HelpDialog {
  /**
   * @param {import('./engine.js').MedusaEngine} engine
   * @param {Object} opts
   * @param {string} opts.content - Dialog body HTML
   * @param {string} [opts.title='How to Play'] - Dialog title
   * @param {Object} [opts.padding] - { top, right, bottom, left } in virtual coordinates
   * @param {number} [opts.height=900] - Dialog height in virtual coordinates (width computed from image aspect ratio)
   * @param {boolean} [opts.showOnStart=true] - Auto-show on construction
   * @param {string} [opts.backgroundImage='../assets/dialog.png'] - Dialog background image path
   * @param {string} [opts.buttonImage='../assets/button_help.png'] - Help button image path
   */
  constructor(engine, opts) {
    this._engine = engine;
    this._opts = {
      title: 'How to Play',
      height: 900,
      showOnStart: true,
      backgroundImage: '../assets/dialog.png',
      buttonImage: '../assets/button_help.png',
      ...opts
    };
    this._dialogOpts = null;
    this._button = null;
    this._ready = this._init();
  }

  async _init() {
    const { _engine: engine, _opts: opts } = this;

    // Load background image and compute aspect-ratio width
    const img = new Image();
    const width = await new Promise(resolve => {
      let settled = false;
      const finish = (ratio) => {
        if (settled) return;
        settled = true;
        resolve(Math.round(opts.height * ratio));
      };

      img.onload = () => {
        const hasSize = img.naturalWidth > 0 && img.naturalHeight > 0;
        const ratio = hasSize ? (img.naturalWidth / img.naturalHeight) : (4 / 3);
        finish(ratio);
      };

      img.onerror = () => {
        console.warn(`[HelpDialog] Failed to load background image: ${opts.backgroundImage}`);
        finish(4 / 3);
      };

      img.src = opts.backgroundImage;

      // If the image is already cached, ensure we still resolve.
      if (img.complete) {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          img.onload();
        } else {
          img.onerror();
        }
      }
    });

    // Create help button
    this._button = document.createElement('img');
    this._button.src = opts.buttonImage;
    this._button.className = 'medusa-help-button';
    engine.container.appendChild(this._button);

    // Build dialog options
    this._dialogOpts = {
      width,
      height: opts.height,
      anchor: 'center',
      modal: true,
      closable: true,
      title: opts.title,
      content: opts.content,
      background: { image: opts.backgroundImage },
      target: this._button
    };
    if (opts.padding) {
      this._dialogOpts.padding = opts.padding;
    }

    // Toggle on button click
    this._button.addEventListener('click', () => this.toggle());

    // Show on startup if configured
    if (opts.showOnStart) {
      this.show();
    }
  }

  show() {
    if (this._dialogOpts) {
      this._engine.dialogs.show('help', this._dialogOpts);
      const el = this._engine.dialogs.get('help');
      if (el) el.classList.add('medusa-help-content');
    }
  }

  hide() {
    this._engine.dialogs.hide('help');
  }

  toggle() {
    const existing = this._engine.dialogs.get('help');
    if (existing) {
      this.hide();
    } else {
      this.show();
    }
  }
}
