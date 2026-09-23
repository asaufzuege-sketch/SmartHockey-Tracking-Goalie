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
    const activeName = App.helpers.getStoredActiveGoalieName();
    return (App.data.selectedPlayers || []).find(player => player.name === activeName) || null;
  },

  ensureActiveGoalieValid() {
    const activeGoalie = this.getActiveGoalie();
    if (activeGoalie) return activeGoalie;

    const firstGoalie = (App.data.selectedPlayers || [])[0]?.name || "";
    if (firstGoalie) {
      App.helpers.setStoredActiveGoalieName(firstGoalie);
      return this.getActiveGoalie();
    }
    App.helpers.setStoredActiveGoalieName("");
    return null;
  },

  setActiveGoalie(name) {
    App.helpers.setStoredActiveGoalieName(name);
    this.updateActiveGoalieButton();
    this.filterByGoalies(name ? [name] : []);
    this.renderTimeTracking();
  },

  updateActiveGoalieButton() {
    const btn = document.getElementById("activeGoalieBtn");
    if (!btn) return;
    const goalie = this.ensureActiveGoalieValid();
    btn.textContent = goalie?.name || "No Goalie Selected";
    btn.disabled = !goalie;
  },

  attachMarkerHandlers() {
    [this.fieldBox, this.goalBox].forEach(box => {
      if (!box || box.dataset.handlersAttached === 'true') return;
      box.dataset.handlersAttached = 'true';
      const img = box.querySelector("img");
      if (!img) return;
      box.style.position = "relative";
      box.addEventListener("contextmenu", (event) => event.preventDefault());

      const supportsPointerEvents = typeof window.PointerEvent === "function";
      const moveThreshold = 10;
      let pressTimer = null;
      let gesture = null;

      const clearPressTimer = () => {
        if (pressTimer) clearTimeout(pressTimer);
        pressTimer = null;
      };

      const getPointFromEvent = (event, pointerId = null) => {
        if (typeof pointerId === "number" && (event.changedTouches || event.touches)) {
          const touches = [...(event.changedTouches || []), ...(event.touches || [])];
          const matchingTouch = touches.find(touch => touch.identifier === pointerId);
          if (matchingTouch) return matchingTouch;
        }
        return event.changedTouches?.[0] || event.touches?.[0] || event;
      };

      const getPosFromEvent = (event, pointerId = null) => {
        const point = getPointFromEvent(event, pointerId);
        if (!point) return null;
        return App.markerHandler.getImagePercentFromClientPoint(
          box,
          img,
          point.clientX,
          point.clientY
        );
      };

      const cancelGesture = () => {
        clearPressTimer();
        if (gesture && box.hasPointerCapture?.(gesture.pointerId)) {
          try {
            box.releasePointerCapture(gesture.pointerId);
          } catch (e) {
            // Ignore release failures for non-captured pointers.
          }
        }
        gesture = null;
      };

      const placeMarker = (event, isGoal) => {
        const goalie = this.ensureActiveGoalieValid();
        if (!goalie) {
          alert("Please select a goalie first.");
          return;
        }

        const pos = getPosFromEvent(event, gesture?.pointerId ?? null);
        if (!pos) return;

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

      const scheduleLongPress = () => {
        clearPressTimer();
        pressTimer = setTimeout(() => {
          if (!gesture || gesture.longPressTriggered || !gesture.allowLongPress) return;
          gesture.longPressTriggered = true;
          placeMarker(gesture.startEvent, true);
          navigator.vibrate?.(20);
        }, this.longPressMs);
      };

      const startGesture = (event, pointerId, options = {}) => {
        if (gesture || event.target.closest(".marker-dot")) return;
        const point = getPointFromEvent(event, pointerId);
        if (!point) return;

        gesture = {
          pointerId,
          startX: point.clientX,
          startY: point.clientY,
          startEvent: event,
          longPressTriggered: false,
          allowLongPress: options.allowLongPress !== false
        };
        if (gesture.allowLongPress) {
          scheduleLongPress();
        } else {
          clearPressTimer();
        }
      };

      const updateGesture = (event, pointerId) => {
        if (!gesture || gesture.pointerId !== pointerId) return;
        const point = getPointFromEvent(event, pointerId);
        if (!point) return;
        if (!getPosFromEvent(event, pointerId)) {
          cancelGesture();
          return;
        }
        const moved = Math.hypot(point.clientX - gesture.startX, point.clientY - gesture.startY);
        if (moved > moveThreshold) {
          cancelGesture();
        }
      };

      const finishGesture = (event, pointerId) => {
        if (!gesture || gesture.pointerId !== pointerId) return;
        const completedGesture = gesture;
        clearPressTimer();
        if (box.hasPointerCapture?.(pointerId)) {
          try {
            box.releasePointerCapture(pointerId);
          } catch (e) {
            // Ignore release failures for non-captured pointers.
          }
        }
        gesture = null;
        if (!completedGesture.longPressTriggered) {
          placeMarker(event, false);
        }
      };

      if (supportsPointerEvents) {
        box.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          startGesture(event, event.pointerId);
          box.setPointerCapture?.(event.pointerId);
        });
        box.addEventListener("pointermove", (event) => {
          updateGesture(event, event.pointerId);
        });
        box.addEventListener("pointerup", (event) => {
          finishGesture(event, event.pointerId);
        });
        box.addEventListener("pointercancel", (event) => {
          if (gesture?.pointerId === event.pointerId) cancelGesture();
        });
      } else {
        box.addEventListener("touchstart", (event) => {
          const touch = event.changedTouches?.[0] || event.touches?.[0];
          if (!touch) return;
          startGesture(event, touch.identifier);
        }, { passive: true });
        box.addEventListener("touchmove", (event) => {
          if (!gesture) return;
          updateGesture(event, gesture.pointerId);
        }, { passive: true });
        box.addEventListener("touchend", (event) => {
          if (!gesture) return;
          finishGesture(event, gesture.pointerId);
        }, { passive: true });
        box.addEventListener("touchcancel", (event) => {
          if (!gesture) return;
          const point = getPointFromEvent(event, gesture.pointerId);
          if (point) cancelGesture();
        }, { passive: true });
      }
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
    const boxes = Array.from(document.querySelectorAll(App.selectors.torbildBoxes));
    const fieldMarkers = [];
    const goalMarkers = [];
    markers.forEach((boxMarkers, index) => {
      const boxId = boxes[index]?.id || "";
      if (boxId === this.fieldBox?.id) {
        fieldMarkers.push(...(boxMarkers || []));
      } else if (boxId === this.goalBox?.id) {
        goalMarkers.push(...(boxMarkers || []));
      }
    });
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
      const markerType = marker.markerType === "goal"
        ? "goal"
        : "save";
      rinkCountData[marker.player].push(
        markerType === "goal"
          ? { eventType: "goal", workflowType: "conceded", markerType, period: marker.period }
          : { eventType: "save", markerType, period: marker.period }
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
    this.timeButtonClickTimers = this.timeButtonClickTimers || new WeakMap();

    this.timeTrackingBox.querySelectorAll(".period").forEach(periodEl => {
      periodEl.addEventListener("click", () => {
        this.setCurrentPeriod(periodEl);
      });

      periodEl.querySelectorAll(".time-btn").forEach((button, index) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          const goalie = this.ensureActiveGoalieValid();
          if (!goalie) {
            alert("Please select a goalie first.");
            return;
          }

          const pendingTimer = this.timeButtonClickTimers.get(button);
          this.setCurrentPeriod(periodEl);

          if (pendingTimer) {
            clearTimeout(pendingTimer);
            this.timeButtonClickTimers.delete(button);
            this.adjustTimeTrackingValue(periodEl, index, goalie.name, -1);
            return;
          }

          const timerId = setTimeout(() => {
            this.timeButtonClickTimers.delete(button);
            this.adjustTimeTrackingValue(periodEl, index, goalie.name, 1);
          }, 250);

          this.timeButtonClickTimers.set(button, timerId);
        });

        button.addEventListener("dblclick", (event) => {
          event.preventDefault();
          event.stopPropagation();
        });

        button.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const pendingTimer = this.timeButtonClickTimers.get(button);
          if (pendingTimer) {
            clearTimeout(pendingTimer);
            this.timeButtonClickTimers.delete(button);
          }
          const goalie = this.ensureActiveGoalieValid();
          if (!goalie) return;
          this.setCurrentPeriod(periodEl);
          this.adjustTimeTrackingValue(periodEl, index, goalie.name, -1);
        });
      });
    });
  },

  setCurrentPeriod(periodEl) {
    this.currentPeriod = periodEl?.dataset.period || "p1";
    this.timeTrackingBox?.querySelectorAll(".period").forEach(el => el.classList.remove("active-period"));
    periodEl?.classList.add("active-period");
  },

  adjustTimeTrackingValue(periodEl, index, goalieName, delta) {
    if (!goalieName) return;
    const period = periodEl?.dataset.period || "p1";
    const key = `${period}_${index}`;
    const timeData = this.readTimeDataWithPlayers();
    const currentValue = Number(timeData[key]?.[goalieName] || 0);
    const nextValue = Math.max(0, currentValue + delta);

    if (nextValue > 0) {
      if (!timeData[key]) timeData[key] = {};
      timeData[key][goalieName] = nextValue;
    } else if (timeData[key]) {
      delete timeData[key][goalieName];
      if (Object.keys(timeData[key]).length === 0) delete timeData[key];
    }

    AppStorage.setItem(`timeDataWithPlayers_${App.helpers.getCurrentTeamId()}`, JSON.stringify(timeData));
    this.renderTimeTracking();
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

  getSeasonMapExportHashStorageKey(goalieName) {
    const teamId = App.helpers.getCurrentTeamId();
    const normalizedGoalie = this.normalizeGoalieName(goalieName);
    if (!normalizedGoalie) return `seasonMapLastExportHash_${teamId}`;
    return `seasonMapLastExportHash_${teamId}_${normalizedGoalie}`;
  },

  clearSeasonMapExportHashes(goalieName = "") {
    const teamId = App.helpers.getCurrentTeamId();
    const baseKey = `seasonMapLastExportHash_${teamId}`;
    AppStorage.removeItem(baseKey);

    const normalizedGoalie = this.normalizeGoalieName(goalieName);
    if (normalizedGoalie) {
      AppStorage.removeItem(this.getSeasonMapExportHashStorageKey(goalieName));
      return;
    }
    AppStorage.removeItemsByUnprefixedPrefix?.(`${baseKey}_`);
  },

  getGoalieScopedMarkers(markersBySurface, goalieName) {
    const normalizedGoalie = this.normalizeGoalieName(goalieName);
    return (Array.isArray(markersBySurface) ? markersBySurface : [[], []]).map((markers) => (
      (Array.isArray(markers) ? markers : []).filter((marker) => {
        const markerGoalie = this.normalizeGoalieName(marker?.player || "");
        return !!markerGoalie && markerGoalie === normalizedGoalie;
      })
    ));
  },

  getGoalieScopedTimeData(timeDataWithPlayers, goalieName) {
    const normalizedGoalie = this.normalizeGoalieName(goalieName);
    const scoped = {};
    Object.entries(timeDataWithPlayers || {}).forEach(([key, goalieCounts]) => {
      if (!goalieCounts || typeof goalieCounts !== "object") return;
      const matchedGoalieName = Object.keys(goalieCounts).find(
        name => this.normalizeGoalieName(name) === normalizedGoalie
      );
      if (!matchedGoalieName) return;
      const value = Number(goalieCounts[matchedGoalieName] || 0);
      if (value <= 0) return;
      scoped[key] = value;
    });
    return scoped;
  },

  hasUnsavedGameData(goalieName = this.getActiveGoalie()?.name || App.helpers.getStoredActiveGoalieName() || "") {
    const teamId = App.helpers.getCurrentTeamId();
    const normalizedGoalie = this.normalizeGoalieName(goalieName);
    if (!normalizedGoalie) return false;

    const currentMarkers = this.getGoalieScopedMarkers(this.getCurrentMarkersFromDOM(), goalieName);
    const currentTimeData = this.getGoalieScopedTimeData(this.readTimeDataWithPlayers(), goalieName);
    const hasMarkers = currentMarkers.some(markers => Array.isArray(markers) && markers.length > 0);
    const hasTimeData = Object.keys(currentTimeData).length > 0;
    if (!hasMarkers && !hasTimeData) return false;

    const exportHash = JSON.stringify({ currentMarkers, currentTimeData });
    const perGoalieKey = this.getSeasonMapExportHashStorageKey(goalieName);
    const legacyKey = `seasonMapLastExportHash_${teamId}`;
    const lastExportHash = AppStorage.getItem(perGoalieKey) ?? AppStorage.getItem(legacyKey);
    return exportHash !== lastExportHash;
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
    const activeGoalieName = this.getActiveGoalie()?.name || App.helpers.getStoredActiveGoalieName() || "";
    const normalizedGoalie = this.normalizeGoalieName(activeGoalieName);
    if (!normalizedGoalie) return;

    const currentMarkers = this.getGoalieScopedMarkers(this.getCurrentMarkersFromDOM(), activeGoalieName);
    const currentTimeData = this.getGoalieScopedTimeData(this.readTimeDataWithPlayers(), activeGoalieName);
    const exportHash = JSON.stringify({ currentMarkers, currentTimeData });
    const perGoalieKey = this.getSeasonMapExportHashStorageKey(activeGoalieName);
    const legacyKey = `seasonMapLastExportHash_${teamId}`;
    const lastExportHash = AppStorage.getItem(perGoalieKey) ?? AppStorage.getItem(legacyKey);
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
    Object.entries(currentTimeData).forEach(([key, count]) => {
      if (!seasonTimeData[key]) seasonTimeData[key] = {};
      const targetGoalieName = Object.keys(seasonTimeData[key]).find(
        name => this.normalizeGoalieName(name) === normalizedGoalie
      ) || activeGoalieName;
      seasonTimeData[key][targetGoalieName] = Number(seasonTimeData[key][targetGoalieName] || 0) + Number(count || 0);
    });

    const flattened = {};
    Object.entries(seasonTimeData).forEach(([key, goalieCounts]) => {
      flattened[key] = Object.values(goalieCounts).reduce((sum, value) => sum + Number(value || 0), 0);
    });

    AppStorage.setItem(`seasonMapMarkers_${teamId}`, JSON.stringify(seasonMarkers));
    AppStorage.setItem(`seasonMapTimeDataWithPlayers_${teamId}`, JSON.stringify(seasonTimeData));
    AppStorage.setItem(`seasonMapTimeData_${teamId}`, JSON.stringify(flattened));
    AppStorage.setItem(perGoalieKey, exportHash);
    AppStorage.setItem(legacyKey, exportHash);
    App.seasonMap?.renderMomentumGraphic?.();
  },

  exportGoalMap() {
    this.syncCurrentGameToSeasonMap();
    alert("Game Center markers exported to Season Map.");
  },

  normalizeGoalieName(value) {
    if (App.seasonMap?.normalizeGoalieName) {
      return App.seasonMap.normalizeGoalieName(value);
    }
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  },

  cloneMarkerImageRelative(dot) {
    const copy = dot.cloneNode(true);
    const xPct = parseFloat(dot.dataset.xPctImage);
    const yPct = parseFloat(dot.dataset.yPctImage);
    if (Number.isFinite(xPct) && Number.isFinite(yPct)) {
      copy.style.left = `${xPct}%`;
      copy.style.top = `${yPct}%`;
    }
    return copy;
  },

  exportAsPDF() {
    if (typeof html2canvas !== 'function') {
      alert('Export library html2canvas is not available. Please refresh the page and try again.');
      return Promise.resolve(false);
    }
    if (!window.jspdf || typeof window.jspdf.jsPDF !== 'function') {
      alert('Export library jsPDF is not available. Please refresh the page and try again.');
      return Promise.resolve(false);
    }

    const goalieName = this.getActiveGoalie()?.name || 'goalie';
    const date = App.helpers.getCurrentDateString();
    const EXPORT_WIDTH = 1200;
    const PADDING = 16;
    const COL_GAP = 20;
    const INNER_WIDTH = EXPORT_WIDTH - (PADDING * 2);
    const fieldWidth = Math.round(INNER_WIDTH * 0.62);
    const rightWidth = INNER_WIDTH - COL_GAP - fieldWidth;
    const fieldHeight = Math.round(fieldWidth * 0.96);
    const goalHeight = Math.round(rightWidth * 0.62);

    const fieldBox = document.getElementById('fieldBox');
    const goalBox = document.getElementById('goalRedBox');
    const timeBox = document.getElementById('timeTrackingBox');
    if (!fieldBox || !goalBox || !timeBox) {
      alert('Game Center export failed: required elements are missing.');
      return Promise.resolve(false);
    }

    const fieldImgSrc = fieldBox.querySelector('img')?.getAttribute('src') || 'Spielfeld Overlay.png';
    const goalImgSrc = goalBox.querySelector('img')?.getAttribute('src') || 'Tor Rot.png';

    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = `position:absolute;left:-9999px;top:0;width:${EXPORT_WIDTH}px;background:#ffffff;padding:${PADDING}px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;`;

    const header = document.createElement('div');
    header.style.cssText = 'display:block;width:100%;box-sizing:border-box;padding:14px 16px;margin-bottom:16px;text-align:center;font-size:20px;font-weight:700;color:#000;background:#fff;border-bottom:2px solid #333;line-height:1.35;';
    header.textContent = `Goalie: ${goalieName} | Date: ${date}`;
    exportContainer.appendChild(header);

    const row = document.createElement('div');
    row.style.cssText = `display:flex;flex-direction:row;align-items:flex-start;gap:${COL_GAP}px;width:100%;box-sizing:border-box;`;

    const fieldColumn = document.createElement('div');
    fieldColumn.style.cssText = `flex:0 0 ${fieldWidth}px;width:${fieldWidth}px;height:${fieldHeight}px;position:relative;overflow:hidden;border-radius:10px;background:#ffffff;`;
    const fieldImg = document.createElement('img');
    fieldImg.src = fieldImgSrc;
    fieldImg.alt = 'Game field';
    fieldImg.style.cssText = 'display:block;width:100%;height:100%;border-radius:8px;';
    fieldColumn.appendChild(fieldImg);
    fieldBox.querySelectorAll('.marker-dot').forEach((dot) => {
      if (dot.style.display === 'none') return;
      fieldColumn.appendChild(this.cloneMarkerImageRelative(dot));
    });

    const rightColumn = document.createElement('div');
    rightColumn.style.cssText = `flex:0 0 ${rightWidth}px;width:${rightWidth}px;display:flex;flex-direction:column;gap:14px;box-sizing:border-box;`;

    const goalExportBox = document.createElement('div');
    goalExportBox.style.cssText = `width:${rightWidth}px;height:${goalHeight}px;position:relative;overflow:hidden;border-radius:10px;background:#fff;`;
    const goalImg = document.createElement('img');
    goalImg.src = goalImgSrc;
    goalImg.alt = 'Game goal';
    goalImg.style.cssText = 'display:block;width:100%;height:100%;border-radius:8px;';
    goalExportBox.appendChild(goalImg);
    goalBox.querySelectorAll('.marker-dot').forEach((dot) => {
      if (dot.style.display === 'none') return;
      goalExportBox.appendChild(this.cloneMarkerImageRelative(dot));
    });

    const timeClone = timeBox.cloneNode(true);
    timeClone.style.cssText = 'width:100%;box-sizing:border-box;background:#fff;border:1px solid #d0d0d0;border-radius:10px;padding:8px;';

    rightColumn.appendChild(goalExportBox);
    rightColumn.appendChild(timeClone);

    row.appendChild(fieldColumn);
    row.appendChild(rightColumn);
    exportContainer.appendChild(row);

    document.body.appendChild(exportContainer);

    const cleanup = () => {
      if (exportContainer.parentNode) exportContainer.parentNode.removeChild(exportContainer);
    };

    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const exportHeight = exportContainer.scrollHeight || exportContainer.offsetHeight;
        html2canvas(exportContainer, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: EXPORT_WIDTH,
          height: exportHeight
        }).then((canvas) => {
          cleanup();
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const margin = 10;
          const availableWidth = pageWidth - (margin * 2);
          const availableHeight = pageHeight - (margin * 2);
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
          const renderWidth = imgWidth * scale;
          const renderHeight = imgHeight * scale;
          const x = (pageWidth - renderWidth) / 2;
          const y = (pageHeight - renderHeight) / 2;
          doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, renderWidth, renderHeight);
          doc.save(`game_center_${date}_${App.helpers.sanitizeFilename(goalieName)}.pdf`);
          resolve(true);
        }).catch((error) => {
          cleanup();
          console.error('Game Center PDF export failed:', error);
          alert('Game Center PDF export failed. Please try again.');
          resolve(false);
        });
      });
    });
  },

  exportWorkbook() {
    if (typeof XLSX === 'undefined') {
      alert('Excel export library unavailable. Falling back to CSV export.');
      App.csvHandler?.exportGoalieGameStats?.();
      return;
    }

    const date = App.helpers.getCurrentDateString();
    const rows = App.statsTable?.getRows?.() || [];
    const gameSheetData = [["Nr", "Goalie", "Shots", "Saves", "Goals", "Save %"]];
    rows.forEach((row) => {
      gameSheetData.push([row.num || '', row.name, row.shots, row.saves, row.goals, row.savePct]);
    });

    const buckets = [
      'p1_0', 'p1_1', 'p1_2', 'p1_3',
      'p2_0', 'p2_1', 'p2_2', 'p2_3',
      'p3_0', 'p3_1', 'p3_2', 'p3_3'
    ];
    const activeGoalie = this.getActiveGoalie()?.name || '';
    const timeData = this.readTimeDataWithPlayers();
    const bucketRow = buckets.map((key) => {
      const goalieCounts = timeData[key] || {};
      const direct = Number(goalieCounts[activeGoalie] || 0);
      if (direct > 0) return direct;
      const normalized = String(activeGoalie || '').trim().toLowerCase();
      const alias = Object.keys(goalieCounts).find((name) => String(name || '').trim().toLowerCase() === normalized);
      return Number(goalieCounts[alias] || 0);
    });
    const timeSheetData = [["Goalie", ...buckets], [activeGoalie || 'Goalie', ...bucketRow]];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(gameSheetData), 'Game');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(timeSheetData), 'Time buckets');
    XLSX.writeFile(workbook, `goalie_game_${date}.xlsx`);
  },

  exportAll() {
    return this.exportAsPDF().then((success) => {
      if (success === false) return false;
      setTimeout(() => this.exportWorkbook(), 600);
      return true;
    });
  },


  reset(options = {}) {
    const { allGoalies = false, skipConfirm = false } = options;
    const teamId = App.helpers.getCurrentTeamId();

    if (allGoalies) {
      if (!skipConfirm && !confirm("Reset data for ALL goalies?")) return;
      document.querySelectorAll("#statsPage .marker-dot").forEach(dot => dot.remove());
      this.timeTrackingBox?.querySelectorAll(".time-btn").forEach(button => { button.textContent = "0"; });
      AppStorage.removeItem(`goalMapMarkers_${teamId}`);
      AppStorage.removeItem(`goalMapData_${teamId}`);
      AppStorage.removeItem(`rinkCountData_${teamId}`);
      AppStorage.removeItem(`timeDataWithPlayers_${teamId}`);
      this.clearSeasonMapExportHashes();
      this.syncGoalMapDataFromMarkers();
      this.renderTimeTracking();
      App.statsTable?.render?.();
      return;
    }

    const activeGoalieName = this.getActiveGoalie()?.name || App.helpers.getStoredActiveGoalieName() || "";
    const normalizedActiveGoalie = this.normalizeGoalieName(activeGoalieName);
    if (!normalizedActiveGoalie) {
      alert("Please select an active goalie first.");
      return;
    }
    if (!skipConfirm && !confirm(`Reset Game Center data for ${activeGoalieName}?`)) return;

    document.querySelectorAll("#statsPage .marker-dot").forEach(dot => {
      const markerGoalie = this.normalizeGoalieName(dot.dataset.player || "");
      if (markerGoalie !== normalizedActiveGoalie) return;
      dot.remove();
    });

    const timeData = this.readTimeDataWithPlayers();
    Object.keys(timeData).forEach((key) => {
      const goalieCounts = timeData[key];
      if (!goalieCounts || typeof goalieCounts !== "object") {
        delete timeData[key];
        return;
      }
      Object.keys(goalieCounts).forEach((goalieName) => {
        if (this.normalizeGoalieName(goalieName) !== normalizedActiveGoalie) return;
        delete goalieCounts[goalieName];
      });
      if (Object.keys(goalieCounts).length === 0) delete timeData[key];
    });
    if (Object.keys(timeData).length > 0) {
      AppStorage.setItem(`timeDataWithPlayers_${teamId}`, JSON.stringify(timeData));
    } else {
      AppStorage.removeItem(`timeDataWithPlayers_${teamId}`);
    }

    const pruneStoredByGoalie = (storageKey, inMemoryKey) => {
      const parsed = App.helpers.safeJSONParse(storageKey, {}) || {};
      const next = {};
      Object.entries(parsed).forEach(([goalieName, value]) => {
        const key = this.normalizeGoalieName(goalieName);
        if (key && key === normalizedActiveGoalie) return;
        next[goalieName] = value;
      });
      App.data[inMemoryKey] = next;
      if (Object.keys(next).length) {
        AppStorage.setItem(storageKey, JSON.stringify(next));
      } else {
        AppStorage.removeItem(storageKey);
      }
    };
    pruneStoredByGoalie(`goalMapData_${teamId}`, "goalMapData");
    pruneStoredByGoalie(`rinkCountData_${teamId}`, "rinkCountData");
    this.clearSeasonMapExportHashes(activeGoalieName);

    this.syncGoalMapDataFromMarkers();
    this.renderTimeTracking();
    App.statsTable?.render?.();
  }
};
