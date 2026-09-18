App.playerSelection = {
  container: null,
  saveTimeout: null,
  SLOT_COUNT: 10,

  init() {
    this.container = document.getElementById("playerList");
    document.getElementById("gameDataBtn")?.addEventListener("click", () => this.handleConfirm());
    document.getElementById("resetPlayersBtn")?.addEventListener("click", () => this.reset());

    if (this.container) {
      this.container.addEventListener("change", (e) => {
        const row = e.target.closest("li.goalie-slot");
        const index = Number(row?.dataset.index);
        if (row && !Number.isNaN(index) && e.target.matches(".player-checkbox")) {
          this.handleCheckboxChange(index, e.target);
          return;
        }
        this.debouncedSave();
      });
      this.container.addEventListener("input", (e) => {
        if (e.target.matches(".num-input, .name-input")) this.debouncedSave();
      });
      this.render();
      this.syncSelectionFromRoster();
    }
  },

  getStorageKey() {
    return `playerSelectionData_${App.helpers.getCurrentTeamId()}`;
  },

  getPlayers() {
    let savedPlayers = [];
    try {
      savedPlayers = JSON.parse(AppStorage.getItem(this.getStorageKey()) || "[]");
    } catch (e) {
      savedPlayers = [];
    }

    return Array.from({ length: this.SLOT_COUNT }, (_, index) => {
      const saved = savedPlayers[index] || {};
      return {
        number: saved.number || "",
        name: saved.name || "",
        position: "G",
        active: !!saved.active
      };
    });
  },

  getPlayersFromDOM() {
    if (!this.container) return this.getPlayers();
    return Array.from(this.container.querySelectorAll("li.goalie-slot")).map((row) => {
      const checkbox = row.querySelector(".player-checkbox");
      const numInput = row.querySelector(".num-input");
      const nameInput = row.querySelector(".name-input");
      return {
        number: numInput?.value.trim() || "",
        name: nameInput?.value.trim() || "",
        position: "G",
        active: !!checkbox?.checked
      };
    });
  },

  normalizePlayers(players, preferredActiveIndex = null) {
    const sanitized = Array.from({ length: this.SLOT_COUNT }, (_, index) => {
      const saved = players[index] || {};
      return {
        number: saved.number || "",
        name: saved.name || "",
        position: "G",
        active: !!saved.active && !!String(saved.name || "").trim()
      };
    });

    const storedActive = App.helpers.getStoredActiveGoalieName();
    let activeIndex = -1;

    if (
      preferredActiveIndex !== null
      && sanitized[preferredActiveIndex]
      && sanitized[preferredActiveIndex].name
    ) {
      activeIndex = preferredActiveIndex;
    } else {
      activeIndex = sanitized.findIndex(player => player.name && player.name === storedActive);
      if (activeIndex === -1) {
        activeIndex = sanitized.findIndex(player => player.active && player.name);
      }
    }

    return sanitized.map((player, index) => ({
      ...player,
      active: activeIndex === index && !!player.name
    }));
  },

  getSelectedGoalies(players = this.getPlayers()) {
    return players
      .filter(player => player.active && player.name)
      .map(player => ({ num: player.number, name: player.name, position: "G" }));
  },

  updateGameDataButton(players = this.getPlayers()) {
    const button = document.getElementById("gameDataBtn");
    if (!button) return;
    button.disabled = !players.some(player => player.active && player.name);
  },

  getActiveGoalieNameFromStorage() {
    return App.helpers.getStoredActiveGoalieName();
  },

  render() {
    if (!this.container) return;

    const players = this.normalizePlayers(this.getPlayers());

    this.container.innerHTML = players.map((player, index) => {
      return `
        <li class="goalie-slot" data-index="${index}">
          <input type="checkbox" ${player.active ? 'checked' : ''} class="player-checkbox" aria-label="Select goalie ${index + 1}">
          <input type="text" class="num-input" placeholder="Nr." value="${App.helpers.escapeHtml(player.number)}" data-field="number">
          <input type="text" class="name-input" placeholder="Enter goalie name" value="${App.helpers.escapeHtml(player.name)}" data-field="name">
          <div class="pos-fixed position-box">G</div>
        </li>
      `;
    }).join("");
    this.updateGameDataButton(players);
  },

  debouncedSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.saveCurrentState(), 250);
  },

  syncSelectionFromRoster() {
    const players = this.normalizePlayers(this.getPlayers());
    const selectedGoalies = this.getSelectedGoalies(players);
    App.data.selectedPlayers = selectedGoalies;
    App.storage.saveSelectedPlayers();
    App.helpers.setStoredActiveGoalieName(selectedGoalies[0]?.name || "");
    this.updateGameDataButton(players);
  },

  saveCurrentState(preferredActiveIndex = null) {
    if (!this.container) return;

    const players = this.normalizePlayers(this.getPlayersFromDOM(), preferredActiveIndex);

    AppStorage.setItem(this.getStorageKey(), JSON.stringify(players));

    const selectedGoalies = this.getSelectedGoalies(players);

    App.data.selectedPlayers = selectedGoalies;
    App.storage.saveSelectedPlayers();
    const nextActive = selectedGoalies[0]?.name || "";
    App.helpers.setStoredActiveGoalieName(nextActive);

    App.goalMap?.updateActiveGoalieButton?.();
    App.goalMap?.filterByGoalies?.(nextActive ? [nextActive] : []);
    App.goalMap?.renderTimeTracking?.();
    App.statsTable?.render?.();
    App.seasonMap?.syncSelectedGoalieToActive?.();
    App.seasonMap?.render?.();
    this.updateGameDataButton(players);
    this.render();
  },

  handleCheckboxChange(index, checkbox) {
    if (!checkbox?.checked) {
      this.render();
      return;
    }

    const currentPlayers = this.normalizePlayers(this.getPlayers());
    const currentActiveIndex = currentPlayers.findIndex(player => player.active && player.name);
    const isSwitchingGoalie = currentActiveIndex !== -1 && currentActiveIndex !== index;

    if (isSwitchingGoalie && App.goalMap?.hasUnsavedGameData?.()) {
      this.render();
      const shouldExport = confirm(
        "Export or discard current game data?\n\nOK = Export before switching\nCancel = Discard current game data"
      );
      if (shouldExport) {
        App.seasonTable?.exportFromStats?.({
          skipExportConfirm: true,
          clearAfterExport: true,
          onCancel: () => {
            this.render();
          },
          afterExport: () => {
            this.saveCurrentState(index);
            App.showPage?.("selection");
          }
        });
        return;
      }

      const shouldDiscard = confirm(
        "Discard current game data and switch goalies?\n\nOK = Discard and switch\nCancel = Keep current goalie"
      );
      if (shouldDiscard) {
        App.goalMap?.reset?.(true);
        this.saveCurrentState(index);
        return;
      }

      this.render();
      return;
    }

    this.saveCurrentState(index);
  },

  handleConfirm() {
    this.saveCurrentState();
    if (!App.data.selectedPlayers.length) {
      alert("Select one active goalie before opening Game Center.");
      return;
    }
    App.showPage("stats");
  },

  reset() {
    if (!confirm("Reset all goalie slots?")) return;
    App.data.selectedPlayers = [];
    App.storage.saveSelectedPlayers();
    AppStorage.removeItem(this.getStorageKey());
    App.helpers.setStoredActiveGoalieName("");
    App.goalMap?.reset?.(true);
    App.goalMap?.setActiveGoalie?.("");
    this.render();
    App.goalMap?.updateActiveGoalieButton?.();
    App.statsTable?.render?.();
    App.seasonMap?.syncSelectedGoalieToActive?.();
    App.seasonMap?.render?.();
  }
};
