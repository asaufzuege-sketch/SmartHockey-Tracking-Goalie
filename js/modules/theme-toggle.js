// theme-toggle.js

function updateThemeButtonIcon() {
  const currentTheme = AppStorage.getItem('theme') || 'light';
  const icon = currentTheme === 'light' ? '☽' : '☀';
  const title = currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
  ['themeToggleBtn', 'themeToggleBtnSeason'].forEach((id) => {
    const button = document.getElementById(id);
    if (!button) return;
    button.innerHTML = icon;
    button.title = title;
    button.setAttribute('aria-label', title);
  });
}

function setTheme(theme) {
  const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', normalizedTheme);
  AppStorage.setItem('theme', normalizedTheme);
  updateThemeButtonIcon();

  if (typeof App !== 'undefined') {
    if (App.statsTable) {
      if (typeof App.statsTable.updateCellColorsForTheme === 'function') {
        App.statsTable.updateCellColorsForTheme();
      } else if (typeof App.statsTable.render === 'function') {
        App.statsTable.render();
      }
    }
    App.seasonTable?.render?.();
    App.seasonMap?.scheduleHeatmapRender?.();
    App.seasonMap?.renderGoalAreaStats?.();
    App.seasonMap?.renderMomentumGraphic?.();
  }
}

function toggleTheme() {
  const currentTheme = AppStorage.getItem('theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

(function applyInitialTheme() {
  const userPreference = AppStorage.getItem('theme');
  if (userPreference === 'dark' || userPreference === 'light') {
    setTheme(userPreference);
  } else {
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(systemPreference);
  }
})();
