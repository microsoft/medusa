/**
 * Loads and validates a game config JSON file.
 * @param {string} configUrl - URL or path to the config.json
 * @returns {Promise<Object>} Parsed config object
 */
export async function loadConfig(configUrl) {
  const response = await fetch(configUrl);
  if (!response.ok) {
    throw new Error(`Failed to load config from ${configUrl}: ${response.status}`);
  }

  const config = await response.json();
  validateConfig(config);
  return config;
}

export function validateConfig(config) {
  if (!config.meta) {
    throw new Error('Config missing required "meta" section');
  }
  if (!config.meta.virtualWidth || !config.meta.virtualHeight) {
    throw new Error('Config meta must include "virtualWidth" and "virtualHeight"');
  }
  if (!config.background || !config.background.image) {
    throw new Error('Config missing required "background.image"');
  }

  // Defaults
  config.overlays = config.overlays || [];
  config.zones = config.zones || [];
  config.animations = config.animations || [];

  // Validate zones have required fields
  for (const zone of config.zones) {
    if (!zone.id) throw new Error('Each zone must have an "id"');
    if (zone.x == null || zone.y == null || zone.width == null || zone.height == null) {
      throw new Error(`Zone "${zone.id}" must have x, y, width, height`);
    }
    // Normalize optional overlays link
    if (zone.overlays && !Array.isArray(zone.overlays)) {
      throw new Error(`Zone "${zone.id}" overlays must be an array of overlay IDs`);
    }
    zone.overlays = zone.overlays || [];
  }

  // Validate overlays have required fields
  for (const overlay of config.overlays) {
    if (!overlay.id) throw new Error('Each overlay must have an "id"');
    if (!overlay.image) throw new Error(`Overlay "${overlay.id}" must have an "image"`);
  }

  // Validate optional decks display config
  if (config.decks) {
    if (config.decks.width == null || config.decks.height == null) {
      throw new Error('Decks config must include "width" and "height"');
    }
    // Normalize front face (required)
    config.decks.front = config.decks.front || {};
    config.decks.front.title = config.decks.front.title || { visible: true };
    config.decks.front.description = config.decks.front.description || { visible: true };
    // Normalize back face (optional)
    if (config.decks.back) {
      config.decks.back.title = config.decks.back.title || { visible: true };
      config.decks.back.description = config.decks.back.description || { visible: true };
    }
    // Normalize hand config
    config.decks.hand = config.decks.hand || {};
    config.decks.hand.button = config.decks.hand.button || { label: 'Hand' };
    if (config.decks.hand.alwaysShow == null) config.decks.hand.alwaysShow = false;
    // Normalize selection options
    if (config.decks.multiSelect == null) config.decks.multiSelect = false;
  }

  // Validate animations have required fields
  for (const anim of config.animations) {
    if (!anim.id) throw new Error('Each animation must have an "id"');
    if (!anim.image) throw new Error(`Animation "${anim.id}" must have an "image"`);
    if (!anim.path || anim.path.length < 2) {
      throw new Error(`Animation "${anim.id}" must have a "path" with at least 2 waypoints`);
    }
  }
}
