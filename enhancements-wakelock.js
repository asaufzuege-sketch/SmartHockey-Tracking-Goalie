// enhancements-wakelock.js
(function () {
  const BUTTON_CONFIGS = [
    { id: 'themeToggleBtn', selector: '#statsPage .top-bar', pageSelector: '#statsPage', beforeId: 'selectGoaliesBtn' },
    { id: 'themeToggleBtnSeason', selector: '#seasonMapPage .top-bar', pageSelector: '#seasonMapPage', beforeId: 'backToStatsFromSeasonMapBtn' }
  ];
  let isMutating = false;
  let hasPendingFrame = false;
  let domContentLoadedRetried = false;
  let releaseMutationGuardFrame = null;
  let observer = null;
  let observedTargetSignature = '';

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
      button = createThemeButton(config.id);
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

  function isButtonPlacementCorrect(config) {
    const topBar = document.querySelector(config.selector);
    const button = document.getElementById(config.id);
    if (!topBar || !button || button.parentElement !== topBar) {
      return false;
    }

    const target = document.getElementById(config.beforeId);
    if (target && target.parentElement === topBar) {
      return button === topBar.firstElementChild && button.nextElementSibling === target;
    }

    return topBar.firstElementChild === button;
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

    refreshObserverTargets();
  }

  function scheduleEnsureAllButtons() {
    if (hasPendingFrame) return;

    hasPendingFrame = true;
    requestAnimationFrame(() => {
      hasPendingFrame = false;
      ensureAllButtons();
    });
  }

  function getObservationTarget(config) {
    return document.querySelector(config.selector) || document.querySelector(config.pageSelector);
  }

  function getObservedTargetSignature(targets) {
    return targets.map((target, index) => `${BUTTON_CONFIGS[index].id}:${target ? target.tagName + '#' + (target.id || '') + '.' + target.className : 'missing'}`).join('|');
  }

  function refreshObserverTargets() {
    const targets = BUTTON_CONFIGS.map(getObservationTarget);
    const signature = getObservedTargetSignature(targets);
    if (signature === observedTargetSignature) {
      return;
    }

    if (!observer) {
      observer = new MutationObserver((records) => {
        if (isMutating) return;

        const needsRepair = records.some((record) => {
          const config = BUTTON_CONFIGS.find((entry) =>
            record.target.matches?.(entry.selector) || record.target.matches?.(entry.pageSelector)
          );

          if (!config) return false;

          const topBar = document.querySelector(config.selector);
          if (record.target.matches?.(config.pageSelector)) {
            return Boolean(topBar);
          }

          return !isButtonPlacementCorrect(config) || buttonNeedsThemeUpdate(document.getElementById(config.id));
        });

        if (needsRepair) {
          scheduleEnsureAllButtons();
        }
      });
    }

    observer.disconnect();
    observedTargetSignature = signature;

    targets.forEach((target) => {
      if (!target) {
        return;
      }
      observer.observe(target, { childList: true });
    });
  }

  function init() {
    ensureAllButtons();

    const missingPage = BUTTON_CONFIGS.some((config) => !document.querySelector(config.selector) && !document.querySelector(config.pageSelector));
    if (missingPage && !domContentLoadedRetried && document.readyState === 'loading') {
      domContentLoadedRetried = true;
      document.addEventListener('DOMContentLoaded', scheduleEnsureAllButtons, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
