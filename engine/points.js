/**
 * Points manager — scores a set of cards by summing individual card points
 * and matching card combos loaded from a CSV file.
 *
 * Events emitted: points:scored
 */
export class PointsManager {
  /**
   * @param {import('./events.js').EventBus} events
   * @param {object} settings
   * @param {string} [settings.property] - Card metadata property containing point value
   * @param {string} [settings.combosUrl] - URL to a CSV file defining card combos
   */
  constructor(events, settings) {
    this._events = events;
    this._pointsProperty = settings.property || null;
    this._combosUrl = settings.combosUrl || null;
    this._combos = []; // { cards: string[], points: number, description: string }[]
  }

  async init() {
    if (this._combosUrl) {
      await this._loadCombos(this._combosUrl);
    }
  }

  /**
   * Score a set of cards.
   * @param {object[]} cards - Array of card data objects (as returned by deck.getAll())
   * @returns {{ cardPoints: number, comboPoints: number, totalPoints: number, combos: object[], cards: object[] }}
   */
  score(cards) {
    const cardPoints = this._sumCardPoints(cards);
    const matchedCombos = this._findCombos(cards);
    const comboPoints = matchedCombos.reduce((sum, c) => sum + c.points, 0);
    const totalPoints = cardPoints + comboPoints;

    const result = {
      cardPoints,
      comboPoints,
      totalPoints,
      combos: matchedCombos,
      cards
    };

    this._events.emit('points:scored', result);
    return result;
  }

  /** Sum individual card points from the configured metadata property. */
  _sumCardPoints(cards) {
    if (!this._pointsProperty) return 0;
    let total = 0;
    for (const card of cards) {
      const val = Number(card[this._pointsProperty]);
      if (!Number.isNaN(val)) total += val;
    }
    return total;
  }

  /** Find all combos that match the given set of cards. */
  _findCombos(cards) {
    if (this._combos.length === 0) return [];
    const cardIds = new Set(cards.map(c => c.id));
    const matched = [];
    for (const combo of this._combos) {
      if (combo.cards.every(id => cardIds.has(id))) {
        matched.push(combo);
      }
    }
    return matched;
  }

  /** Fetch and parse a combos CSV file. */
  async _loadCombos(url) {
    const response = await fetch(url);
    if (!response.ok) return;
    const text = await response.text();
    this._combos = this._parseCombosCSV(text);
  }

  /**
   * Parse CSV text into combos. The second-to-last column is always treated as
   * points and the last column as description. All other columns are card ID slots.
   */
  _parseCombosCSV(text) {
    const rows = this._parseCSV(text);
    if (rows.length < 2) return [];

    const numCols = rows[0].length;
    const pointsIdx = numCols - 2;
    const descIdx = numCols - 1;
    const cardIndices = [];
    for (let i = 0; i < numCols - 2; i++) cardIndices.push(i);

    const combos = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const cards = cardIndices.map(i => (row[i] || '').trim()).filter(Boolean);
      if (cards.length === 0) continue;

      const points = pointsIdx >= 0 ? Number(row[pointsIdx]) : 0;
      const description = descIdx >= 0 ? (row[descIdx] || '').trim() : '';

      if (!Number.isNaN(points)) {
        combos.push({ cards, points, description });
      }
    }
    return combos;
  }

  /** Minimal CSV parser that handles quoted fields. */
  _parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        if (ch === '\r') i++;
        row.push(field);
        field = '';
        if (row.some(f => f.trim() !== '')) rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
    // Last field/row
    row.push(field);
    if (row.some(f => f.trim() !== '')) rows.push(row);

    return rows;
  }

  destroy() {
    this._combos = [];
  }
}
