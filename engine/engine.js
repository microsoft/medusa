import { EventBus } from './events.js';
import { loadConfig } from './config-loader.js';
import { TownRenderer } from './town.js';
import { AnimationManager } from './animations.js';
import { StatusBar } from './status-bar.js';
import { DeckManager } from './deck-manager.js';
import { DialogManager } from './dialog.js';
import { PointsManager } from './points.js';
import { ZonePopup } from './zone-popup.js';

/**
 * Main engine class for Medusa's Memory Heist.
 * Orchestrates town rendering, animations, and game communication.
 */
export class MedusaEngine {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - DOM element to render into
   * @param {string} options.configUrl - URL/path to the game's config.json
   */
  constructor({ container, configUrl }) {
    this._container = container;

    /** @type {HTMLElement} The engine container element */
    this.container = container;
    this._configUrl = configUrl;
    this.events = new EventBus();
    this.town = null;
    this.animations = null;
    this.status = null;
    this.decks = null;
    this.dialogs = null;
    this.points = null;
    this.zonePopup = null;
    this.config = null;
    this._titleEl = null;
  }

  /** Backward-compatible shortcut: engine.cards → hand deck. */
  get cards() { return this.decks ? this.decks.hand : null; }

  /** Initialize the engine: load config, render town, start animations. */
  async init() {
    this._container.classList.add('medusa-engine');

    // Load config
    this.config = await loadConfig(this._configUrl);

    // Create town renderer
    this.town = new TownRenderer(this._container, this.config, this.events);
    this.town.init();

    // Create animation manager
    this.animations = new AnimationManager(
      this.town.getTownLayer(),
      this.config,
      () => this.town.getScale()
    );
    await this.animations.init();

    // Create status bar
    this.status = new StatusBar(this._container);

    // Create dialog manager
    this.dialogs = new DialogManager(
      this._container,
      this.events,
      () => this.town.getScale()
    );

    // Create deck manager (if configured)
    if (this.config.decks) {
      this.decks = new DeckManager(
        this._container,
        this.config,
        this.events,
        () => this.town.getScale()
      );
      await this.decks.init();
    }

    if (this.config.points) {
      this.points = new PointsManager(this.events, this.config.points);
      await this.points.init();
    }

    // Create zone popup
    this.zonePopup = new ZonePopup(
      this._container,
      this.town,
      this.events,
      () => this.town.getScale()
    );

    // Create game title
    this._createGameTitle();

    this.events.emit('engine:ready', { config: this.config });
  }

  _createGameTitle() {
    if (this._titleEl) this._titleEl.remove();
    const name = this.config.meta && this.config.meta.name;
    if (!name) return;
    const el = document.createElement('div');
    el.textContent = name;
    el.className = 'medusa-game-title';
    this._container.appendChild(el);
    this._titleEl = el;
  }

  /**
   * Reload the engine with a new config object. Destroys current state and re-initializes.
   * @param {Object} config - Parsed config object (must pass validation)
   */
  async reload(config) {
    // Clean up current state (but keep the EventBus and container)
    if (this.animations) this.animations.destroy();
    if (this.town) this.town.destroy();
    if (this.status) this.status.destroy();
    if (this.dialogs) this.dialogs.destroy();
    if (this.decks) this.decks.destroy();
    if (this.points) this.points.destroy();
    if (this.zonePopup) this.zonePopup.destroy();

    this.config = config;

    // Re-create town renderer
    this.town = new TownRenderer(this._container, this.config, this.events);
    this.town.init();

    // Re-create animation manager
    this.animations = new AnimationManager(
      this.town.getTownLayer(),
      this.config,
      () => this.town.getScale()
    );
    await this.animations.init();

    // Re-create status bar
    this.status = new StatusBar(this._container);

    // Re-create dialog manager
    this.dialogs = new DialogManager(
      this._container,
      this.events,
      () => this.town.getScale()
    );

    // Re-create deck manager (if configured)
    this.decks = null;
    if (this.config.decks) {
      this.decks = new DeckManager(
        this._container,
        this.config,
        this.events,
        () => this.town.getScale()
      );
      await this.decks.init();
    }

    this.points = null;
    if (this.config.points) {
      this.points = new PointsManager(this.events, this.config.points);
      await this.points.init();
    }

    // Re-create zone popup
    this.zonePopup = new ZonePopup(
      this._container,
      this.town,
      this.events,
      () => this.town.getScale()
    );

    // Update game title
    this._createGameTitle();

    this.events.emit('engine:ready', { config: this.config });
  }

  /** Tear down the engine and clean up all resources. */
  destroy() {
    if (this.animations) this.animations.destroy();
    if (this.town) this.town.destroy();
    if (this.status) this.status.destroy();
    if (this.dialogs) this.dialogs.destroy();
    if (this.decks) this.decks.destroy();
    if (this.points) this.points.destroy();
    if (this.zonePopup) this.zonePopup.destroy();
    if (this._titleEl) this._titleEl.remove();
    this.events.clear();
  }
}
