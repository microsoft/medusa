/**
 * Dialog system for showing popups, tutorials, and messages.
 * Positions are in virtual coordinates; the manager scales with the viewport.
 */
export class DialogManager {
  /**
   * @param {HTMLElement} container - The engine container element
   * @param {import('./events.js').EventBus} events - Event bus instance
   * @param {() => number} getScale - Returns current virtual→pixel scale factor
   */
  constructor(container, events, getScale) {
    this._container = container;
    this._events = events;
    this._getScale = getScale;
    /** @type {Map<string, { el: HTMLElement, backdrop: HTMLElement|null, opts: Object }>} */
    this._dialogs = new Map();
    this._onResize = () => this._layoutAll();
    this._events.on('engine:resize', this._onResize);
  }

  /**
   * Show a dialog.
   * @param {string} id - Unique dialog identifier
   * @param {Object} opts
   * @param {number} opts.width - Width in virtual coordinates
   * @param {number} opts.height - Height in virtual coordinates
   * @param {string} [opts.anchor='center'] - 'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
   * @param {number} [opts.offsetX=0] - Offset from anchor in virtual coordinates
   * @param {number} [opts.offsetY=0] - Offset from anchor in virtual coordinates
   * @param {Object} [opts.background] - { image: string } or { color: string, opacity?: number }
   * @param {string} [opts.title] - Title text
   * @param {string} [opts.content] - Body content (HTML)
   * @param {boolean} [opts.closable=true] - Show close button
   * @param {boolean} [opts.modal=false] - Show backdrop overlay
   * @param {HTMLElement} [opts.target=null] - DOM element to animate from/to (e.g. a button)
   * @param {Object} [opts.padding] - Padding in virtual coordinates { top, right, bottom, left }
   */
  show(id, opts) {
    // Remove existing dialog with same id
    if (this._dialogs.has(id)) this.hide(id);

    const o = {
      anchor: 'center',
      offsetX: 0,
      offsetY: 0,
      closable: true,
      modal: false,
      target: null,
      ...opts
    };

    // Modal backdrop
    let backdrop = null;
    if (o.modal) {
      backdrop = document.createElement('div');
      backdrop.classList.add('medusa-dialog-backdrop');
      if (o.closable) {
        backdrop.addEventListener('click', () => this.hide(id));
      }
      this._container.appendChild(backdrop);
    }

    // Dialog element
    const el = document.createElement('div');
    el.classList.add('medusa-dialog');
    el.dataset.dialogId = id;

    // Background
    if (o.background) {
      if (o.background.image) {
        el.style.backgroundImage = `url(${CSS.escape(o.background.image)})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.style.backgroundColor = 'transparent';
      } else if (o.background.color) {
        const opacity = o.background.opacity != null ? o.background.opacity : 1;
        el.style.backgroundColor = o.background.color;
        el.style.opacity = opacity;
      }
    }

    // Close button
    if (o.closable) {
      const closeBtn = document.createElement('button');
      closeBtn.classList.add('medusa-dialog-close');
      closeBtn.textContent = '\u00D7';
      closeBtn.addEventListener('click', () => this.hide(id));
      el.appendChild(closeBtn);
    }

    // Wrapper for title + content with optional padding
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.flex = '1';
    wrapper.style.overflow = 'hidden';
    if (o.padding) {
      const s = this._getScale();
      const pt = (o.padding.top || 0) * s;
      const pr = (o.padding.right || 0) * s;
      const pb = (o.padding.bottom || 0) * s;
      const pl = (o.padding.left || 0) * s;
      wrapper.style.padding = `${pt}px ${pr}px ${pb}px ${pl}px`;
      wrapper.dataset.vPadTop = o.padding.top || 0;
      wrapper.dataset.vPadRight = o.padding.right || 0;
      wrapper.dataset.vPadBottom = o.padding.bottom || 0;
      wrapper.dataset.vPadLeft = o.padding.left || 0;
    }

    // Title
    if (o.title) {
      const titleEl = document.createElement('div');
      titleEl.classList.add('medusa-dialog-title');
      titleEl.textContent = o.title;
      wrapper.appendChild(titleEl);
    }

    // Content
    if (o.content) {
      const contentEl = document.createElement('div');
      contentEl.classList.add('medusa-dialog-content');
      contentEl.innerHTML = o.content;
      wrapper.appendChild(contentEl);
    }

    el.appendChild(wrapper);

    this._container.appendChild(el);
    this._dialogs.set(id, { el, backdrop, opts: o });
    this._layoutDialog(id);

    // Animate expand from target if provided
    if (o.target instanceof HTMLElement) {
      this._animateShow(el, o.target, backdrop);
    }

    this._events.emit('dialog:show', { id, ...o });
  }

  /** Hide and remove a dialog by id. Returns a Promise if animated. */
  hide(id) {
    const entry = this._dialogs.get(id);
    if (!entry) return;

    const target = entry.opts.target;
    if (target instanceof HTMLElement) {
      // Prevent double-hide while animating
      this._dialogs.delete(id);
      return this._animateHide(entry.el, target, entry.backdrop).then(() => {
        this._events.emit('dialog:hide', { id });
      });
    }

    entry.el.remove();
    if (entry.backdrop) entry.backdrop.remove();
    this._dialogs.delete(id);
    this._events.emit('dialog:hide', { id });
  }

  /** Hide all dialogs. */
  hideAll() {
    for (const id of [...this._dialogs.keys()]) {
      this.hide(id);
    }
  }

  /** Get the dialog DOM element for custom content injection. */
  get(id) {
    const entry = this._dialogs.get(id);
    return entry ? entry.el : null;
  }

  /** Reposition and resize all dialogs for current scale. */
  _layoutAll() {
    for (const id of this._dialogs.keys()) {
      this._layoutDialog(id);
    }
  }

  /** Position and size a single dialog. */
  _layoutDialog(id) {
    const entry = this._dialogs.get(id);
    if (!entry) return;

    const { el, opts } = entry;
    const s = this._getScale();
    const pw = this._container.clientWidth;
    const ph = this._container.clientHeight;
    const dw = opts.width * s;
    const dh = opts.height * s;
    const ox = opts.offsetX * s;
    const oy = opts.offsetY * s;

    el.style.width = `${dw}px`;
    el.style.height = `${dh}px`;

    let left, top;
    switch (opts.anchor) {
      case 'top-left':
        left = ox;
        top = oy;
        break;
      case 'top-right':
        left = pw - dw - ox;
        top = oy;
        break;
      case 'bottom-left':
        left = ox;
        top = ph - dh - oy;
        break;
      case 'bottom-right':
        left = pw - dw - ox;
        top = ph - dh - oy;
        break;
      case 'center':
      default:
        left = (pw - dw) / 2 + ox;
        top = (ph - dh) / 2 + oy;
        break;
    }

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;

    // Rescale padding wrapper if present
    const wrapper = el.querySelector(':scope > div[data-v-pad-top]');
    if (wrapper) {
      const pt = parseFloat(wrapper.dataset.vPadTop) * s;
      const pr = parseFloat(wrapper.dataset.vPadRight) * s;
      const pb = parseFloat(wrapper.dataset.vPadBottom) * s;
      const pl = parseFloat(wrapper.dataset.vPadLeft) * s;
      wrapper.style.padding = `${pt}px ${pr}px ${pb}px ${pl}px`;
    }
  }

  _animateShow(el, targetEl, backdrop) {
    const dialogRect = el.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const dx = (targetRect.left + targetRect.width / 2) - (dialogRect.left + dialogRect.width / 2);
    const dy = (targetRect.top + targetRect.height / 2) - (dialogRect.top + dialogRect.height / 2);
    const scale = Math.min(targetRect.width / dialogRect.width, targetRect.height / dialogRect.height, 0.3);

    // Start at the target's position, scaled down and invisible
    el.style.transition = 'none';
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    el.style.opacity = '0';
    if (backdrop) {
      backdrop.style.transition = 'none';
      backdrop.style.opacity = '0';
    }
    // Force reflow
    el.offsetHeight;
    // Animate to final position
    el.style.transition = 'transform 400ms ease-out, opacity 300ms ease-out';
    el.style.transform = '';
    el.style.opacity = '';
    if (backdrop) {
      backdrop.style.transition = 'opacity 300ms ease-out';
      backdrop.style.opacity = '';
    }
    // Clean up transition after animation
    setTimeout(() => {
      el.style.transition = '';
      if (backdrop) backdrop.style.transition = '';
    }, 400);
  }

  _animateHide(el, targetEl, backdrop) {
    return new Promise(resolve => {
      const dialogRect = el.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const dx = (targetRect.left + targetRect.width / 2) - (dialogRect.left + dialogRect.width / 2);
      const dy = (targetRect.top + targetRect.height / 2) - (dialogRect.top + dialogRect.height / 2);
      const scale = Math.min(targetRect.width / dialogRect.width, targetRect.height / dialogRect.height, 0.3);

      el.style.pointerEvents = 'none';
      el.style.transition = 'transform 400ms ease-in, opacity 400ms ease-in';
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
      el.style.opacity = '0';
      if (backdrop) {
        backdrop.style.transition = 'opacity 400ms ease-in';
        backdrop.style.opacity = '0';
      }
      setTimeout(() => {
        el.remove();
        if (backdrop) backdrop.remove();
        resolve();
      }, 400);
    });
  }

  /** Remove all dialogs and clean up. */
  destroy() {
    this.hideAll();
    this._events.off('engine:resize', this._onResize);
  }
}
