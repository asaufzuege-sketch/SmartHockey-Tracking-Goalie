App.seasonMap = {
  selectedGoalie: "",

  init() {
    document.getElementById("seasonMapGoalieFilter")?.addEventListener("change", (event) => {
      this.selectedGoalie = event.target.value || "";
      this.render();
    });
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
    const goalies = new Set();
    Object.keys(App.data.goalieSeasonData || {}).forEach(goalie => goalies.add(goalie));
    const goalMarkers = this.getSeasonMarkers()[1] || [];
    goalMarkers.forEach(marker => {
      if (marker.player) goalies.add(marker.player);
    });
    const goaliesFromMarkers = new Set(goalies);
    Object.entries(this.getSeasonTimeData()).forEach(([key, goalieCounts]) => {
      const buttonIndex = Number(String(key).split('_')[1]);
      const isLegacyGoalieBucket = buttonIndex >= 4;
      const mayBeGoalieOnlyData = goaliesFromMarkers.size === 0;
      if (!isLegacyGoalieBucket && !mayBeGoalieOnlyData) return;
      Object.keys(goalieCounts || {}).forEach(goalie => goalies.add(goalie));
    });
    if (goalies.size === 0) {
      (App.data.selectedPlayers || []).forEach(player => {
        if (player.name) goalies.add(player.name);
      });
    }
    return Array.from(goalies).filter(Boolean).sort();
  },

  populateGoalieFilter() {
    const select = document.getElementById("seasonMapGoalieFilter");
    if (!select) return;
    const savedValue = this.selectedGoalie;
    const goalies = this.getAvailableGoalies();
    select.innerHTML = '<option value="">All Goalies</option>';
    goalies.forEach(goalie => {
      const option = document.createElement("option");
      option.value = goalie;
      option.textContent = goalie;
      select.appendChild(option);
    });
    select.value = goalies.includes(savedValue) ? savedValue : "";
    this.selectedGoalie = select.value || "";
  },

  render() {
    this.populateGoalieFilter();
    this.renderMarkers();
    this.renderTimeTracking();
    this.renderMomentumGraphic?.();
    if (App.seasonTable) {
      App.seasonTable.externalGoalieFilter = this.selectedGoalie || "";
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
    const allowedGoalie = this.selectedGoalie;

    boxes.forEach((box, index) => {
      if (!box) return;
      (markers[index] || []).forEach(marker => {
        if (allowedGoalie && marker.player !== allowedGoalie) return;
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

  renderTimeTracking() {
    const timeData = this.getSeasonTimeData();
    document.querySelectorAll("#seasonMapPage .period").forEach(periodEl => {
      periodEl.querySelectorAll(".time-btn").forEach((button, index) => {
        const storedPeriod = String(periodEl.dataset.period || "p1").replace(/^sp/, 'p');
        const key = `${storedPeriod}_${index}`;
        const goalieCounts = timeData[key] || {};
        const value = this.selectedGoalie
          ? Number(goalieCounts[this.selectedGoalie] || 0)
          : Object.values(goalieCounts).reduce((sum, count) => sum + Number(count || 0), 0);
        button.textContent = String(value);
      });
    });
  },

};
