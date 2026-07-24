export class EpilogueManager {
  constructor(engine) {
    this.engine = engine;
    this.hasShownEpilogue = false;
    this.backdrop = document.getElementById('epilogue-backdrop');
    this.closeBtn = document.getElementById('epilogue-close');
    this.init();
  }

  init() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', (event) => {
      if (event.target === this.backdrop) this.close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.backdrop.classList.contains('open')) {
        this.close();
      }
    });

    this.engine.events.on('dialog:hide', ({ id }) => {
      if (id !== 'score-result' || this.hasShownEpilogue) return;
      this.hasShownEpilogue = true;
      this.open();
    });
  }

  open() {
    this.backdrop.classList.add('open');
  }

  close() {
    this.backdrop.classList.remove('open');
  }
}
