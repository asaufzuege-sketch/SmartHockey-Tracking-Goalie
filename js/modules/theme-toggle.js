// theme-toggle.js

function updateThemeButtonIcon() {
  const currentTheme = AppStorage.getItem('theme') || 'light';
  const icon = currentTheme === 'light' ? '☽' : '☀';
  const title = currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
  ['themeToggleBtn', 'themeToggleBtnSeason'].forEach((id) => {
    const button = document.getElementById(id);
    if (!button) return;
    if (button.textContent !== icon) {
      button.textContent = icon;
    }
    if (button.title !== title) {
      button.title = title;
    }
    if (button.getAttribute('aria-label') !== title) {
      button.setAttribute('aria-label', title);
    }
  });
}

function setTheme(theme, { rerender = true } = {}) {
  const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', normalizedTheme);
  AppStorage.setItem('theme', normalizedTheme);
  updateThemeButtonIcon();

  if (!rerender || typeof App === 'undefined') {
    return;
  }

  if (App.statsTable) {
    if (typeof App.statsTable.updateCellColorsForTheme === 'function') {
      App.statsTable.updateCellColorsForTheme();
    } else if (typeof App.statsTable.render === 'function') {
      App.statsTable.render();
    }
  }

  if (App.seasonTable && typeof App.seasonTable.render === 'function') {
    App.seasonTable.render();
  }

  if (App.seasonMap) {
    if (typeof App.seasonMap.scheduleHeatmapRender === 'function') {
      App.seasonMap.scheduleHeatmapRender();
    }
    if (typeof App.seasonMap.renderGoalAreaStats === 'function') {
      App.seasonMap.renderGoalAreaStats();
    }
    if (typeof App.seasonMap.renderMomentumGraphic === 'function') {
      App.seasonMap.renderMomentumGraphic();
    }
  }
}

function toggleTheme() {
  const currentTheme = AppStorage.getItem('theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme, { rerender: true });
}

(function applyInitialTheme() {
  const userPreference = AppStorage.getItem('theme');
  if (userPreference === 'dark' || userPreference === 'light') {
    setTheme(userPreference, { rerender: false });
  } else {
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(systemPreference, { rerender: false });
  }
})();
