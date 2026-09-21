// enhancements-wakelock.js
(function () {
  const BUTTON_CONFIGS = [
    { id: 'themeToggleBtn', selector: '#statsPage .top-bar', beforeId: 'selectGoaliesBtn' },
    { id: 'themeToggleBtnSeason', selector: '#seasonMapPage .top-bar', beforeId: 'backToStatsFromSeasonMapBtn' }
  ];
  let isMutating = false;
  let hasPendingFrame = false;
  let domContentLoadedRetried = false;
  let releaseMutationGuardFrame = null;

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

  function withMutationGuard(mutator) {
    isMutating = true;
    if (releaseMutationGuardFrame !== null) {
      cancelAnimationFrame(releaseMutationGuardFrame);
      releaseMutationGuardFrame = null;
    }

    try {
      return mutator();
    } finally {
      releaseMutationGuardFrame = requestAnimationFrame(() => {
        isMutating = false;
        releaseMutationGuardFrame = null;
      });
    }
  }

  function getExpectedThemeButtonState() {
    const currentTheme = (typeof AppStorage !== 'undefined' && AppStorage.getItem('theme'))
      || document.documentElement.getAttribute('data-theme')
      || 'light';

    return currentTheme === 'light'
      ? { icon: '☽', title: 'Switch to Dark Mode' }
      : { icon: '☀', title: 'Switch to Light Mode' };
  }

  function buttonNeedsThemeUpdate(button) {
    if (!button) return false;
    const expected = getExpectedThemeButtonState();
    return button.textContent !== expected.icon
      || button.title !== expected.title
      || button.getAttribute('aria-label') !== expected.title;
  }

  function ensureButton(config) {
    const topBar = document.querySelector(config.selector);
    if (!topBar) return false;

    let button = document.getElementById(config.id);
    if (!button) {
      withMutationGuard(() => {
        button = createThemeButton(config.id);
      });
      return withMutationGuard(() => {
        const target = document.getElementById(config.beforeId);
        if (target && target.parentElement === topBar) {
          topBar.insertBefore(button, target);
        } else {
          topBar.insertBefore(button, topBar.firstChild);
        }
        return true;
      });
    }

    const target = document.getElementById(config.beforeId);
    if (target && target.parentElement === topBar) {
      if (button !== topBar.firstElementChild || button.nextElementSibling !== target) {
        return withMutationGuard(() => {
          topBar.insertBefore(button, target);
          return true;
        });
      }
    } else if (topBar.firstElementChild !== button) {
      return withMutationGuard(() => {
        topBar.insertBefore(button, topBar.firstChild);
        return true;
      });
    }

    return false;
  }

  function ensureAllButtons() {
    let insertedAny = false;
    BUTTON_CONFIGS.forEach((config) => {
      insertedAny = ensureButton(config) || insertedAny;
    });

    if (typeof updateThemeButtonIcon !== 'function') {
      return;
    }

    const needsThemeUpdate = BUTTON_CONFIGS.some(({ id }) => buttonNeedsThemeUpdate(document.getElementById(id)));
    if (insertedAny || needsThemeUpdate) {
      withMutationGuard(() => {
        updateThemeButtonIcon();
      });
    }
  }

  function scheduleEnsureAllButtons() {
    if (hasPendingFrame) return;

    hasPendingFrame = true;
    requestAnimationFrame(() => {
      hasPendingFrame = false;
      ensureAllButtons();
    });
  }

  function createObserver() {
    return new MutationObserver(() => {
      if (isMutating) return;
      scheduleEnsureAllButtons();
    });
  }

  function observeTargets() {
    const observer = createObserver();
    let observedAny = false;
    let missingTarget = false;

    BUTTON_CONFIGS.forEach((config) => {
      const topBar = document.querySelector(config.selector);
      if (!topBar) {
        missingTarget = true;
        return;
      }

      observer.observe(topBar, { childList: true });
      observedAny = true;
    });

    if (missingTarget && !domContentLoadedRetried && document.readyState === 'loading') {
      domContentLoadedRetried = true;
      document.addEventListener('DOMContentLoaded', () => {
        ensureAllButtons();
        observeTargets();
      }, { once: true });
    }

    return observedAny;
  }

  function init() {
    ensureAllButtons();
    observeTargets();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
