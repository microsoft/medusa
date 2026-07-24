/**
 * Status bar rendered at the bottom of the engine container.
 * Shows text messages — games and the editor use it for feedback.
 */
export class StatusBar {
  /**
   * @param {HTMLElement} container - The engine container element
   */
  constructor(container) {
    this._el = document.createElement('div');
    this._el.classList.add('medusa-status-bar');
    this._el.textContent = 'Ready';
    container.appendChild(this._el);
  }

  /** Set the status bar text. */
  setText(text) {
    this._el.textContent = text;
  }

  /** Get the status bar DOM element. */
  getElement() {
    return this._el;
  }

  /** Remove the status bar from the DOM. */
  destroy() {
    this._el.remove();
  }
}
