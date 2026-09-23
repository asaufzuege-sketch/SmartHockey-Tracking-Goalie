// Helper-Funktionen


App.helpers = {
  getCurrentTeamId() {
    return GOALIE_TEAM_ID;
  },

  getActiveGoalieStorageKey() {
    return `activeGoalie_${this.getCurrentTeamId()}`;
  },

  getLegacyActiveGoalieStorageKey() {
    return `goalMapActiveGoalie_${this.getCurrentTeamId()}`;
  },

  getStoredActiveGoalieName() {
    const parseStoredName = (value) => {
      if (!value) return "";
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === "string") return parsed;
        return String(parsed?.name || "");
      } catch (e) {
        return String(value || "");
      }
    };

    return parseStoredName(AppStorage.getItem(this.getActiveGoalieStorageKey()))
      || parseStoredName(AppStorage.getItem(this.getLegacyActiveGoalieStorageKey()))
      || "";
  },

  setStoredActiveGoalieName(name) {
    const value = String(name || "").trim();
    if (value) {
      AppStorage.setItem(this.getActiveGoalieStorageKey(), value);
      AppStorage.setItem(this.getLegacyActiveGoalieStorageKey(), value);
      return;
    }
    AppStorage.removeItem(this.getActiveGoalieStorageKey());
    AppStorage.removeItem(this.getLegacyActiveGoalieStorageKey());
  },
  
  escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":"&#39;"
    })[c]);
  },
  
  formatTimeMMSS(sec) {
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  },
  
  parseTimeToSeconds(str) {
    if (!str) return 0;
    const parts = str.split(":");
    if (parts.length >= 2) {
      const mm = Number(parts[0]) || 0;
      const ss = Number(parts[1]) || 0;
      return mm * 60 + ss;
    }
    return Number(str) || 0;
  },
  
  splitCsvLines(text) {
    return text.split(/\r?\n/).map(r => r.trim()).filter(r => r.length > 0);
  },
  
  parseCsvLine(line) {
    return line.split(";").map(s => s.trim());
  },
  
  parseForSort(val) {
    if (val === null || val === undefined) return "";
    const v = String(val).trim();
    if (v === "") return "";
    if (/^\d{1,2}:\d{2}$/.test(v)) {
      const [mm, ss] = v.split(":").map(Number);
      return mm * 60 + ss;
    }
    if (/%$/.test(v)) {
      return Number(v.replace("%", "")) || 0;
    }
    const n = Number(v.toString().replace(/[^0-9.-]/g, ""));
    if (!isNaN(n) && v.match(/[0-9]/)) return n;
    return v.toLowerCase();
  },

  getRunningFieldPlayerNames() {
    const selectedPlayers = Array.isArray(App.data.selectedPlayers) ? App.data.selectedPlayers : [];
    return Object.keys(App.data.activeTimers || {}).filter(playerName => {
      const player = selectedPlayers.find(p => p.name === playerName);
      return !!player && player.position !== "G" && !player.isGoalie;
    });
  },

  getSeasonPossessionStats(seasonData) {
    const shotsForOnIce = Number(seasonData?.shotsForOnIce || 0);
    const shotsAgainstOnIce = Number(seasonData?.shotsAgainstOnIce || 0);
    const timeSeconds = Number(seasonData?.timeSeconds || 0);
    const minutes = timeSeconds > 0 ? (timeSeconds / 60) : 0;
    const sfPerMin = minutes > 0 ? (shotsForOnIce / minutes) : 0;
    const saPerMin = minutes > 0 ? (shotsAgainstOnIce / minutes) : 0;
    const totalOnIceShots = shotsForOnIce + shotsAgainstOnIce;

    return {
      shotsForOnIce,
      shotsAgainstOnIce,
      timeSeconds,
      minutes,
      sfPerMin,
      saPerMin,
      sfPerMinDisplay: sfPerMin.toFixed(1),
      saPerMinDisplay: saPerMin.toFixed(1),
      shotShareDisplay: totalOnIceShots > 0 ? `${Math.round((shotsForOnIce / totalOnIceShots) * 100)}%` : "–"
    };
  },

  calculateSeasonMVPPoints(playerName, seasonData) {
    if (!seasonData) return 0;

    const games = Number(seasonData.games || 0);
    const goals = Number(seasonData.goals || 0);
    const assists = Number(seasonData.assists || 0);
    const plusMinus = Number(seasonData.plusMinus || 0);
    const shots = Number(seasonData.shots || 0);
    const penalty = Number(seasonData.penaltys || 0);

    const avgPlusMinus = games ? (plusMinus / games) : 0;
    const shotsPerGame = games ? (shots / games) : 0;
    const goalsPerGame = games ? (goals / games) : 0;
    const assistsPerGame = games ? (assists / games) : 0;
    const penaltyPerGame = games ? (penalty / games) : 0;
    const possessionStats = this.getSeasonPossessionStats(seasonData);

    let goalValue = 0;
    try {
      if (App.goalValue && typeof App.goalValue.computeValueForPlayer === "function") {
        goalValue = App.goalValue.computeValueForPlayer(playerName) ?? Number(seasonData.goalValue || 0);
      } else {
        goalValue = Number(seasonData.goalValue || 0);
      }
    } catch (e) {
      goalValue = Number(seasonData.goalValue || 0);
    }
    const gvNum = Number(goalValue || 0);

    return (
      (assistsPerGame * 8) +
      (avgPlusMinus * 0.5) +
      (shotsPerGame * 0.5) +
      (goalsPerGame + (games ? (gvNum / games) * 10 : 0)) -
      (penaltyPerGame * 1.2) +
      (possessionStats.sfPerMin * 1.0) -
      (possessionStats.saPerMin * 1.0)
    );
  },
  
  getColorStyles() {
    return {
      pos: getComputedStyle(document.documentElement).getPropertyValue('--cell-pos-color')?.trim() || "#00ff80",
      neg: getComputedStyle(document.documentElement).getPropertyValue('--cell-neg-color')?.trim() || "#ff4c4c",
      zero: getComputedStyle(document.documentElement).getPropertyValue('--cell-zero-color')?.trim() || "#ffffff",
      headerBg: getComputedStyle(document.documentElement).getPropertyValue('--header-bg') || "#1E1E1E",
      headerText: getComputedStyle(document.documentElement).getPropertyValue('--text-color') || "#fff"
    };
  },
  
  getCurrentDateString() {
    return new Date().toISOString().slice(0, 10);
  },
  
  sanitizeFilename(str) {
    // Allow alphanumeric, spaces, hyphens, underscores, and dots
    // Replace other characters with underscore
    return String(str || "")
      .replace(/[^a-zA-Z0-9\s\-_.]/g, '_')
      .replace(/\s+/g, '_')  // Replace spaces with underscores
      .replace(/_+/g, '_');  // Collapse multiple underscores
  },
  
  // Normalize goalie filter value: "All Goalies" or empty string → null
  normalizeGoalieFilter(value) {
    if (!value || value === "" || value === "All Goalies") {
      return null;
    }
    return value;
  },
  
  // Safe JSON parse with error handling and user notification
  safeJSONParse(key, fallback = null) {
    try {
      const raw = AppStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error(`[Storage] Error parsing ${key}:`, e);
      // Optional: User notification if showNotification exists
      if (typeof App.showNotification === 'function') {
        App.showNotification(`Daten für ${key} konnten nicht geladen werden.`, 'warning');
      }
      return fallback;
    }
  },

  bindLongPressAction(button, { onClick, onLongPress, longPressMs = 800 } = {}) {
    if (!button) return;
    let timer = null;
    let pointerActive = false;
    let longPressTriggered = false;
    let suppressNextClick = false;

    const clearTimer = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };

    const startTimer = (triggerLongPress) => {
      clearTimer();
      longPressTriggered = false;
      timer = setTimeout(() => {
        longPressTriggered = true;
        suppressNextClick = true;
        triggerLongPress?.();
      }, Math.max(0, Number(longPressMs) || 800));
    };

    if (typeof window.PointerEvent === "function") {
      button.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        pointerActive = true;
        startTimer(() => onLongPress?.(event));
      });
      button.addEventListener("pointerup", (event) => {
        if (!pointerActive) return;
        pointerActive = false;
        clearTimer();
        if (!longPressTriggered) {
          suppressNextClick = true;
          onClick?.(event);
        }
      });
      button.addEventListener("pointercancel", () => {
        pointerActive = false;
        clearTimer();
      });
      button.addEventListener("pointerleave", () => {
        if (!pointerActive) return;
        pointerActive = false;
        clearTimer();
      });
    } else {
      button.addEventListener("touchstart", (event) => {
        pointerActive = true;
        startTimer(() => onLongPress?.(event));
      }, { passive: true });
      button.addEventListener("touchend", (event) => {
        if (!pointerActive) return;
        pointerActive = false;
        clearTimer();
        if (!longPressTriggered) {
          suppressNextClick = true;
          onClick?.(event);
        }
      });
      button.addEventListener("touchcancel", () => {
        pointerActive = false;
        clearTimer();
      });
      button.addEventListener("mousedown", (event) => {
        if (event.button !== 0) return;
        pointerActive = true;
        startTimer(() => onLongPress?.(event));
      });
      button.addEventListener("mouseup", (event) => {
        if (!pointerActive || event.button !== 0) return;
        pointerActive = false;
        clearTimer();
      });
      button.addEventListener("mouseleave", () => {
        if (!pointerActive) return;
        pointerActive = false;
        clearTimer();
      });
    }

    button.addEventListener("click", (event) => {
      if (suppressNextClick) {
        suppressNextClick = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClick?.(event);
    });
  },

  showDownloadChoiceDialog({ onPdf, onExcel } = {}) {
    if (!document?.body) {
      onPdf?.();
      return;
    }

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "flex";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="modal-content" style="max-width:420px;width:92%;text-align:center;">
        <h3 style="margin-top:0;">Download</h3>
        <div class="modal-buttons" style="justify-content:center;flex-wrap:wrap;">
          <button type="button" data-action="pdf" class="confirm-btn">📄 Graphics (PDF)</button>
          <button type="button" data-action="excel" class="confirm-btn">📊 Statistics (Excel)</button>
          <button type="button" data-action="both" class="confirm-btn">Both</button>
          <button type="button" data-action="cancel" class="cancel-btn">Cancel</button>
        </div>
      </div>
    `;

    const runPdf = () => Promise.resolve(onPdf?.());
    const runExcel = () => Promise.resolve(onExcel?.());
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const close = () => {
      document.removeEventListener("keydown", onKeyDown);
      modal.remove();
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };

    modal.addEventListener("click", (event) => {
      if (event.target === modal) close();
    });

    modal.querySelectorAll("button[data-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        const action = button.dataset.action;
        if (action === "cancel") {
          close();
          return;
        }

        close();
        if (action === "pdf") {
          await runPdf();
          return;
        }
        if (action === "excel") {
          await runExcel();
          return;
        }
        const pdfResult = await runPdf();
        if (pdfResult === false) return;
        await delay(600);
        await runExcel();
      });
    });

    document.body.appendChild(modal);
    document.addEventListener("keydown", onKeyDown);
    modal.querySelector("button[data-action='pdf']")?.focus();
  }
};
