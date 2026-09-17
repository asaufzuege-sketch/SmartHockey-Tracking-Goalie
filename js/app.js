function waitForCSSLoad() {
  return new Promise((resolve) => {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    let loaded = 0;
    const total = stylesheets.length;

    if (total === 0) {
      resolve();
      return;
    }

    const finish = () => {
      loaded++;
      if (loaded >= total) resolve();
    };

    stylesheets.forEach(link => {
      if (link.sheet) finish();
      else {
        link.addEventListener('load', finish, { once: true });
        link.addEventListener('error', finish, { once: true });
      }
    });

    setTimeout(resolve, 1000);
  });
}

async function restoreFromIndexedDBIfNeeded() {
  const hasData = Object.keys(localStorage).some(k => k.startsWith('sGoalie_'));
  if (hasData || typeof IDBBackup === 'undefined') return;

  try {
    const data = await IDBBackup.loadFullBackup();
    if (data && Object.keys(data).length > 0) {
      Object.keys(data).forEach(key => {
        try { localStorage.setItem(key, data[key]); } catch (e) {}
      });
      sessionStorage.setItem('smarthockey_goalie_restored', '1');
      window.location.reload();
    }
  } catch (e) {}
}

const RATE_APP_URL = "https://play.google.com/store/apps/details?id=io.github.asaufzuege_sketch.twa";

function openExternalLink(url) {
  window.open(url, "_blank", "noopener");
}

function exportBackup() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('sGoalie_')) {
      data[key] = localStorage.getItem(key);
    }
  }

  const exportObj = {
    appName: 'SmartHockey-Tracking-Goalie',
    exportDate: new Date().toISOString(),
    data
  };

  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `SmartHockey_Goalie_Backup_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importObj = JSON.parse(event.target.result);
        if (!importObj.data || typeof importObj.data !== 'object') {
          alert('Invalid backup file.');
          return;
        }

        const allowedApps = ['SmartHockey-Tracking-Goalie', 'SmartHockey-Tracking-Team-Pro'];
        if (importObj.appName && !allowedApps.includes(importObj.appName)) {
          alert('This backup is from a different app.');
          return;
        }

        const keyCount = Object.keys(importObj.data).length;
        if (!confirm(`Import backup? ${keyCount} entries will be restored.\nAll current data will be overwritten.`)) {
          return;
        }

        Object.keys(localStorage)
          .filter(k => k.startsWith('sGoalie_'))
          .forEach(k => localStorage.removeItem(k));

        Object.keys(importObj.data).forEach(key => {
          try { localStorage.setItem(key, importObj.data[key]); } catch (e) {}
        });

        if (typeof IDBBackup !== 'undefined') {
          IDBBackup.saveFullBackup().catch(() => {});
        }
        sessionStorage.setItem('smarthockey_goalie_restored', '1');
        window.location.reload();
      } catch (err) {
        alert('Error reading backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function bindGlobalNavigation() {
  document.getElementById("goalValueBtn")?.addEventListener("click", () => App.showPage("goalValue"));
  document.getElementById("seasonBtn")?.addEventListener("click", () => App.showPage("season"));
  document.getElementById("seasonMapBtn")?.addEventListener("click", () => App.showPage("seasonMap"));
  document.getElementById("backFromGoalValueBtn")?.addEventListener("click", () => App.showPage("stats"));
  document.getElementById("backToStatsFromSeasonBtn")?.addEventListener("click", () => App.showPage("stats"));
  document.getElementById("backToStatsFromSeasonMapBtn")?.addEventListener("click", () => App.showPage("stats"));

  document.getElementById('downloadBackupBtn')?.addEventListener('click', exportBackup);
  document.getElementById('uploadBackupBtn')?.addEventListener('click', importBackup);
  document.getElementById('privacyPolicyBtn')?.addEventListener('click', () => openExternalLink('./privacy.html'));
  document.getElementById('termsOfServiceBtn')?.addEventListener('click', () => openExternalLink('./terms.html'));
  document.getElementById('rateAppBtn')?.addEventListener('click', () => openExternalLink(RATE_APP_URL));

  const infoMessage = "SmartHockey Tracking Goalie\n\nTap on rink/goal = save (grey).\nLong press on rink/goal = goal (red).\nGoal markers count the goalie table. Rink markers are heat-map only.";
  document.getElementById('goalieSelectionInfoBtn')?.addEventListener('click', () => alert(infoMessage));
}

async function initializeApp() {
  App.initTheme();
  App.injectTableStyles();
  App.pages = {
    selection: document.getElementById("goalieSelectionPage"),
    stats: document.getElementById("statsPage"),
    goalValue: document.getElementById("goalValuePage"),
    season: document.getElementById("seasonPage"),
    seasonMap: document.getElementById("seasonMapPage")
  };

  await restoreFromIndexedDBIfNeeded();
  App.storage.load();

  App.timer?.init?.();
  App.csvHandler?.init?.();
  App.playerSelection?.init?.();
  App.statsTable?.init?.();
  App.goalMap?.init?.();
  App.seasonTable?.init?.();
  App.seasonMap?.init?.();
  App.goalValue?.init?.();
  App.billing?.init?.();

  AppStorage.startAutoBackup();
  bindGlobalNavigation();

  if (sessionStorage.getItem('smarthockey_goalie_restored')) {
    sessionStorage.removeItem('smarthockey_goalie_restored');
  }

  App.showPage("selection");
}

document.addEventListener("DOMContentLoaded", async () => {
  await waitForCSSLoad();
  initializeApp().catch(err => {
    console.error("App initialization failed:", err);
    alert("App initialization failed: " + (err?.message || err));
  });
});
