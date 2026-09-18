App.seasonMap = {
  selectedGoalie: "",
  comparisonGoalie: "",

  init() {
    this.loadPersistedFilters();
    document.getElementById("seasonMapGoalieFilter")?.addEventListener("change", (event) => {
      this.selectedGoalie = this.resolveGoalieName(event.target.value || "");
      if (this.selectedGoalie && this.selectedGoalie === this.comparisonGoalie) {
        this.comparisonGoalie = "";
      }
      this.persistFilters();
      this.renderFieldHeader();
      this.render();
    });
    document.getElementById("seasonMapCompareGoalie")?.addEventListener("change", (event) => {
      this.comparisonGoalie = this.resolveGoalieName(event.target.value || "");
      if (this.comparisonGoalie === this.selectedGoalie) {
        this.comparisonGoalie = "";
      }
      this.persistFilters();
      this.renderFieldHeader();
      this.render();
    });
  },

  getFilterStorageKey() {
    return `seasonMapGoalieFilters_${App.helpers.getCurrentTeamId()}`;
  },

  loadPersistedFilters() {
    const saved = App.helpers.safeJSONParse(this.getFilterStorageKey(), {}) || {};
    this.selectedGoalie = String(saved.selectedGoalie || "");
    this.comparisonGoalie = String(saved.comparisonGoalie || "");
  },

  persistFilters() {
    AppStorage.setItem(this.getFilterStorageKey(), JSON.stringify({
      selectedGoalie: this.selectedGoalie || "",
      comparisonGoalie: this.comparisonGoalie || ""
    }));
  },

  resolveGoalieName(value) {
    const target = String(value || "").trim();
    if (!target) return "";
    const allGoalies = this.getAvailableGoalies();
    const exact = allGoalies.find(name => name === target);
    if (exact) return exact;
    const normalized = target.toLowerCase();
    const alias = allGoalies.find(name => String(name || "").trim().toLowerCase() === normalized);
    return alias || target;
  },

  getGoalieCount(goalieCounts, goalieName) {
    if (!goalieName) {
      return Object.values(goalieCounts || {}).reduce((sum, count) => sum + Number(count || 0), 0);
    }
    const direct = Number(goalieCounts?.[goalieName] || 0);
    if (direct > 0) return direct;
    const normalized = String(goalieName).trim().toLowerCase();
    const alias = Object.keys(goalieCounts || {}).find(name => String(name || "").trim().toLowerCase() === normalized);
    return Number(goalieCounts?.[alias] || 0);
  },

  getSeasonMarkers() {
    try {
      const raw = JSON.parse(AppStorage.getItem(`seasonMapMarkers_${App.helpers.getCurrentTeamId()}`) || "[[],[]]");
      if (Array.isArray(raw) && raw.length >= 3) {
        const knownGoalies = new Set([
          ...Object.keys(App.data.goalieSeasonData || {}),
          ...this.getLegacyGoalieNamesFromTimeData()
        ]);
        const legacyGoalMarkers = [
          ...(raw[2] || []),
          ...((raw[1] || []).filter(marker => !marker.player || knownGoalies.size === 0 || knownGoalies.has(marker.player)))
        ];
        return [raw[0] || [], legacyGoalMarkers];
      }
      return Array.isArray(raw) ? [raw[0] || [], raw[1] || []] : [[], []];
    } catch (e) {
      return [[], []];
    }
  },

  getSeasonTimeData() {
    return App.helpers.safeJSONParse(`seasonMapTimeDataWithPlayers_${App.helpers.getCurrentTeamId()}`, {}) || {};
  },

  getLegacyGoalieNamesFromTimeData() {
    const names = new Set();
    Object.entries(this.getSeasonTimeData()).forEach(([key, goalieCounts]) => {
      const buttonIndex = Number(String(key).split('_')[1]);
      if (buttonIndex < 4) return;
      Object.keys(goalieCounts || {}).forEach(goalie => names.add(goalie));
    });
    return Array.from(names);
  },

  getAvailableGoalies() {
    const byNormalized = new Map();
    const addGoalie = (goalie) => {
      const raw = String(goalie || "").trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      if (!byNormalized.has(key)) byNormalized.set(key, raw);
    };

    Object.keys(App.data.goalieSeasonData || {}).forEach(addGoalie);
    const goalMarkers = this.getSeasonMarkers()[1] || [];
    goalMarkers.forEach(marker => {
      addGoalie(marker.player);
    });
    const goaliesFromMarkers = new Set(byNormalized.values());
    Object.entries(this.getSeasonTimeData()).forEach(([key, goalieCounts]) => {
      if (!/^(?:p[1-3]_[0-3]|sp[1-3]_[0-3])$/i.test(String(key))) return;
      Object.keys(goalieCounts || {}).forEach(addGoalie);
    });
    const roster = App.helpers.safeJSONParse(`playerSelectionData_${App.helpers.getCurrentTeamId()}`, []) || [];
    roster
      .filter(player => String(player?.position || "").toUpperCase() === "G")
      .forEach(player => addGoalie(player?.name));
    if (byNormalized.size === 0) {
      (App.data.selectedPlayers || []).forEach(player => {
        const isGoalie = String(player?.position || "").toUpperCase() === "G" || player?.isGoalie === true;
        if (isGoalie) addGoalie(player.name);
      });
    }
    return Array.from(byNormalized.values()).sort((a, b) => a.localeCompare(b));
  },

  populateGoalieFilter() {
    const select = document.getElementById("seasonMapGoalieFilter");
    if (!select) return;
    const savedValue = this.resolveGoalieName(this.selectedGoalie);
    const goalies = this.getAvailableGoalies();
    select.innerHTML = '<option value="">All Goalies</option>';
    if (goalies.length === 0) {
      this.selectedGoalie = "";
      return;
    }
    goalies.forEach(goalie => {
      const option = document.createElement("option");
      option.value = goalie;
      option.textContent = goalie;
      select.appendChild(option);
    });
    select.value = goalies.includes(savedValue) ? savedValue : "";
    this.selectedGoalie = select.value || "";
  },

  populateCompareFilter() {
    const select = document.getElementById("seasonMapCompareGoalie");
    if (!select) return;
    if (!this.selectedGoalie) {
      select.innerHTML = '<option value="">No comparison</option>';
      this.comparisonGoalie = "";
      return;
    }
    const savedValue = this.resolveGoalieName(this.comparisonGoalie);
    const goalies = this.getAvailableGoalies().filter(goalie => goalie !== this.selectedGoalie);
    select.innerHTML = '<option value="">No comparison</option>';
    goalies.forEach(goalie => {
      const option = document.createElement("option");
      option.value = goalie;
      option.textContent = goalie;
      select.appendChild(option);
    });
    select.value = goalies.includes(savedValue) ? savedValue : "";
    this.comparisonGoalie = select.value || "";
  },

  render() {
    this.populateGoalieFilter();
    this.populateCompareFilter();
    this.renderFieldHeader();
    this.renderMarkers();
    this.renderTimeTracking();
    this.persistFilters();
    this.renderMomentumGraphic?.();
    if (App.seasonTable) {
      App.seasonTable.externalGoalieFilter = this.selectedGoalie || "";
      App.seasonTable.externalComparisonGoalie = this.comparisonGoalie || "";
      App.seasonTable.render();
    }
  },

  renderMarkers() {
    const boxes = [
      document.getElementById("seasonFieldBox"),
      document.getElementById("seasonGoalRedBox")
    ];
    boxes.forEach(box => box?.querySelectorAll(".marker-dot").forEach(dot => dot.remove()));

    const markers = this.getSeasonMarkers();
    const allowedGoalie = String(this.selectedGoalie || "").trim().toLowerCase();

    boxes.forEach((box, index) => {
      if (!box) return;
      (markers[index] || []).forEach(marker => {
        if (allowedGoalie && String(marker.player || "").trim().toLowerCase() !== allowedGoalie) return;
        const dot = App.markerHandler.createMarkerPercent(
          marker.xPct,
          marker.yPct,
          marker.color || "#808080",
          box,
          false,
          marker.player || null
        );
        dot.dataset.period = marker.period || "p1";
        dot.dataset.markerType = marker.markerType || "save";
      });
    });
  },

  renderFieldHeader() {
    const fieldBox = document.getElementById("seasonFieldBox");
    if (!fieldBox) return;
    const timeData = this.getSeasonTimeData();
    const periodTotal = (period) => {
      let total = 0;
      for (let index = 0; index < 4; index += 1) {
        const key = `${period}_${index}`;
        const legacyKey = `s${period}_${index}`;
        const goalieCounts = timeData[key] || timeData[legacyKey] || {};
        total += this.getGoalieCount(goalieCounts, this.selectedGoalie);
      }
      return total;
    };
    const periodSections = [
      { key: "p1", label: "P1" },
      { key: "p2", label: "P2" },
      { key: "p3", label: "P3" }
    ];
    let header = fieldBox.querySelector(".field-header");
    if (!header) {
      header = document.createElement("div");
      header.className = "field-header";
      fieldBox.appendChild(header);
    }
    const goalieLabel = this.selectedGoalie || "All";
    const periodSummary = periodSections
      .map(period => `${period.label}: ${periodTotal(period.key)}`)
      .join(" • ");
    header.textContent = `Goalie: ${goalieLabel} • ${periodSummary}`;
  },

  renderTimeTracking() {
    const timeData = this.getSeasonTimeData();
    document.querySelectorAll("#seasonMapPage .period").forEach(periodEl => {
      periodEl.querySelectorAll(".time-btn").forEach((button, index) => {
        const storedPeriod = String(periodEl.dataset.period || "p1").replace(/^sp/, 'p');
        const key = `${storedPeriod}_${index}`;
        const goalieCounts = timeData[key] || {};
        const value = this.getGoalieCount(goalieCounts, this.selectedGoalie);
        button.textContent = String(value);
      });
    });
  },

};
