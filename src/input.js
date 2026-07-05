// Phase 4 stub — replaced when input handling is fully wired
export function initInput(handlers) {
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      handlers.onIntro();
      handlers.onReady();
      handlers.onLanded();
    }
  });

  document.addEventListener('click', () => {
    handlers.onIntro();
    handlers.onReady();
    handlers.onLanded();
  });

  document.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    handlers.onIntro();
    handlers.onReady();
    handlers.onLanded();
  }, { passive: false });
}
