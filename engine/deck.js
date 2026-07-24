/**
 * Deck — displays a scrollable row of cards at the bottom of the screen.
 * Each deck instance manages its own card collection and pagination.
 *
 * Events emitted: card:select, card:deselect, card:hover, card:leave, card:flip
 */
export class Deck {
  constructor(id, container, settings, events, getScale) {
    this._id = id;
    this._container = container;
    this._settings = settings;
    this._events = events;
    this._getScale = getScale;
    this._cards = new Map(); // id → { data, element }
    this._selectedIds = new Set();
    this._disabledIds = new Set();
    this._interactive = true;
    this._pageSize = settings.pageSize != null ? settings.pageSize : 5;
    this._pageIndex = 0;
    this._scrollDirection = 0; // -1 = left, 1 = right, 0 = initial
    this._el = null;
    this._arrowLeft = null;
    this._arrowRight = null;
    this._cardWrapper = null;
    this._cardContainer = null;
    this._unsub = null;
  }

  get id() { return this._id; }

  get element() { return this._el; }

  init() {
    this._el = document.createElement('div');
    this._el.classList.add('medusa-deck');
    this._el.dataset.deckId = this._id;

    this._arrowLeft = document.createElement('button');
    this._arrowLeft.classList.add('medusa-card-arrow', 'medusa-card-arrow--left');
    this._arrowLeft.innerHTML = '&#9664;';
    this._arrowLeft.addEventListener('click', () => this._changePage(-1));

    this._cardWrapper = document.createElement('div');
    this._cardWrapper.classList.add('medusa-card-wrapper');

    this._cardContainer = document.createElement('div');
    this._cardContainer.classList.add('medusa-card-container');
    this._cardWrapper.appendChild(this._cardContainer);

    this._arrowRight = document.createElement('button');
    this._arrowRight.classList.add('medusa-card-arrow', 'medusa-card-arrow--right');
    this._arrowRight.innerHTML = '&#9654;';
    this._arrowRight.addEventListener('click', () => this._changePage(1));

    this._el.appendChild(this._arrowLeft);
    this._el.appendChild(this._cardWrapper);
    this._el.appendChild(this._arrowRight);
    this._container.appendChild(this._el);

    this._unsub = this._events.on('engine:resize', () => this._layout());
  }

  add({ id, image, title, description, back, ...meta }) {
    if (this._cards.has(id)) return;
    const data = { id, image, title, description, back, ...meta };
    const element = this._createCardElement(data);
    this._cards.set(id, { data, element });
    this._cardContainer.appendChild(element);
    this._layout();
  }

  async remove(id, { animate, target } = {}) {
    const entry = this._cards.get(id);
    if (!entry) return;
    if (this._selectedIds.has(id)) {
      this._doDeselect(id);
    }
    this._disabledIds.delete(id);
    // Snapshot remaining card positions BEFORE animation for FLIP
    let snapshots;
    if (animate) {
      snapshots = new Map();
      for (const [cid, e] of this._cards) {
        if (cid === id) continue;
        snapshots.set(cid, e.element.getBoundingClientRect());
      }
    }
    if (animate && this._isCardVisible(id)) {
      this._cardWrapper.style.overflow = 'visible';
      if (animate === 'drop') {
        await this._animateCardDrop(entry.element);
      } else if (animate === 'flyTo' && target) {
        await this._animateCardFlyTo(entry.element, target);
      }
      this._cardWrapper.style.overflow = '';
    }
    entry.element.remove();
    this._cards.delete(id);
    this._layout();
    if (snapshots) {
      this._flipAnimate(snapshots, 300);
    }
  }

  update(id, { image, title, description, back, ...meta }) {
    const entry = this._cards.get(id);
    if (!entry) return;
    const data = { id, image, title, description, back, ...meta };
    entry.data = data;

    const el = entry.element;
    const cfg = this._settings;
    const wasFlipped = el.classList.contains('medusa-card--flipped');

    // Rebuild front face
    const oldFront = el.querySelector('.medusa-card-front');
    if (oldFront) oldFront.remove();
    const frontEl = document.createElement('div');
    frontEl.classList.add('medusa-card-front');
    this._createFaceContent(frontEl, image, title, description, cfg.front);
    el.prepend(frontEl);

    // Rebuild back face
    const oldBack = el.querySelector('.medusa-card-back');
    if (oldBack) oldBack.remove();
    if (back && cfg.back) {
      const backEl = document.createElement('div');
      backEl.classList.add('medusa-card-back');
      this._createFaceContent(backEl, back.image, back.title, back.description, cfg.back);
      el.appendChild(backEl);
    }

    // Restore flip state
    if (wasFlipped && back) {
      el.classList.add('medusa-card--flipped');
    } else {
      el.classList.remove('medusa-card--flipped');
    }

    this._layout();
  }

  disable(id) {
    const entry = this._cards.get(id);
    if (!entry) return;
    if (this._disabledIds.has(id)) return;
    if (this._selectedIds.has(id)) this._doDeselect(id);
    this._disabledIds.add(id);
    entry.element.classList.add('medusa-card--disabled');
  }

  enable(id) {
    const entry = this._cards.get(id);
    if (!entry) return;
    if (!this._disabledIds.has(id)) return;
    this._disabledIds.delete(id);
    entry.element.classList.remove('medusa-card--disabled');
  }

  isDisabled(id) {
    return this._disabledIds.has(id);
  }

  select(id) {
    if (this._disabledIds.has(id)) return;
    if (this._selectedIds.has(id)) return;
    if (!this._settings.multiSelect) {
      for (const sid of this._selectedIds) this._doDeselect(sid);
    }
    const entry = this._cards.get(id);
    if (!entry) return;
    this._selectedIds.add(id);
    entry.element.classList.add('medusa-card--selected');
    if (this._settings.flipOnSelect) this.flipToBack(id);
    this._events.emit('card:select', { id, deckId: this._id, ...entry.data });
  }

  deselect(id) {
    if (id != null) {
      if (this._selectedIds.has(id)) this._doDeselect(id);
      return;
    }
    for (const sid of [...this._selectedIds]) this._doDeselect(sid);
  }

  scrollToLast() {
    if (!this._pageSize) { this._layout(); return; }
    const totalPages = Math.ceil(this._cards.size / this._pageSize);
    this._pageIndex = Math.max(0, totalPages - 1);
    this._layout();
  }

  flip(id) {
    if (this.isFlipped(id)) {
      this.flipToFront(id);
    } else {
      this.flipToBack(id);
    }
  }

  flipToBack(id) {
    const entry = this._cards.get(id);
    if (!entry) return;
    if (!entry.element.querySelector('.medusa-card-back')) return;
    if (entry.element.classList.contains('medusa-card--flipped')) return;
    entry.element.classList.add('medusa-card--flipped');
    this._events.emit('card:flip', { id, deckId: this._id, flipped: true, ...entry.data });
  }

  flipToFront(id) {
    const entry = this._cards.get(id);
    if (!entry) return;
    if (!entry.element.classList.contains('medusa-card--flipped')) return;
    entry.element.classList.remove('medusa-card--flipped');
    this._events.emit('card:flip', { id, deckId: this._id, flipped: false, ...entry.data });
  }

  isFlipped(id) {
    const entry = this._cards.get(id);
    if (!entry) return false;
    return entry.element.classList.contains('medusa-card--flipped');
  }

  getSelected() {
    const results = [];
    for (const id of this._selectedIds) {
      const entry = this._cards.get(id);
      if (entry) results.push(entry.data);
    }
    if (!this._settings.multiSelect) return results[0] || null;
    return results;
  }

  getAll() {
    return Array.from(this._cards.values()).map(e => e.data);
  }

  sort(compareFn) {
    const entries = Array.from(this._cards.entries());
    entries.sort((a, b) => compareFn(a[1].data, b[1].data));
    this._cards.clear();
    for (const [id, entry] of entries) {
      this._cards.set(id, entry);
      this._cardContainer.appendChild(entry.element);
    }
    this._pageIndex = 0;
    this._layout();
  }

  getSettings() {
    return { ...this._settings };
  }

  updateSettings(updates) {
    if (updates.front) {
      this._settings.front = { ...this._settings.front, ...updates.front };
    }
    if (updates.back) {
      this._settings.back = { ...this._settings.back, ...updates.back };
    }
    if (updates.pageSize != null) {
      this._pageSize = updates.pageSize;
      this._pageIndex = 0;
    }
    this._layout();
  }

  setInteractive(enabled) {
    this._interactive = enabled;
  }

  show() {
    if (this._el) this._el.style.display = '';
  }

  hide() {
    if (this._el) this._el.style.display = 'none';
  }

  _doDeselect(id) {
    const entry = this._cards.get(id);
    if (!entry) return;
    entry.element.classList.remove('medusa-card--selected');
    if (this._settings.flipOnSelect) this.flipToFront(id);
    this._selectedIds.delete(id);
    this._events.emit('card:deselect', { id, deckId: this._id, ...entry.data });
  }

  _isCardVisible(id) {
    if (!this._pageSize) return this._cards.has(id);
    const allIds = Array.from(this._cards.keys());
    const idx = allIds.indexOf(id);
    if (idx < 0) return false;
    const startIdx = this._pageIndex * this._pageSize;
    return idx >= startIdx && idx < startIdx + this._pageSize;
  }

  _animateCardDrop(element) {
    return new Promise(resolve => {
      const rect = element.getBoundingClientRect();
      const dropDistance = window.innerHeight - rect.top + 20;
      element.style.pointerEvents = 'none';
      element.style.transition = 'transform 400ms ease-in, opacity 400ms ease-in';
      element.style.transform = `translateY(${dropDistance}px)`;
      element.style.opacity = '0';
      setTimeout(resolve, 400);
    });
  }

  _animateCardFlyTo(element, targetEl) {
    return new Promise(resolve => {
      const fromRect = element.getBoundingClientRect();
      const toRect = targetEl.getBoundingClientRect();
      const dx = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
      const dy = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);
      const scale = Math.min(toRect.width / fromRect.width, toRect.height / fromRect.height, 0.3);
      element.style.pointerEvents = 'none';
      element.style.zIndex = '9999';
      element.style.transition = 'transform 400ms ease-in, opacity 400ms ease-in';
      element.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
      element.style.opacity = '0';
      setTimeout(resolve, 400);
    });
  }

  _flipAnimate(snapshots, duration) {
    for (const [cid, oldRect] of snapshots) {
      const entry = this._cards.get(cid);
      if (!entry) continue;
      const newRect = entry.element.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      const el = entry.element;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.offsetHeight;
      el.style.transition = `transform ${duration}ms ease`;
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, duration);
    }
  }

  _createCardElement(card) {
    const cfg = this._settings;

    const el = document.createElement('div');
    el.classList.add('medusa-card');
    el.dataset.cardId = card.id;

    // Front face
    const frontEl = document.createElement('div');
    frontEl.classList.add('medusa-card-front');
    this._createFaceContent(frontEl, card.image, card.title, card.description, cfg.front);
    el.appendChild(frontEl);

    // Back face (optional)
    if (card.back && cfg.back) {
      const backEl = document.createElement('div');
      backEl.classList.add('medusa-card-back');
      this._createFaceContent(backEl, card.back.image, card.back.title, card.back.description, cfg.back);
      el.appendChild(backEl);
    }

    // Click → select/deselect
    el.addEventListener('click', () => {
      if (!this._interactive) return;
      if (this._disabledIds.has(card.id)) return;
      if (this._selectedIds.has(card.id)) {
        this.deselect(card.id);
      } else {
        this.select(card.id);
      }
    });

    // Hover events
    el.addEventListener('mouseenter', () => {
      if (!this._interactive) return;
      this._events.emit('card:hover', { id: card.id, deckId: this._id, ...card });
    });
    el.addEventListener('mouseleave', () => {
      if (!this._interactive) return;
      this._events.emit('card:leave', { id: card.id, deckId: this._id, ...card });
    });

    return el;
  }

  _createFaceContent(container, image, title, description, faceCfg) {
    if (!faceCfg) return;

    const img = document.createElement('img');
    img.classList.add('medusa-card-image');
    img.src = image || '';
    img.alt = title || '';
    img.draggable = false;
    container.appendChild(img);

    if (faceCfg.title?.visible !== false && title) {
      const titleEl = document.createElement('div');
      titleEl.classList.add('medusa-card-title');
      titleEl.textContent = title;
      container.appendChild(titleEl);
    }

    if (faceCfg.description?.visible !== false && description) {
      const descEl = document.createElement('div');
      descEl.classList.add('medusa-card-description');
      descEl.innerHTML = description;
      container.appendChild(descEl);
    }
  }

  _layout() {
    const s = this._getScale();
    const cfg = this._settings;
    const allCards = Array.from(this._cards.values());
    const totalCards = allCards.length;
    const hasPaging = this._pageSize > 0;
    const totalPages = hasPaging ? Math.ceil(totalCards / this._pageSize) : 1;

    // Clamp page
    if (this._pageIndex >= totalPages) this._pageIndex = Math.max(0, totalPages - 1);

    // Show/hide arrows
    const needsPaging = hasPaging && totalCards > this._pageSize;
    this._arrowLeft.style.display = needsPaging ? '' : 'none';
    this._arrowRight.style.display = needsPaging ? '' : 'none';
    this._arrowLeft.disabled = this._pageIndex === 0;
    this._arrowRight.disabled = this._pageIndex >= totalPages - 1;

    // Size arrows
    const cardH = cfg.height * s;
    this._arrowLeft.style.height = `${cardH}px`;
    this._arrowRight.style.height = `${cardH}px`;

    // Slide to current page
    const startIdx = hasPaging ? this._pageIndex * this._pageSize : 0;
    const cardW = cfg.width * s;
    const gap = Math.max(8, 12 * s);
    this._cardContainer.style.gap = `${gap}px`;

    const slideOffset = startIdx * (cardW + gap);
    this._cardContainer.style.transform = `translateX(-${slideOffset}px)`;

    // Clamp wrapper
    const visibleCards = hasPaging ? Math.min(this._pageSize, totalCards) : totalCards;
    this._cardWrapper.style.width = `${visibleCards * cardW + (visibleCards - 1) * gap}px`;

    for (let i = 0; i < allCards.length; i++) {
      const { data, element } = allCards[i];
      element.style.width = `${cardW}px`;
      element.style.height = `${cardH}px`;

      // Layout text boxes on front
      const frontEl = element.querySelector('.medusa-card-front');
      if (frontEl) {
        this._layoutFace(frontEl, cfg.front, s);
      }

      // Layout text boxes on back
      const backEl = element.querySelector('.medusa-card-back');
      if (backEl && cfg.back) {
        this._layoutFace(backEl, cfg.back, s);
      }

      // Font sizes
      element.querySelectorAll('.medusa-card-title').forEach(te => {
        const face = te.closest('.medusa-card-back') ? 'back' : 'front';
        const faceCfg = cfg[face];
        if (faceCfg?.title?.fontSize) te.style.fontSize = `${faceCfg.title.fontSize * s}px`;
      });
      element.querySelectorAll('.medusa-card-description').forEach(de => {
        const face = de.closest('.medusa-card-back') ? 'back' : 'front';
        const faceCfg = cfg[face];
        if (faceCfg?.description?.fontSize) de.style.fontSize = `${faceCfg.description.fontSize * s}px`;
      });
    }
  }

  _changePage(delta) {
    if (!this._pageSize) return;
    const totalPages = Math.ceil(this._cards.size / this._pageSize);
    const newPage = this._pageIndex + delta;
    if (newPage < 0 || newPage >= totalPages) return;
    this._scrollDirection = delta;
    this._pageIndex = newPage;
    this._layout();
  }

  _layoutFace(faceEl, faceCfg, scale) {
    const titleEl = faceEl.querySelector('.medusa-card-title');
    if (titleEl) this._layoutTextBox(titleEl, faceCfg.title, scale);

    const descEl = faceEl.querySelector('.medusa-card-description');
    if (descEl) this._layoutTextBox(descEl, faceCfg.description, scale);
  }

  _layoutTextBox(el, textCfg, scale) {
    if (!textCfg) return;
    el.style.position = 'absolute';
    if (textCfg.color) el.style.color = textCfg.color;
    if (textCfg.x != null) el.style.left = `${textCfg.x * scale}px`;
    if (textCfg.y != null) {
      el.style.top = `${textCfg.y * scale}px`;
      el.style.bottom = 'auto';
    }
    if (textCfg.width != null) el.style.width = `${textCfg.width * scale}px`;
    if (textCfg.height != null) el.style.height = `${textCfg.height * scale}px`;
  }

  destroy() {
    if (this._unsub) this._unsub();
    this._el.remove();
    this._cards.clear();
    this._selectedIds.clear();
  }
}
