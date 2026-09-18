const GOALIE_TEAM_ID = 'Goalie';

const App = {
  version: '3.4.2',
  pages: {},
  data: {
    players: [],
    categories: ["Shots", "Saves", "Goals", "Save %"],
    selectedPlayers: [],
    statsData: {},
    playerTimes: {},
    seasonData: {},
    goalieSeasonData: {},
    goalieExportSnapshot: {},
    shotsForOnIce: {},
    shotsAgainstOnIce: {},
    activeTimers: {},
    goalMapData: {}
  },
  selectors: {
    torbildBoxes: "#statsPage .field-box, #statsPage .goal-img-box",
    seasonMapBoxes: "#seasonMapPage .field-box, #seasonMapPage .goal-img-box"
  },

  initTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  },

  injectTableStyles() {
    const existing = document.getElementById('season-goalvalue-scroll-fix');
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = 'season-goalvalue-scroll-fix';
    style.textContent = `
      #goalValueContainer {
        display: flex !important;
        justify-content: flex-start !important;
        width: 100% !important;
      }

      #goalValueContainer table {
        margin-left: 0 !important;
        margin-right: auto !important;
        width: auto !important;
      }
    `;
    document.head.appendChild(style);
  },

  showPage(page) {
    if (!this.pages || Object.keys(this.pages).length === 0) {
      this.pages = {
        selection: document.getElementById("goalieSelectionPage"),
        stats: document.getElementById("statsPage"),
        goalValue: document.getElementById("goalValuePage"),
        seasonMap: document.getElementById("seasonMapPage")
      };
    }

    Object.values(this.pages).forEach(p => {
      if (p) p.style.cssText = 'display:none !important;';
    });

    if (this.pages[page]) {
      this.pages[page].style.cssText = '';
      this.pages[page].style.display = 'block';
    }

    AppStorage.setItem("currentPage", page);

    const titles = {
      selection: "Goalie Selection",
      stats: "Game Center",
      goalValue: "Goal Value",
      seasonMap: "Season Map"
    };
    document.title = titles[page] || "SmartHockey Tracking Goalie";

    if (page === "selection" && this.playerSelection?.render) {
      this.playerSelection.render();
    }
    if (page === "stats") {
      this.goalMap?.restoreMarkers?.();
      this.goalMap?.renderTimeTracking?.();
      this.statsTable?.render?.();
    }
    if (page === "goalValue" && this.goalValue?.render) {
      this.goalValue.render();
    }
    if (page === "seasonMap" && this.seasonMap?.render) {
      this.seasonMap.render();
    }
  },

  startGoalMapWorkflow() {},
  addGoalMapPoint() {},
  updateTimerVisuals() {}
};
