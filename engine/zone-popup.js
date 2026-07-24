/**
 * ZonePopup — shows a popup next to a zone when clicked.
 * Displays the zone's label and optional description.
 * Automatically repositions on resize and dismisses on outside click.
 */
export class ZonePopup {
  constructor(container, town, events, getScale) {
    this._container = container;
    this._town = town;
    this._events = events;
    this._getScale = getScale;
    this._el = null;
    this._activeZoneId = null;

    this._onZoneClick = this._onZoneClick.bind(this);
    this._onZoneHover = this._onZoneHover.bind(this);
    this._onZoneLeave = this._onZoneLeave.bind(this);
    this._onOutsideClick = this._onOutsideClick.bind(this);
    this._onResize = this._onResize.bind(this);

    this._events.on('zone:click', this._onZoneClick);
    this._events.on('zone:hover', this._onZoneHover);
    this._events.on('zone:leave', this._onZoneLeave);
    this._events.on('engine:resize', this._onResize);
  }

  _onZoneClick({ id }) {
    const zone = this._town.getZone(id);
    if (!zone) return;

    // If same zone clicked again, toggle off
    if (this._activeZoneId === id) {
      this.hide();
      return;
    }

    this.show(id);
  }

  _onZoneHover({ id }) {
    const zone = this._town.getZone(id);
    if (!zone) return;

    // Show popup on hover (same as click but without toggle)
    if (this._activeZoneId === id) return;
    this.show(id);
  }

  _onZoneLeave({ id }) {
    if (this._activeZoneId === id) {
      this.hide();
    }
  }

  show(zoneId) {
    const zone = this._town.getZone(zoneId);
    if (!zone) return;

    // Remove existing popup
    this._removeEl();

    this._activeZoneId = zoneId;

    // Build popup element
    const el = document.createElement('div');
    el.classList.add('medusa-zone-popup');

    const title = document.createElement('div');
    title.classList.add('medusa-zone-popup-title');
    title.textContent = zone.label || zone.id;
    el.appendChild(title);

    if (zone.description) {
      const desc = document.createElement('div');
      desc.classList.add('medusa-zone-popup-description');
      desc.innerHTML = zone.description;
      el.appendChild(desc);
    }

    this._el = el;
    this._container.appendChild(el);

    this._position();

    // Delay attaching outside-click so the current click doesn't immediately dismiss
    requestAnimationFrame(() => {
      document.addEventListener('pointerdown', this._onOutsideClick, true);
    });
  }

  hide() {
    this._removeEl();
    this._activeZoneId = null;
    document.removeEventListener('pointerdown', this._onOutsideClick, true);
  }

  _removeEl() {
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
  }

  _position() {
    if (!this._el || !this._activeZoneId) return;

    const zone = this._town.getZone(this._activeZoneId);
    if (!zone) return;

    const s = this._getScale();
    const popupEl = this._el;

    // Position popup above the zone center
    const zoneLeft = zone.x * s;
    const zoneTop = zone.y * s;
    const zoneWidth = zone.width * s;
    const zoneHeight = zone.height * s;
    const zoneCenterX = zoneLeft + zoneWidth / 2;

    // Temporarily make visible to measure
    popupEl.style.visibility = 'hidden';
    popupEl.style.display = 'block';
    const popupWidth = popupEl.offsetWidth;
    const popupHeight = popupEl.offsetHeight;
    popupEl.style.visibility = '';

    const gap = 8 * s;
    let left = zoneCenterX - popupWidth / 2;
    let top = zoneTop - popupHeight - gap;

    // If not enough space above, show below
    if (top < 0) {
      top = zoneTop + zoneHeight + gap;
    }

    // Clamp horizontally within container
    const containerWidth = this._container.clientWidth;
    if (left < 4) left = 4;
    if (left + popupWidth > containerWidth - 4) left = containerWidth - popupWidth - 4;

    popupEl.style.left = `${left}px`;
    popupEl.style.top = `${top}px`;
  }

  _onResize() {
    this._position();
  }

  _onOutsideClick(e) {
    if (!this._el) return;
    // If click is inside the popup, ignore
    if (this._el.contains(e.target)) return;
    // If click is on the same zone element, let _onZoneClick handle toggle
    const zoneEl = this._town.getZoneElement(this._activeZoneId);
    if (zoneEl && zoneEl.contains(e.target)) return;
    this.hide();
  }

  destroy() {
    this.hide();
    this._events.off('zone:click', this._onZoneClick);
    this._events.off('zone:hover', this._onZoneHover);
    this._events.off('zone:leave', this._onZoneLeave);
    this._events.off('engine:resize', this._onResize);
  }
}
