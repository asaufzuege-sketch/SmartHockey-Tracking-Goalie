App.goalMap = {
  fieldBox: null,
  goalBox: null,
  timeTrackingBox: null,
  currentPeriod: 'p1',
  longPressMs: 600,

  init() {
    this.fieldBox = document.getElementById("fieldBox");
    this.goalBox = document.getElementById("goalRedBox");
    this.timeTrackingBox = document.getElementById("timeTrackingBox");
    if (!this.fieldBox || !this.goalBox || !this.timeTrackingBox) return;

    this.attachMarkerHandlers();
    this.initTimeTracking();
    this.restoreMarkers();
    this.ensureActiveGoalieValid();
    this.updateActiveGoalieButton();
    this.renderTimeTracking();
  },

  getPlayersFromStorage() {
    try {
      return JSON.parse(AppStorage.getItem(`playerSelectionData_${App.helpers.getCurrentTeamId()}`) || "[]")
        .filter(player => player.active && player.name)
        .map(player => ({
          number: player.number || "",
          name: player.name,
          position: "G",
          active: true
        }));
    } catch (e) {
      return [];
    }
  },

  getActiveGoalie() {
    const activeName = AppStorage.getItem(`goalMapActiveGoalie_${App.helpers.getCurrentTeamId()}`) || "";
    return (App.data.selectedPlayers || []).find(player => player.name === activeName) || null;
  },

  ensureActiveGoalieValid() {
    const activeGoalie = this.getActiveGoalie();
    if (activeGoalie) return activeGoalie;

    const firstGoalie = (App.data.selectedPlayers || [])[0]?.name || "";
    if (firstGoalie) {
      AppStorage.setItem(`goalMapActiveGoalie_${App.helpers.getCurrentTeamId()}`, firstGoalie);
      return this.getActiveGoalie();
    }
    AppStorage.removeItem(`goalMapActiveGoalie_${App.helpers.getCurrentTeamId()}`);
    return null;
  },

  setActiveGoalie(name) {
    if (name) {
      AppStorage.setItem(`goalMapActiveGoalie_${App.helpers.getCurrentTeamId()}`, name);
    } else {
      AppStorage.removeItem(`goalMapActiveGoalie_${App.helpers.getCurrentTeamId()}`);
    }
    this.updateActiveGoalieButton();
    this.filterByGoalies(name ? [name] : []);
    this.renderTimeTracking();
  },

  updateActiveGoalieButton() {
    const btn = document.getElementById("activeGoalieBtn");
    if (!btn) return;
    const goalie = this.ensureActiveGoalieValid();
    btn.textContent = goalie?.name || "No Goalie Selected";
  },

  attachMarkerHandlers() {
    [this.fieldBox, this.goalBox].forEach(box => {
      if (!box || box.dataset.handlersAttached === 'true') return;
      box.dataset.handlersAttached = 'true';
      const img = box.querySelector("img");
      if (!img) return;
      box.style.position = "relative";

      let pressTimer = null;
      let longPressTriggered = false;
      let startEvent = null;

      const getPosFromEvent = (event) => {
        const point = event.changedTouches?.[0] || event.touches?.[0] || event;
        const rect = img.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;

        const xPct = ((point.clientX - rect.left) / rect.width) * 100;
        const yPct = ((point.clientY - rect.top) / rect.height) * 100;
        if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return null;
        return { xPct, yPct };
      };

      const clearPress = () => {
        if (pressTimer) clearTimeout(pressTimer);
        pressTimer = null;
      };

      const placeMarker = (event, isGoal) => {
        const goalie = this.ensureActiveGoalieValid();
        if (!goalie) {
          alert("Please select a goalie first.");
          return;
        }

        const pos = getPosFromEvent(event);
        if (!pos) return;

        if (box === this.goalBox) {
          const sampler = App.markerHandler.createImageSampler(img);
          if (sampler?.valid && !sampler.isNeutralWhiteAt(pos.xPct, pos.yPct, 190, 45)) return;
        }

        const dot = App.markerHandler.createMarkerPercent(
          pos.xPct,
          pos.yPct,
          isGoal ? "#c62828" : "#808080",
          box,
          true,
          goalie.name
        );

        dot.dataset.period = this.currentPeriod;
        dot.dataset.boxId = box.id;
        dot.dataset.markerType = isGoal ? "goal" : "save";
        this.saveMarkers();
      };

      const handleStart = (event) => {
        if (event.target.closest(".marker-dot")) return;
        longPressTriggered = false;
        startEvent = event;
        clearPress();
        pressTimer = setTimeout(() => {
          longPressTriggered = true;
          placeMarker(startEvent, true);
        }, this.longPressMs);
      };

      const handleEnd = (event) => {
        if (event.target.closest(".marker-dot")) {
          clearPress();
          return;
        }
        clearPress();
        if (!longPressTriggered) {
          placeMarker(event, false);
        }
      };

      box.addEventListener("mousedown", handleStart);
      box.addEventListener("touchstart", handleStart, { passive: true });
      box.addEventListener("mouseup", handleEnd);
      box.addEventListener("touchend", handleEnd, { passive: true });
      box.addEventListener("mouseleave", clearPress);
      box.addEventListener("touchcancel", clearPress, { passive: true });
    });
  },

  getCurrentMarkersFromDOM() {
    return Array.from(document.querySelectorAll(App.selectors.torbildBoxes)).map(box =>
      Array.from(box.querySelectorAll(".marker-dot")).map(dot => ({
        xPct: parseFloat(dot.dataset.xPctImage || "0") || 0,
        yPct: parseFloat(dot.dataset.yPctImage || "0") || 0,
        color: dot.style.backgroundColor || "",
        player: dot.dataset.player || "",
        period: dot.dataset.period || "p1",
        markerType: dot.dataset.markerType || "save",
        boxId: box.id
      }))
    );
  },

  saveMarkers() {
    const teamId = App.helpers.getCurrentTeamId();
    AppStorage.setItem(`goalMapMarkers_${teamId}`, JSON.stringify(this.getCurrentMarkersFromDOM()));
    this.syncGoalMapDataFromMarkers();
    this.filterByGoalies(this.getActiveGoalie()?.name ? [this.getActiveGoalie().name] : []);
    this.renderTimeTracking();
    App.statsTable?.render?.();
  },

  restoreMarkers() {
    const teamId = App.helpers.getCurrentTeamId();
    const boxes = Array.from(document.querySelectorAll(App.selectors.torbildBoxes));
    boxes.forEach(box => box.querySelectorAll(".marker-dot").forEach(dot => dot.remove()));

    let saved = [];
    try {
      saved = JSON.parse(AppStorage.getItem(`goalMapMarkers_${teamId}`) || "[]");
    } catch (e) {
      saved = [];
    }

    boxes.forEach((box, boxIndex) => {
      const markers = saved[boxIndex] || [];
      markers.forEach(marker => {
        const dot = App.markerHandler.createMarkerPercent(
          marker.xPct,
          marker.yPct,
          marker.color || "#808080",
          box,
          true,
          marker.player || null
        );
        dot.dataset.period = marker.period || "p1";
        dot.dataset.boxId = marker.boxId || box.id;
        dot.dataset.markerType = marker.markerType || (marker.color === "#c62828" ? "goal" : "save");
      });
    });

    this.syncGoalMapDataFromMarkers();
    this.filterByGoalies(this.getActiveGoalie()?.name ? [this.getActiveGoalie().name] : []);
  },

  syncGoalMapDataFromMarkers() {
    const teamId = App.helpers.getCurrentTeamId();
    const markers = this.getCurrentMarkersFromDOM();
    const fieldMarkers = markers[0] || [];
    const goalMarkers = markers[1] || [];
    const goalMapData = {};
    const rinkCountData = {};

    goalMarkers.forEach(marker => {
      if (!marker.player) return;
      if (!goalMapData[marker.player]) goalMapData[marker.player] = [];
      goalMapData[marker.player].push(
        this.isGoalMarker(marker)
          ? { eventType: "goal", workflowType: "conceded", period: marker.period }
          : { eventType: "opponent-shot", period: marker.period }
      );
    });

    fieldMarkers.forEach(marker => {
      if (!marker.player) return;
      if (!rinkCountData[marker.player]) rinkCountData[marker.player] = [];
      rinkCountData[marker.player].push(
        this.isGoalMarker(marker)
          ? { eventType: "goal", workflowType: "conceded", period: marker.period }
          : { eventType: "opponent-shot", period: marker.period }
      );
    });

    App.data.goalMapData = goalMapData;
    App.data.rinkCountData = rinkCountData;
    AppStorage.setItem(`goalMapData_${teamId}`, JSON.stringify(goalMapData));
    AppStorage.setItem(`rinkCountData_${teamId}`, JSON.stringify(rinkCountData));
  },

  isGoalMarker(marker) {
    return marker?.markerType === "goal" || marker?.color === "#c62828" || marker?.color === "rgb(198, 40, 40)";
  },

  filterByGoalies(goalieNames) {
    let allowed = null;
    if (Array.isArray(goalieNames)) {
      allowed = new Set(goalieNames);
    } else {
      allowed = new Set((App.data.selectedPlayers || []).map(player => player.name));
    }
    document.querySelectorAll("#statsPage .marker-dot").forEach(dot => {
      dot.style.display = allowed.has(dot.dataset.player) ? "" : "none";
    });
  },

  initTimeTracking() {
    if (!this.timeTrackingBox || this.timeTrackingBox.dataset.initialized === "true") return;
    this.timeTrackingBox.dataset.initialized = "true";

    this.timeTrackingBox.querySelectorAll(".period").forEach(periodEl => {
      periodEl.addEventListener("click", () => {
        this.currentPeriod = periodEl.dataset.period || "p1";
        this.timeTrackingBox.querySelectorAll(".period").forEach(el => el.classList.remove("active-period"));
        periodEl.classList.add("active-period");
      });

      periodEl.querySelectorAll(".time-btn").forEach((button, index) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          const goalie = this.ensureActiveGoalieValid();
          if (!goalie) {
            alert("Please select a goalie first.");
            return;
          }

          this.currentPeriod = periodEl.dataset.period || "p1";
          this.timeTrackingBox.querySelectorAll(".period").forEach(el => el.classList.remove("active-period"));
          periodEl.classList.add("active-period");

          const key = `${this.currentPeriod}_${index}`;
          const timeData = this.readTimeDataWithPlayers();
          if (!timeData[key]) timeData[key] = {};
          timeData[key][goalie.name] = Number(timeData[key][goalie.name] || 0) + 1;
          AppStorage.setItem(`timeDataWithPlayers_${App.helpers.getCurrentTeamId()}`, JSON.stringify(timeData));
          this.renderTimeTracking();
        });

        button.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          const goalie = this.ensureActiveGoalieValid();
          if (!goalie) return;
          const key = `${periodEl.dataset.period || "p1"}_${index}`;
          const timeData = this.readTimeDataWithPlayers();
          if (!timeData[key]) return;
          timeData[key][goalie.name] = Math.max(0, Number(timeData[key][goalie.name] || 0) - 1);
          if (timeData[key][goalie.name] === 0) delete timeData[key][goalie.name];
          if (Object.keys(timeData[key]).length === 0) delete timeData[key];
          AppStorage.setItem(`timeDataWithPlayers_${App.helpers.getCurrentTeamId()}`, JSON.stringify(timeData));
          this.renderTimeTracking();
        });
      });
    });
  },

  readTimeDataWithPlayers() {
    try {
      return JSON.parse(AppStorage.getItem(`timeDataWithPlayers_${App.helpers.getCurrentTeamId()}`) || "{}");
    } catch (e) {
      return {};
    }
  },

  renderTimeTracking() {
    const timeData = this.readTimeDataWithPlayers();
    const activeGoalie = this.getActiveGoalie();
    this.timeTrackingBox?.querySelectorAll(".period").forEach(periodEl => {
      periodEl.querySelectorAll(".time-btn").forEach((button, index) => {
        const key = `${periodEl.dataset.period || "p1"}_${index}`;
        const playerData = timeData[key] || {};
        button.textContent = activeGoalie ? String(Number(playerData[activeGoalie.name] || 0)) : "0";
      });
    });
  },

  readTimeTrackingFromBox() {
    const flat = {};
    this.timeTrackingBox?.querySelectorAll(".period").forEach(periodEl => {
      periodEl.querySelectorAll(".time-btn").forEach((button, index) => {
        flat[`${periodEl.dataset.period || "p1"}_${index}`] = Number(button.textContent || 0);
      });
    });
    return flat;
  },

  syncCurrentGameToSeasonMap() {
    const teamId = App.helpers.getCurrentTeamId();
    const currentMarkers = this.getCurrentMarkersFromDOM();
    const currentTimeData = this.readTimeDataWithPlayers();
    const exportHash = JSON.stringify({ currentMarkers, currentTimeData });
    const lastExportHash = AppStorage.getItem(`seasonMapLastExportHash_${teamId}`);
    if (exportHash === lastExportHash) return;

    let seasonMarkers = [[], []];
    try {
      seasonMarkers = JSON.parse(AppStorage.getItem(`seasonMapMarkers_${teamId}`) || "[[],[]]");
    } catch (e) {
      seasonMarkers = [[], []];
    }

    currentMarkers.forEach((markers, index) => {
      if (!Array.isArray(seasonMarkers[index])) seasonMarkers[index] = [];
      seasonMarkers[index].push(...markers);
    });

    const seasonTimeData = App.helpers.safeJSONParse(`seasonMapTimeDataWithPlayers_${teamId}`, {}) || {};
    Object.entries(currentTimeData).forEach(([key, goalieCounts]) => {
      if (!seasonTimeData[key]) seasonTimeData[key] = {};
      Object.entries(goalieCounts).forEach(([goalieName, value]) => {
        seasonTimeData[key][goalieName] = Number(seasonTimeData[key][goalieName] || 0) + Number(value || 0);
      });
    });

    const flattened = {};
    Object.entries(seasonTimeData).forEach(([key, goalieCounts]) => {
      flattened[key] = Object.values(goalieCounts).reduce((sum, value) => sum + Number(value || 0), 0);
    });

    AppStorage.setItem(`seasonMapMarkers_${teamId}`, JSON.stringify(seasonMarkers));
    AppStorage.setItem(`seasonMapTimeDataWithPlayers_${teamId}`, JSON.stringify(seasonTimeData));
    AppStorage.setItem(`seasonMapTimeData_${teamId}`, JSON.stringify(flattened));
    AppStorage.setItem(`seasonMapLastExportHash_${teamId}`, exportHash);
  },

  exportGoalMap() {
    this.syncCurrentGameToSeasonMap();
    alert("Game Center markers exported to Season Map.");
  },

  reset(skipConfirm = false) {
    if (!skipConfirm && !confirm("Reset current Game Center tracking data?")) return;
    const teamId = App.helpers.getCurrentTeamId();
    document.querySelectorAll("#statsPage .marker-dot").forEach(dot => dot.remove());
    this.timeTrackingBox?.querySelectorAll(".time-btn").forEach(button => { button.textContent = "0"; });
    AppStorage.removeItem(`goalMapMarkers_${teamId}`);
    AppStorage.removeItem(`goalMapData_${teamId}`);
    AppStorage.removeItem(`rinkCountData_${teamId}`);
    AppStorage.removeItem(`timeDataWithPlayers_${teamId}`);
    this.syncGoalMapDataFromMarkers();
    App.statsTable?.render?.();
  }
};
