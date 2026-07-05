import { STATES } from './constants.js';

export function initInput(handlers, getState) {
  function trigger() {
    const state = getState();
    switch (state) {
      case STATES.INTRO:
        handlers.onIntro();
        break;
      case STATES.READY:
        handlers.onReady();
        break;
      case STATES.LANDED:
        handlers.onLanded();
        break;
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      trigger();
    }
  });

  document.addEventListener('click', trigger);

  document.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    trigger();
  }, { passive: false });
}
