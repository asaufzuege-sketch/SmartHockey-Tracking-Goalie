App.playerSelection = {
  container: null,
  saveTimeout: null,
  SLOT_COUNT: 10,

  init() {
    this.container = document.getElementById("playerList");
    document.getElementById("gameDataBtn")?.addEventListener("click", () => this.handleConfirm());
    document.getElementById("resetPlayersBtn")?.addEventListener("click", () => this.reset());

    if (this.container) {
      this.container.addEventListener("click", (e) => this.handleListClick(e));
      this.container.addEventListener("change", () => this.debouncedSave());
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

  getActiveGoalieNameFromStorage() {
    return AppStorage.getItem(`goalMapActiveGoalie_${App.helpers.getCurrentTeamId()}`) || "";
  },

  handleListClick(e) {
    const row = e.target.closest("li.goalie-slot");
    if (!row) return;

    const checkbox = row.querySelector(".player-checkbox");
    const nameInput = row.querySelector(".name-input");
    const index = Number(row.dataset.index);
    if (Number.isNaN(index)) return;

    if (e.target.matches(".set-active-btn")) {
      if (checkbox) checkbox.checked = true;
      this.saveCurrentState(index);
      return;
    }

    if (!e.target.matches("input")) {
      if (checkbox && nameInput?.value.trim()) {
        checkbox.checked = true;
        this.saveCurrentState(index);
      }
    }
  },

  render() {
    if (!this.container) return;

    const players = this.getPlayers();
    const activeGoalieName = this.getActiveGoalieNameFromStorage();

    this.container.innerHTML = players.map((player, index) => {
      const isActiveGoalie = player.name && player.name === activeGoalieName;
      return `
        <li class="goalie-slot${isActiveGoalie ? ' active-goalie-slot' : ''}" data-index="${index}">
          <input type="checkbox" ${player.active ? 'checked' : ''} class="player-checkbox" aria-label="Select goalie ${index + 1}">
          <input type="text" class="num-input" placeholder="Nr." value="${App.helpers.escapeHtml(player.number)}" data-field="number">
          <input type="text" class="name-input" placeholder="Enter goalie name" value="${App.helpers.escapeHtml(player.name)}" data-field="name">
          <div class="pos-fixed">G</div>
          <button type="button" class="top-btn set-active-btn"${!player.name.trim() ? ' disabled' : ''}>${isActiveGoalie ? 'Active' : 'Set Active'}</button>
        </li>
      `;
    }).join("");
  },

  debouncedSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.saveCurrentState(), 250);
  },

  syncSelectionFromRoster() {
    const selectedGoalies = this.getPlayers()
      .filter(player => player.active && player.name)
      .map(player => ({ num: player.number, name: player.name, position: "G" }));
    App.data.selectedPlayers = selectedGoalies;
    App.storage.saveSelectedPlayers();
  },

  saveCurrentState(preferredActiveIndex = null) {
    if (!this.container) return;

    const players = Array.from(this.container.querySelectorAll("li.goalie-slot")).map((row) => {
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

    AppStorage.setItem(this.getStorageKey(), JSON.stringify(players));

    const selectedGoalies = players
      .filter(player => player.active && player.name)
      .map(player => ({ num: player.number, name: player.name, position: "G" }));

    App.data.selectedPlayers = selectedGoalies;
    App.storage.saveSelectedPlayers();

    const activeCandidates = players.filter(player => player.active && player.name);
    const preferredActive = preferredActiveIndex !== null ? players[preferredActiveIndex] : null;
    const currentActive = this.getActiveGoalieNameFromStorage();
    const validCurrentActive = activeCandidates.find(player => player.name === currentActive);
    const nextActive = (preferredActive?.active && preferredActive?.name)
      ? preferredActive.name
      : (validCurrentActive?.name || activeCandidates[0]?.name || "");

    if (nextActive) {
      AppStorage.setItem(`goalMapActiveGoalie_${App.helpers.getCurrentTeamId()}`, nextActive);
    } else {
      AppStorage.removeItem(`goalMapActiveGoalie_${App.helpers.getCurrentTeamId()}`);
    }

    App.goalMap?.updateActiveGoalieButton?.();
    App.goalMap?.filterByGoalies?.(nextActive ? [nextActive] : []);
    App.goalMap?.renderTimeTracking?.();
    App.statsTable?.render?.();
    this.render();
  },

  handleConfirm() {
    this.saveCurrentState();
    if (!App.data.selectedPlayers.length) {
      alert("Select at least one goalie before opening Game Center.");
      return;
    }
    App.showPage("stats");
  },

  reset() {
    if (!confirm("Reset all goalie slots?")) return;
    App.data.selectedPlayers = [];
    App.storage.saveSelectedPlayers();
    AppStorage.removeItem(this.getStorageKey());
    AppStorage.removeItem(`goalMapActiveGoalie_${App.helpers.getCurrentTeamId()}`);
    App.goalMap?.reset?.(true);
    App.goalMap?.setActiveGoalie?.("");
    this.render();
    App.goalMap?.updateActiveGoalieButton?.();
    App.statsTable?.render?.();
    App.seasonMap?.render?.();
  }
};
