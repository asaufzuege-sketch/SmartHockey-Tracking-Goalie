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
        if (e.target.matches(".num-input, .name-input")) {
          this.persist();
          this.syncRowClasses();
        }
      });
      this.container.addEventListener("input", (e) => {
        if (e.target.matches(".num-input, .name-input")) {
          this.debouncedPersist();
          this.syncRowClasses();
        }
      });
      this.container.addEventListener("focusout", (e) => {
        if (!e.target.matches(".num-input, .name-input")) return;
        window.setTimeout(() => {
          if (!this.hasFocusedListInput()) {
            this.persist();
            this.render();
          }
        }, 0);
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

  captureFocusedInputState() {
    if (!this.container) return null;
    const activeElement = document.activeElement;
    if (!activeElement || !this.container.contains(activeElement) || !activeElement.matches(".num-input, .name-input")) {
      return null;
    }

    const row = activeElement.closest("li.goalie-slot");
    const index = Number(row?.dataset.index);
    if (Number.isNaN(index)) return null;

    return {
      index,
      field: activeElement.dataset.field || (activeElement.classList.contains("name-input") ? "name" : "number"),
      selectionStart: typeof activeElement.selectionStart === "number" ? activeElement.selectionStart : null,
      selectionEnd: typeof activeElement.selectionEnd === "number" ? activeElement.selectionEnd : null
    };
  },

  restoreFocusedInputState(focusState) {
    if (!focusState || !this.container) return;

    window.requestAnimationFrame(() => {
      const selector = `li.goalie-slot[data-index="${focusState.index}"] [data-field="${focusState.field}"]`;
      const input = this.container.querySelector(selector);
      if (!input) return;
      input.focus({ preventScroll: true });
      if (focusState.selectionStart !== null && typeof input.setSelectionRange === "function") {
        try {
          input.setSelectionRange(focusState.selectionStart, focusState.selectionEnd ?? focusState.selectionStart);
        } catch (e) {
          // Ignore selection restore failures on unsupported input types.
        }
      }
    });
  },

  hasFocusedListInput() {
    if (!this.container) return false;
    const activeElement = document.activeElement;
    return !!activeElement
      && this.container.contains(activeElement)
      && activeElement.matches(".num-input, .name-input");
  },

  render() {
    if (!this.container) return;

    const focusState = this.captureFocusedInputState();
    const players = this.normalizePlayers(this.getPlayers());

    this.container.innerHTML = players.map((player, index) => {
      return `
        <li class="goalie-slot${player.active ? ' active-goalie-slot' : ''}" data-index="${index}">
          <input type="checkbox" ${player.active ? 'checked' : ''} class="player-checkbox" aria-label="Select goalie ${index + 1}">
          <input type="text" class="num-input" placeholder="Nr." value="${App.helpers.escapeHtml(player.number)}" data-field="number" inputmode="numeric">
          <input type="text" class="name-input" placeholder="Enter goalie name" value="${App.helpers.escapeHtml(player.name)}" data-field="name" autocomplete="off" autocapitalize="words" enterkeyhint="next">
          <div class="pos-fixed position-box">G</div>
        </li>
      `;
    }).join("");
    this.updateGameDataButton(players);
    this.syncRowClasses(players);
    this.restoreFocusedInputState(focusState);
  },

  debouncedPersist() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.persist(), 250);
  },

  syncSelectionFromRoster() {
    const players = this.normalizePlayers(this.getPlayers());
    const selectedGoalies = this.getSelectedGoalies(players);
    App.data.selectedPlayers = selectedGoalies;
    App.storage.saveSelectedPlayers();
    App.helpers.setStoredActiveGoalieName(selectedGoalies[0]?.name || "");
    this.updateGameDataButton(players);
    this.syncRowClasses(players);
  },

  persist(preferredActiveIndex = null) {
    if (!this.container) return;
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

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
    this.syncRowClasses(players);
  },

  syncRowClasses(players = null) {
    if (!this.container) return;
    const normalizedPlayers = players || this.normalizePlayers(this.getPlayersFromDOM());
    Array.from(this.container.querySelectorAll("li.goalie-slot")).forEach((row, index) => {
      const isActive = !!normalizedPlayers[index]?.active;
      row.classList.toggle("active-goalie-slot", isActive);
    });
    this.updateGameDataButton(normalizedPlayers);
  },

  handleCheckboxChange(index, checkbox) {
    if (!checkbox?.checked) {
      this.render();
      return;
    }
    this.persist(index);
    this.render();
  },

  handleConfirm() {
    this.persist();
    this.render();
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
    App.goalMap?.reset?.({ skipConfirm: true, allGoalies: true });
    App.goalMap?.setActiveGoalie?.("");
    this.render();
    App.goalMap?.updateActiveGoalieButton?.();
    App.statsTable?.render?.();
    App.seasonMap?.syncSelectedGoalieToActive?.();
    App.seasonMap?.render?.();
  }
};
