// enhancements-wakelock.js
(function () {
  const BUTTON_CONFIGS = [
    { id: 'themeToggleBtn', selector: '#statsPage .top-bar', beforeId: 'selectGoaliesBtn' },
    { id: 'themeToggleBtnSeason', selector: '#seasonMapPage .top-bar', beforeId: 'backToStatsFromSeasonMapBtn' }
  ];

  function onThemeToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof toggleTheme === 'function') {
      toggleTheme();
    }
  }

  function createThemeButton(id) {
    const button = document.createElement('button');
    button.id = id;
    button.className = 'top-btn';
    button.addEventListener('click', onThemeToggle);
    return button;
  }

  function ensureButton(config) {
    const topBar = document.querySelector(config.selector);
    if (!topBar) return false;

    let button = document.getElementById(config.id);
    if (!button) {
      button = createThemeButton(config.id);
    }

    const target = document.getElementById(config.beforeId);
    if (target && target.parentElement === topBar) {
      if (button !== topBar.firstElementChild || button.nextElementSibling !== target) {
        topBar.insertBefore(button, target);
      }
    } else if (topBar.firstElementChild !== button) {
      topBar.insertBefore(button, topBar.firstChild);
    }

    return true;
  }

  function ensureAllButtons() {
    let insertedAny = false;
    BUTTON_CONFIGS.forEach((config) => {
      insertedAny = ensureButton(config) || insertedAny;
    });
    if (insertedAny && typeof updateThemeButtonIcon === 'function') {
      updateThemeButtonIcon();
    }
  }

  function init() {
    ensureAllButtons();
    const observer = new MutationObserver(() => ensureAllButtons());
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
