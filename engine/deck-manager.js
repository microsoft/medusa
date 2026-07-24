import { Deck } from './deck.js';

/**
 * DeckManager — manages multiple decks (including the built-in hand).
 * Each deck is a scrollable card bar. Only one deck is visible at a time.
 * Buttons in the corners let the player switch between them.
 *
 * Events emitted: deck:switch, deck:add, deck:remove
 */
export class DeckManager {
  constructor(container, config, events, getScale) {
    this._container = container;
    this._config = config;
    this._settings = config.decks;
    this._events = events;
    this._getScale = getScale;
    this._decks = new Map(); // id → { deck, label, buttonCfg, buttonEl }
    this._cardTypes = new Map(); // id → card type data
    this._metadataKeys = Array.isArray(config.decks?.metadata) ? [...config.decks.metadata] : [];
    this._activeDeckId = null;
    this._collapsed = false;
    this._switching = false;
    this._handButton = null;
    this._deckButtonsLeft = null;
  }

  async init() {
    // Load card type registry
    if (this._settings.cardTypes) {
      await this._loadCardTypes(this._settings.cardTypes);
    }

    // Create button containers
    this._deckButtonsLeft = document.createElement('div');
    this._deckButtonsLeft.classList.add('medusa-deck-buttons-left');
    this._container.appendChild(this._deckButtonsLeft);

    // Create hand deck
    this._createDeck('hand', 'Hand', this._settings.hand?.button);
    this._activeDeckId = 'hand';
    if (this._settings.hand?.showOnStart) {
      this._decks.get('hand').deck.show();
      this._collapsed = false;
    } else {
      this._decks.get('hand').deck.hide();
      this._collapsed = true;
    }

    // Create hand button (lower right) — hidden until another deck is added
    this._handButton = this._createButton(
      this._settings.hand?.button,
      'Hand',
      'medusa-deck-button--hand',
      () => this.toggle('hand')
    );
    if (this._settings.hand?.showOnStart && !this._collapsed) {
      this._handButton.classList.add('medusa-deck-button--active');
    }
    this._handButton.style.display = this._settings.hand?.neverShow ? 'none' : this._settings.hand?.alwaysShow ? '' : 'none';
    this._container.appendChild(this._handButton);

    this._updateDeckOffset();
    this._events.on('engine:resize', () => this._updateDeckOffset());
  }

  addDeck(id, { label, button, flipOnSelect, multiSelect } = {}) {
    if (this._decks.has(id)) return this._decks.get(id).deck;
    const mergedButton = { ...this._settings.deckButton, ...button };
    this._createDeck(id, label || id, mergedButton, { flipOnSelect, multiSelect });

    // Create button in lower left
    const btnEl = this._createButton(
      mergedButton,
      label || id,
      'medusa-deck-button--deck',
      () => this.toggle(id)
    );
    btnEl.dataset.deckId = id;
    this._deckButtonsLeft.appendChild(btnEl);
    this._decks.get(id).buttonEl = btnEl;

    // Hide the new deck (only active deck is visible)
    this._decks.get(id).deck.hide();
    this._updateHandButtonVisibility();
    this._updateDeckOffset();
    this._events.emit('deck:add', { id });
    return this._decks.get(id).deck;
  }

  removeDeck(id) {
    if (id === 'hand') return; // Can't remove hand
    const entry = this._decks.get(id);
    if (!entry) return;

    // Switch away if active
    if (this._activeDeckId === id) {
      this._activeDeckId = 'hand';
      this._collapsed = false;
      entry.deck.hide();
      this._decks.get('hand').deck.show();
      this._updateButtonStates();
    }

    entry.deck.destroy();
    if (entry.buttonEl) entry.buttonEl.remove();
    this._decks.delete(id);
    this._updateHandButtonVisibility();
    this._updateDeckOffset();
    this._events.emit('deck:remove', { id });
  }

  getDeck(id) {
    const entry = this._decks.get(id);
    return entry ? entry.deck : null;
  }

  get hand() {
    return this.getDeck('hand');
  }

  get activeDeckId() {
    return this._activeDeckId;
  }

  async loadDeck(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load deck from ${url}: ${response.status}`);
    const deckData = await response.json();

    if (!deckData.id) throw new Error('Deck file must have an "id"');

    const deck = this.addDeck(deckData.id, {
      label: deckData.label,
      button: deckData.button,
      flipOnSelect: deckData.flipOnSelect,
      multiSelect: deckData.multiSelect
    });

    // Resolve card IDs to card type data and add each card
    if (Array.isArray(deckData.cards)) {
      for (const cardRef of deckData.cards) {
        if (typeof cardRef === 'string') {
          const cardData = this._cardTypes.get(cardRef);
          if (!cardData) throw new Error(`Unknown card type ID: "${cardRef}"`);
          deck.add({ ...cardData });
        } else if (cardRef.type) {
          // Object with type ref — resolve from registry, merge metadata on top
          const { type, ...metadata } = cardRef;
          const cardData = this._cardTypes.get(type);
          if (!cardData) throw new Error(`Unknown card type ID: "${type}"`);
          deck.add({ ...cardData, ...metadata });
        } else {
          // Full card object inline — add directly
          deck.add(cardRef);
        }
      }
    }

    return deck;
  }

  async toggle(deckId) {
    if (this._switching) return;
    if (deckId === this._activeDeckId && !this._collapsed) {
      // Collapse: hide the active deck
      this._switching = true;
      const entry = this._decks.get(deckId);
      if (entry && entry.deck._cards.size > 0) {
        await this._animateStackOut(entry.deck, deckId);
      }
      if (entry) entry.deck.hide();
      this._collapsed = true;
      this._updateButtonStates();
      this._switching = false;
      this._events.emit('deck:switch', { from: deckId, to: null });
      return;
    }
    // Uncollapse or switch
    await this.show(deckId);
  }

  async show(deckId) {
    if (this._switching) return;
    if (deckId === this._activeDeckId && !this._collapsed) return;
    const newEntry = this._decks.get(deckId);
    if (!newEntry) return;

    this._switching = true;
    const oldEntry = this._decks.get(this._activeDeckId);
    const oldDeckId = this._activeDeckId;

    // Phase 1: Stack out old deck
    if (oldEntry && oldEntry.deck._cards.size > 0) {
      await this._animateStackOut(oldEntry.deck, oldDeckId);
    }
    if (oldEntry) oldEntry.deck.hide();

    // Phase 2: Spread in new deck
    newEntry.deck.show();
    if (newEntry.deck._cards.size > 0) {
      await this._animateSpreadIn(newEntry.deck, deckId);
    }

    this._activeDeckId = deckId;
    this._collapsed = false;
    this._updateButtonStates();
    this._switching = false;
    this._events.emit('deck:switch', { from: oldDeckId, to: deckId });
  }

  addCardType(data) {
    if (data && data.id) {
      this._cardTypes.set(data.id, data);
    }
  }

  getCardType(id) {
    return this._cardTypes.get(id) || null;
  }

  getAllCardTypes() {
    return Array.from(this._cardTypes.values());
  }

  getMetadataKeys() {
    return [...this._metadataKeys];
  }

  async moveCard(cardId, fromDeckId, toDeckId) {
    const fromDeck = this.getDeck(fromDeckId);
    const toDeck = this.getDeck(toDeckId);
    if (!fromDeck || !toDeck) return;
    const fromEntry = fromDeck._cards.get(cardId);
    if (!fromEntry) return;
    const cardData = { ...fromEntry.data };
    const toInfo = this._decks.get(toDeckId);
    const target = toDeckId === 'hand' ? this._handButton : toInfo?.buttonEl;
    await fromDeck.remove(cardId, { animate: 'flyTo', target });
    toDeck.add(cardData);
  }

  getSelected() {
    const deck = this.getDeck(this._activeDeckId);
    return deck ? deck.getSelected() : null;
  }

  getSettings() {
    return { ...this._settings };
  }

  updateSettings(updates) {
    // Manager-level settings
    if (updates.flipOnSelect != null) this._settings.flipOnSelect = updates.flipOnSelect;
    if (updates.multiSelect != null) this._settings.multiSelect = updates.multiSelect;
    if (updates.alwaysShowHand != null) {
      this._settings.hand = this._settings.hand || {};
      this._settings.hand.alwaysShow = updates.alwaysShowHand;
      this._updateHandButtonVisibility();
    }
    if (updates.showOnStart != null) {
      this._settings.hand = this._settings.hand || {};
      this._settings.hand.showOnStart = updates.showOnStart;
    }
    if (updates.pageSize != null) {
      this._settings.pageSize = updates.pageSize;
    }
    if (updates.metadata != null) {
      this._settings.metadata = [...updates.metadata];
      this._metadataKeys = [...updates.metadata];
    }
    // Forward visual settings to all decks
    for (const entry of this._decks.values()) {
      entry.deck.updateSettings(updates);
    }
  }

  destroy() {
    for (const entry of this._decks.values()) {
      entry.deck.destroy();
      if (entry.buttonEl) entry.buttonEl.remove();
    }
    this._decks.clear();
    this._cardTypes.clear();
    if (this._handButton) this._handButton.remove();
    if (this._deckButtonsLeft) this._deckButtonsLeft.remove();
  }

  // --- Private ---

  _createDeck(id, label, buttonCfg, overrides = {}) {
    const settings = { ...this._settings };
    if (overrides.flipOnSelect != null) settings.flipOnSelect = overrides.flipOnSelect;
    if (overrides.multiSelect != null) settings.multiSelect = overrides.multiSelect;
    const deck = new Deck(id, this._container, settings, this._events, this._getScale);
    deck.init();
    this._decks.set(id, { deck, label, buttonCfg, buttonEl: null });
    return deck;
  }

  async _loadCardTypes(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load card types from ${url}: ${response.status}`);
    const types = await response.json();
    if (!Array.isArray(types)) throw new Error('Card types file must be a JSON array');
    for (const ct of types) {
      if (ct.id) this._cardTypes.set(ct.id, ct);
    }
  }

  _createButton(buttonCfg, fallbackLabel, extraClass, onClick) {
    const btn = document.createElement('button');
    btn.classList.add('medusa-deck-button');
    if (extraClass) btn.classList.add(extraClass);

    if (buttonCfg?.image) {
      btn.classList.add('medusa-deck-button--image');
      btn.style.backgroundImage = `url('${buttonCfg.image}')`;
      if (buttonCfg.width != null && buttonCfg.height != null) {
        btn.style.width = `calc(${buttonCfg.width}px * var(--medusa-scale, 1))`;
        btn.style.height = `calc(${buttonCfg.height}px * var(--medusa-scale, 1))`;
      } else {
        const img = new Image();
        img.src = buttonCfg.image;
        img.onload = () => {
          if (!buttonCfg.width && !buttonCfg.height) {
            btn.style.width = `calc(${img.naturalWidth}px * var(--medusa-scale, 1))`;
            btn.style.height = `calc(${img.naturalHeight}px * var(--medusa-scale, 1))`;
          } else if (buttonCfg.width) {
            btn.style.width = `calc(${buttonCfg.width}px * var(--medusa-scale, 1))`;
            btn.style.height = `calc(${img.naturalHeight * (buttonCfg.width / img.naturalWidth)}px * var(--medusa-scale, 1))`;
          } else {
            btn.style.height = `calc(${buttonCfg.height}px * var(--medusa-scale, 1))`;
            btn.style.width = `calc(${img.naturalWidth * (buttonCfg.height / img.naturalHeight)}px * var(--medusa-scale, 1))`;
          }
        };
      }
    }

    if (!buttonCfg?.hideLabel) {
      const label = document.createElement('span');
      label.classList.add('medusa-deck-button-label');
      label.textContent = buttonCfg?.label || fallbackLabel;
      if (buttonCfg?.fontSize) label.style.fontSize = `${buttonCfg.fontSize}px`;
      if (buttonCfg?.color) label.style.color = buttonCfg.color;
      btn.appendChild(label);
    }

    btn.addEventListener('click', onClick);
    return btn;
  }

  _updateDeckOffset() {
    // When only the hand deck exists, shift the card row left by half a card width
    // so it doesn't overlap with the hand button on the right
    const handOnly = this._decks.size === 1;
    const s = this._getScale();
    const offset = handOnly ? (this._settings.width || 0) * s * 0.5 : 0;
    for (const entry of this._decks.values()) {
      entry.deck.element.style.marginLeft = offset ? `-${offset}px` : '';
    }
  }

  _updateHandButtonVisibility() {
    const alwaysShow = this._settings.hand?.alwaysShow;
    const neverShow = this._settings.hand?.neverShow;
    const hasOtherDecks = this._decks.size > 1;
    if (this._handButton) {
      this._handButton.style.display = neverShow ? 'none' : (alwaysShow || hasOtherDecks) ? '' : 'none';
    }
  }

  _updateButtonStates() {
    // Hand button
    if (this._handButton) {
      this._handButton.classList.toggle('medusa-deck-button--active', this._activeDeckId === 'hand' && !this._collapsed);
    }
    // Deck buttons
    for (const [id, entry] of this._decks) {
      if (entry.buttonEl) {
        entry.buttonEl.classList.toggle('medusa-deck-button--active', this._activeDeckId === id && !this._collapsed);
      }
    }
  }

  _getButtonForDeck(deckId) {
    if (deckId === 'hand') return this._handButton;
    const entry = this._decks.get(deckId);
    return entry?.buttonEl || null;
  }

  _getVisibleCards(deckEl) {
    const wrapper = deckEl.querySelector('.medusa-card-wrapper');
    if (!wrapper) return { visible: [], hidden: [] };
    const wrapperRect = wrapper.getBoundingClientRect();
    const allCards = Array.from(deckEl.querySelectorAll('.medusa-card'));
    const visible = [];
    const hidden = [];
    for (const card of allCards) {
      const r = card.getBoundingClientRect();
      if (r.right > wrapperRect.left && r.left < wrapperRect.right) {
        visible.push(card);
      } else {
        hidden.push(card);
      }
    }
    return { visible, hidden };
  }

  _animateStackOut(deck, deckId) {
    return new Promise(resolve => {
      const el = deck.element;
      const { visible: cards, hidden } = this._getVisibleCards(el);
      if (cards.length === 0) { resolve(); return; }

      const btn = this._getButtonForDeck(deckId);
      if (!btn) {
        el.style.transition = 'opacity 0.2s ease';
        el.style.opacity = '0';
        setTimeout(() => { el.style.transition = ''; el.style.opacity = ''; resolve(); }, 200);
        return;
      }

      // Hide off-page cards and pagination arrows
      for (const card of hidden) card.style.visibility = 'hidden';
      const arrows = el.querySelectorAll('.medusa-card-arrow');
      for (const arrow of arrows) arrow.style.display = 'none';
      const wrapper = el.querySelector('.medusa-card-wrapper');
      if (wrapper) wrapper.style.overflow = 'visible';

      const btnRect = btn.getBoundingClientRect();
      const btnCx = btnRect.left + btnRect.width / 2;
      const btnCy = btnRect.top + btnRect.height / 2;

      const isRight = deckId === 'hand';
      const ordered = isRight ? [...cards] : [...cards].reverse();

      const stagger = 40;
      const flyDuration = 350;
      const totalTime = stagger * (ordered.length - 1) + flyDuration;

      ordered.forEach((card, i) => {
        setTimeout(() => {
          const rect = card.getBoundingClientRect();
          const cardCx = rect.left + rect.width / 2;
          const cardCy = rect.top + rect.height / 2;
          const dx = btnCx - cardCx;
          const dy = btnCy - cardCy;
          card.style.transition = `transform ${flyDuration}ms ease-in, opacity ${flyDuration}ms ease-in`;
          card.style.transform = `translate(${dx}px, ${dy}px) scale(0.15)`;
          card.style.opacity = '0';
        }, i * stagger);
      });

      setTimeout(() => {
        for (const card of cards) {
          card.style.transition = '';
          card.style.transform = '';
          card.style.opacity = '';
        }
        for (const card of hidden) card.style.visibility = '';
        if (wrapper) wrapper.style.overflow = '';
        deck._layout();
        resolve();
      }, totalTime);
    });
  }

  _animateSpreadIn(deck, deckId) {
    return new Promise(resolve => {
      const el = deck.element;
      const { visible: cards, hidden } = this._getVisibleCards(el);
      if (cards.length === 0) { resolve(); return; }

      const btn = this._getButtonForDeck(deckId);
      if (!btn) {
        el.style.opacity = '0';
        requestAnimationFrame(() => {
          el.style.transition = 'opacity 0.2s ease';
          el.style.opacity = '1';
          setTimeout(() => { el.style.transition = ''; el.style.opacity = ''; resolve(); }, 200);
        });
        return;
      }

      // Hide off-page cards and pagination arrows
      for (const card of hidden) card.style.visibility = 'hidden';
      const arrows = el.querySelectorAll('.medusa-card-arrow');
      for (const arrow of arrows) arrow.style.display = 'none';
      const wrapper = el.querySelector('.medusa-card-wrapper');
      if (wrapper) wrapper.style.overflow = 'visible';

      const btnRect = btn.getBoundingClientRect();
      const btnCx = btnRect.left + btnRect.width / 2;
      const btnCy = btnRect.top + btnRect.height / 2;

      requestAnimationFrame(() => {
        // Start each card at button center, scaled down
        for (const card of cards) {
          const rect = card.getBoundingClientRect();
          const cardCx = rect.left + rect.width / 2;
          const cardCy = rect.top + rect.height / 2;
          const dx = btnCx - cardCx;
          const dy = btnCy - cardCy;
          card.style.transform = `translate(${dx}px, ${dy}px) scale(0.15)`;
          card.style.opacity = '0';
        }

        const isRight = deckId === 'hand';
        const ordered = isRight ? [...cards] : [...cards].reverse();

        const stagger = 40;
        const flyDuration = 350;
        const totalTime = stagger * (ordered.length - 1) + flyDuration;

        requestAnimationFrame(() => {
          ordered.forEach((card, i) => {
            setTimeout(() => {
              card.style.transition = `transform ${flyDuration}ms ease-out, opacity ${flyDuration * 0.4}ms ease-out`;
              card.style.transform = '';
              card.style.opacity = '';
            }, i * stagger);
          });

          setTimeout(() => {
            for (const card of cards) {
              card.style.transition = '';
            }
            for (const card of hidden) card.style.visibility = '';
            if (wrapper) wrapper.style.overflow = '';
            deck._layout();
            resolve();
          }, totalTime);
        });
      });
    });
  }
}
