App.seasonMap = {
  selectedGoalie: "",
  comparisonGoalies: [],
  heatmapRenderTimeout: null,
  resizeTimeout: null,
  viewportSyncListener: null,
  pendingHeatmapImage: null,
  pendingGoalAreaImage: null,
  HEATMAP_RENDER_DELAY: 150,
  HEATMAP_RADIUS_FACTOR: 0.12,
  HEATMAP_MIN_OPACITY: 0.15,
  HEATMAP_MAX_OPACITY: 0.98,
  HEATMAP_DENSITY_POWER: 1.65,
  HEATMAP_DENSITY_SCALE: 2.8,
  HEATMAP_MIN_DENSITY_SCALE: 0.1,
  HEATMAP_BLUR_FACTOR: 0.32,
  HEATMAP_MIN_BLUR_PX: 6,
  HEATMAP_GRADIENT_CENTER_OPACITY: 0.18,
  HEATMAP_GRADIENT_OUTER_OPACITY: 0.065,
  HEATMAP_GRADIENT_EDGE_OPACITY: 0.022,
  HEATMAP_TARGET_S_BOOST: 1.0,
  HEATMAP_TARGET_L_DROP: 0.18,
  HEATMAP_NEUTRAL_SATURATION_THRESHOLD: 0.08,
  HEATMAP_NEUTRAL_MAX_SATURATION: 0.12,
  HEATMAP_NEUTRAL_SATURATION_BOOST: 0.04,
  HEATMAP_NEUTRAL_MIN_LIGHTNESS_FACTOR: 0.35,
  HEATMAP_COLORED_MIN_LIGHTNESS_FACTOR: 0.68,
  HEATMAP_GRADIENT_MIDPOINT_OPACITY: 0.6,
  HEATMAP_MAX_DPR: 3,
  GOAL_ZONE_LABELS: [
    { key: "tl", anchorX: 25, anchorY: 22 },
    { key: "tr", anchorX: 70, anchorY: 27 },
    { key: "bl", anchorX: 16, anchorY: 75 },
    { key: "bm", anchorX: 50, anchorY: 75 },
    { key: "br", anchorX: 84, anchorY: 75 }
  ],
  GOAL_FRAME_LEFT_PCT: 8,
  GOAL_FRAME_RIGHT_PCT: 92,
  GOAL_FRAME_TOP_PCT: 15,
  GOAL_FRAME_BOTTOM_PCT: 86,
  GOAL_FRAME_TOP_ROW_SPLIT_PCT: 50,

  init() {
    this.loadPersistedFilters();
    this.bindViewportSync();
  },

  getFilterStorageKey() {
    return `seasonMapGoalieFilters_${App.helpers.getCurrentTeamId()}`;
  },

  loadPersistedFilters() {
    const saved = App.helpers.safeJSONParse(this.getFilterStorageKey(), {}) || {};
    this.selectedGoalie = String(saved.selectedGoalie || "");
    if (Array.isArray(saved.comparisonGoalies)) {
      this.comparisonGoalies = this.normalizeComparisonGoalies(saved.comparisonGoalies, this.selectedGoalie);
    } else {
      const legacy = String(saved.comparisonGoalie || "").trim();
      this.comparisonGoalies = this.normalizeComparisonGoalies(legacy ? [legacy] : [], this.selectedGoalie);
    }
  },

  persistFilters() {
    AppStorage.setItem(this.getFilterStorageKey(), JSON.stringify({
      selectedGoalie: this.selectedGoalie || "",
      comparisonGoalies: this.comparisonGoalies.slice()
    }));
  },

  getStoredActiveGoalieName() {
    return App.helpers.getStoredActiveGoalieName();
  },

  getActiveGoalieName() {
    return this.resolveGoalieName(
      App.goalMap?.getActiveGoalie?.()?.name
      || this.getStoredActiveGoalieName()
      || ""
    );
  },

  syncSelectedGoalieToActive() {
    this.selectedGoalie = this.getActiveGoalieName();
    this.comparisonGoalies = this.normalizeComparisonGoalies(this.comparisonGoalies || [], this.selectedGoalie);
  },

  updateGoalieButton() {
    const button = document.getElementById("seasonMapGoalieBtn");
    if (!button) return;
    button.textContent = this.selectedGoalie || "No Goalie Selected";
    button.disabled = !this.selectedGoalie;
  },

  getRosterGoalies() {
    const roster = App.helpers.safeJSONParse(`playerSelectionData_${App.helpers.getCurrentTeamId()}`, []) || [];
    return roster
      .filter(player => String(player?.position || "").toUpperCase() === "G" || player?.isGoalie === true)
      .map(player => String(player?.name || "").trim())
      .filter(Boolean);
  },

  normalizeGoalieName(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  },

  resolveGoalieName(value) {
    const target = String(value || "").trim();
    if (!target) return "";
    const allGoalies = this.getAvailableGoalies();
    const normalized = this.normalizeGoalieName(target);
    const exact = allGoalies.find(name => name === target);
    if (exact) return exact;
    const alias = allGoalies.find(name => this.normalizeGoalieName(name) === normalized);
    return alias || target;
  },

  normalizeComparisonGoalies(goalies, excludedGoalie = this.selectedGoalie) {
    const excludedNormalized = this.normalizeGoalieName(excludedGoalie);
    const seen = new Set();
    return (Array.isArray(goalies) ? goalies : [])
      .map(name => this.resolveGoalieName(name))
      .map(name => String(name || "").trim())
      .filter(Boolean)
      .filter(name => this.normalizeGoalieName(name) !== excludedNormalized)
      .filter(name => {
        const key = this.normalizeGoalieName(name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
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
        // Legacy 3-array format stores goal-image markers in index 2.
        // Keep a boxId-based fallback so mixed historical payloads still classify correctly.
        const knownGoalies = new Set([
          ...Object.keys(App.data.goalieSeasonData || {}),
          ...this.getLegacyGoalieNamesFromTimeData()
        ].map(name => this.normalizeGoalieName(name)).filter(Boolean));
        const fieldMarkers = [...(Array.isArray(raw[0]) ? raw[0] : [])];
        const goalMarkers = [...(Array.isArray(raw[2]) ? raw[2] : [])];
        (Array.isArray(raw[1]) ? raw[1] : []).forEach((marker) => {
          const boxId = String(marker?.boxId || "").toLowerCase();
          if (boxId.includes("goal")) goalMarkers.push(marker);
          else if (boxId.includes("field")) fieldMarkers.push(marker);
          else if (
            !marker?.player
            || knownGoalies.size === 0
            || knownGoalies.has(this.normalizeGoalieName(marker.player))
          ) goalMarkers.push(marker);
          else fieldMarkers.push(marker);
        });
        return [fieldMarkers, goalMarkers];
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
    const addGoalie = (goalie, prefer = false) => {
      const raw = String(goalie || "").trim();
      if (!raw) return;
      const key = this.normalizeGoalieName(raw);
      if (!key) return;
      if (!byNormalized.has(key) || prefer) byNormalized.set(key, raw);
    };

    Object.keys(App.data.goalieSeasonData || {}).forEach(goalie => addGoalie(goalie, true));
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

  getComparableGoalies() {
    const selectedNormalized = this.normalizeGoalieName(this.selectedGoalie);
    const compared = new Set((this.comparisonGoalies || []).map(name => this.normalizeGoalieName(name)));
    const byNormalized = new Map();
    const addCandidate = (name, prefer = false) => {
      const raw = String(name || "").trim();
      if (!raw) return;
      const key = this.normalizeGoalieName(raw);
      if (!key || key === selectedNormalized || compared.has(key)) return;
      if (!byNormalized.has(key) || prefer) byNormalized.set(key, raw);
    };

    this.getRosterGoalies().forEach(name => addCandidate(name));
    Object.keys(App.data.goalieSeasonData || {}).forEach(name => addCandidate(name, true));

    return Array.from(byNormalized.values()).sort((a, b) => a.localeCompare(b));
  },

  renderSeasonTable() {
    if (!App.seasonTable) return;
    App.seasonTable.externalGoalieFilter = this.selectedGoalie || "";
    App.seasonTable.externalComparisonGoalies = (this.comparisonGoalies || []).slice();
    App.seasonTable.render();
  },

  addComparisonGoalie(name) {
    const resolved = this.resolveGoalieName(name);
    if (!resolved) return;
    if (!this.selectedGoalie) return;
    const selectedNormalized = this.normalizeGoalieName(this.selectedGoalie);
    const key = this.normalizeGoalieName(resolved);
    if (!key || key === selectedNormalized) return;
    if ((this.comparisonGoalies || []).some(existing => this.normalizeGoalieName(existing) === key)) return;

    this.comparisonGoalies = [...(this.comparisonGoalies || []), resolved];
    if (App.seasonTable) {
      App.seasonTable.goalieSortState.key = null;
      App.seasonTable.goalieSortState.asc = true;
    }
    this.persistFilters();
    this.render();
  },

  removeComparisonGoalie(name) {
    const key = this.normalizeGoalieName(name);
    const next = (this.comparisonGoalies || []).filter(existing => this.normalizeGoalieName(existing) !== key);
    if (next.length === (this.comparisonGoalies || []).length) return;
    this.comparisonGoalies = next;
    if (App.seasonTable) {
      App.seasonTable.goalieSortState.key = null;
      App.seasonTable.goalieSortState.asc = true;
    }
    this.persistFilters();
    this.render();
  },

  render(options = {}) {
    this.syncSelectedGoalieToActive();
    this.updateGoalieButton();
    this.renderFieldHeader();
    this.renderMarkers();
    this.renderGoalAreaStats();
    this.scheduleHeatmapRender();
    this.renderTimeTracking();
    this.persistFilters();
    this.renderMomentumGraphic?.();
    if (!options.skipSeasonTable) this.renderSeasonTable();
  },

  bindViewportSync() {
    if (this.viewportSyncListener) {
      window.removeEventListener("resize", this.viewportSyncListener);
      window.removeEventListener("orientationchange", this.viewportSyncListener);
    }

    this.viewportSyncListener = () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        App.markerHandler?.repositionMarkers?.();
        this.renderGoalAreaStats();
        this.scheduleHeatmapRender();
        this.renderMomentumGraphic?.();
      }, 100);
    };

    window.addEventListener("resize", this.viewportSyncListener);
    window.addEventListener("orientationchange", this.viewportSyncListener);
  },

  scheduleHeatmapRender(delay = this.HEATMAP_RENDER_DELAY) {
    clearTimeout(this.heatmapRenderTimeout);
    this.heatmapRenderTimeout = setTimeout(() => {
      this.renderHeatmap();
    }, Math.max(0, Number(delay) || 0));
  },

  getHeatmapCanvasRect(fieldBox, img) {
    const crop = App.markerHandler?.getCropRect?.(fieldBox);
    if (crop) {
      return {
        x: 0,
        y: 0,
        width: fieldBox.clientWidth,
        height: fieldBox.clientHeight,
        valid: fieldBox.clientWidth > 0 && fieldBox.clientHeight > 0
      };
    }

    const rendered = App.markerHandler?.computeRenderedImageRect?.(img);
    const boxRect = fieldBox.getBoundingClientRect();
    if (!rendered?.valid || !boxRect?.width || !boxRect?.height) return null;

    return {
      x: (Number.isFinite(rendered.left) ? rendered.left : rendered.x) - boxRect.left,
      y: (Number.isFinite(rendered.top) ? rendered.top : rendered.y) - boxRect.top,
      width: rendered.width,
      height: rendered.height,
      valid: rendered.width > 0 && rendered.height > 0
    };
  },

  getDefaultCropRect(fieldBox) {
    return App.markerHandler?.getCropRect?.(fieldBox) || { left: 0, top: 0, width: 100, height: 100 };
  },

  getHeatmapMarkers(fieldBox, img, canvasRect) {
    const goalMarkers = [];
    const saveMarkers = [];

    fieldBox.querySelectorAll(".marker-dot").forEach(marker => {
      const xPctImage = parseFloat(marker.dataset.xPctImage);
      const yPctImage = parseFloat(marker.dataset.yPctImage);
      if (!Number.isFinite(xPctImage) || !Number.isFinite(yPctImage)) return;

      const position = App.markerHandler?.getContainerPercentFromImagePercent?.(
        fieldBox,
        img,
        xPctImage,
        yPctImage
      );
      if (!position?.valid) return;

      const absoluteX = (position.xPct / 100) * fieldBox.clientWidth;
      const absoluteY = (position.yPct / 100) * fieldBox.clientHeight;
      const x = absoluteX - canvasRect.x;
      const y = absoluteY - canvasRect.y;
      if (x < 0 || y < 0 || x > canvasRect.width || y > canvasRect.height) return;

      const entry = {
        x: (x / canvasRect.width) * 100,
        y: (y / canvasRect.height) * 100
      };

      if ((marker.dataset.markerType || "").toLowerCase() === "goal") {
        goalMarkers.push(entry);
      } else {
        saveMarkers.push(entry);
      }
    });

    return { goalMarkers, saveMarkers };
  },

  renderHeatmap() {
    const fieldBox = document.getElementById("seasonFieldBox");
    if (!fieldBox) return;

    clearTimeout(this.heatmapRenderTimeout);

    const img = fieldBox.querySelector("img");
    if (!img) return;
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
      if (this.pendingHeatmapImage !== img) {
        this.pendingHeatmapImage = img;
        img.addEventListener("load", () => {
          if (this.pendingHeatmapImage === img) {
            this.pendingHeatmapImage = null;
          }
          this.scheduleHeatmapRender(0);
        }, { once: true });
      }
      return;
    }
    this.pendingHeatmapImage = null;

    const canvasRect = this.getHeatmapCanvasRect(fieldBox, img);
    if (!canvasRect?.valid || !canvasRect.width || !canvasRect.height) return;

    const { goalMarkers, saveMarkers } = this.getHeatmapMarkers(fieldBox, img, canvasRect);
    if (!goalMarkers.length && !saveMarkers.length) {
      fieldBox.querySelector(".heatmap-canvas")?.remove();
      return;
    }

    fieldBox.querySelector(".heatmap-canvas")?.remove();

    const canvas = document.createElement("canvas");
    canvas.className = "heatmap-canvas";
    canvas.style.left = `${canvasRect.x}px`;
    canvas.style.top = `${canvasRect.y}px`;
    canvas.style.width = `${canvasRect.width}px`;
    canvas.style.height = `${canvasRect.height}px`;

    const dpr = Math.max(1, Math.min(this.HEATMAP_MAX_DPR, window.devicePixelRatio || 1));
    canvas.width = Math.round(canvasRect.width * dpr);
    canvas.height = Math.round(canvasRect.height * dpr);
    if (!canvas.width || !canvas.height) return;

    this.drawHeatmapToCanvas(
      canvas,
      { goalMarkers, saveMarkers },
      canvasRect.width,
      canvasRect.height,
      dpr
    );

    const firstMarker = fieldBox.querySelector(".marker-dot");
    if (firstMarker) {
      fieldBox.insertBefore(canvas, firstMarker);
      return;
    }
    fieldBox.appendChild(canvas);
  },

  drawHeatmapToCanvas(canvas, { goalMarkers = [], saveMarkers = [] } = {}, width, height, dpr = 1) {
    if (!canvas || !width || !height) return;
    const safeDpr = Math.max(1, Number(dpr) || 1);
    canvas.width = Math.round(width * safeDpr);
    canvas.height = Math.round(height * safeDpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(safeDpr, 0, 0, safeDpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    this.drawHeatmapZone(ctx, saveMarkers, width, height, "rgba(68, 68, 68, 0.6)", safeDpr);
    this.drawHeatmapZone(ctx, goalMarkers, width, height, "rgba(255, 0, 0, 0.6)", safeDpr);
  },

  getHeatmapRadiusFactor() {
    return this.HEATMAP_RADIUS_FACTOR;
  },

  rgbToHsl(red, green, blue) {
    const redNorm = red / 255;
    const greenNorm = green / 255;
    const blueNorm = blue / 255;
    const max = Math.max(redNorm, greenNorm, blueNorm);
    const min = Math.min(redNorm, greenNorm, blueNorm);
    const delta = max - min;
    let hue = 0;
    let saturation = 0;
    const lightness = (max + min) / 2;

    if (delta !== 0) {
      saturation = delta / (1 - Math.abs((2 * lightness) - 1));
      switch (max) {
        case redNorm:
          hue = ((greenNorm - blueNorm) / delta) % 6;
          break;
        case greenNorm:
          hue = ((blueNorm - redNorm) / delta) + 2;
          break;
        default:
          hue = ((redNorm - greenNorm) / delta) + 4;
          break;
      }
      hue = (hue * 60 + 360) % 360;
    }

    return [hue, saturation, lightness];
  },

  hslToRgb(hue, saturation, lightness) {
    const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = lightness - (chroma / 2);
    let redPrime = 0;
    let greenPrime = 0;
    let bluePrime = 0;

    if (hue < 60) {
      redPrime = chroma; greenPrime = x;
    } else if (hue < 120) {
      redPrime = x; greenPrime = chroma;
    } else if (hue < 180) {
      greenPrime = chroma; bluePrime = x;
    } else if (hue < 240) {
      greenPrime = x; bluePrime = chroma;
    } else if (hue < 300) {
      redPrime = x; bluePrime = chroma;
    } else {
      redPrime = chroma; bluePrime = x;
    }

    return [
      Math.round((redPrime + m) * 255),
      Math.round((greenPrime + m) * 255),
      Math.round((bluePrime + m) * 255)
    ];
  },

  drawHeatmapZone(ctx, markers, width, height, color, dpr = 1) {
    if (!markers.length) return;

    const radius = width * this.getHeatmapRadiusFactor();
    const colorMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!colorMatch) return;

    const r = parseInt(colorMatch[1], 10);
    const g = parseInt(colorMatch[2], 10);
    const b = parseInt(colorMatch[3], 10);
    const physicalWidth = Math.round(width * dpr);
    const physicalHeight = Math.round(height * dpr);

    const offscreen = document.createElement("canvas");
    offscreen.width = physicalWidth;
    offscreen.height = physicalHeight;
    const offscreenCtx = offscreen.getContext("2d");
    if (!offscreenCtx) return;
    offscreenCtx.scale(dpr, dpr);
    offscreenCtx.globalCompositeOperation = "lighter";

    const centerOpacity = Math.max(0, Math.min(1, this.HEATMAP_GRADIENT_CENTER_OPACITY));
    const midpointOpacity = Math.max(0, Math.min(1, this.HEATMAP_GRADIENT_MIDPOINT_OPACITY));
    const outerOpacity = Math.max(0, Math.min(1, this.HEATMAP_GRADIENT_OUTER_OPACITY));
    const edgeOpacity = Math.max(0, Math.min(1, this.HEATMAP_GRADIENT_EDGE_OPACITY));

    markers.forEach(marker => {
      const x = (marker.x / 100) * width;
      const y = (marker.y / 100) * height;
      const gradient = offscreenCtx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0.0, `rgba(0, 0, 0, ${centerOpacity.toFixed(3)})`);
      gradient.addColorStop(0.35, `rgba(0, 0, 0, ${(centerOpacity * midpointOpacity).toFixed(3)})`);
      gradient.addColorStop(0.7, `rgba(0, 0, 0, ${outerOpacity.toFixed(3)})`);
      gradient.addColorStop(0.9, `rgba(0, 0, 0, ${edgeOpacity.toFixed(3)})`);
      gradient.addColorStop(1.0, "rgba(0, 0, 0, 0)");
      offscreenCtx.fillStyle = gradient;
      offscreenCtx.beginPath();
      offscreenCtx.arc(x, y, radius, 0, Math.PI * 2);
      offscreenCtx.fill();
    });

    let densityCanvas = offscreen;
    let densityCtx = offscreenCtx;
    const blurPx = Math.max(this.HEATMAP_MIN_BLUR_PX, radius * this.HEATMAP_BLUR_FACTOR);
    const blurred = document.createElement("canvas");
    blurred.width = physicalWidth;
    blurred.height = physicalHeight;
    const blurredCtx = blurred.getContext("2d");
    if (blurredCtx) {
      blurredCtx.scale(dpr, dpr);
      blurredCtx.filter = `blur(${blurPx}px)`;
      blurredCtx.drawImage(offscreen, 0, 0, width, height);
      blurredCtx.filter = "none";
      densityCanvas = blurred;
      densityCtx = blurredCtx;
    }

    const imageData = densityCtx.getImageData(0, 0, physicalWidth, physicalHeight);
    const data = imageData.data;
    const minOpacity = this.HEATMAP_MIN_OPACITY;
    const maxOpacity = this.HEATMAP_MAX_OPACITY;
    const opacityRange = maxOpacity - minOpacity;
    const densityScale = Math.max(this.HEATMAP_MIN_DENSITY_SCALE, this.HEATMAP_DENSITY_SCALE || 1);
    const baseHsl = this.rgbToHsl(r, g, b);
    const isNeutralColor = baseHsl[1] < this.HEATMAP_NEUTRAL_SATURATION_THRESHOLD;
    const maxTargetSaturation = isNeutralColor
      ? Math.min(this.HEATMAP_NEUTRAL_MAX_SATURATION, baseHsl[1] + this.HEATMAP_NEUTRAL_SATURATION_BOOST)
      : Math.max(0, Math.min(1, this.HEATMAP_TARGET_S_BOOST));
    const minLightnessFactor = isNeutralColor
      ? this.HEATMAP_NEUTRAL_MIN_LIGHTNESS_FACTOR
      : this.HEATMAP_COLORED_MIN_LIGHTNESS_FACTOR;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (!alpha) continue;

      const ratio = Math.min(1, (alpha / 255) * densityScale);
      const enhanced = Math.pow(ratio, this.HEATMAP_DENSITY_POWER);
      const opacity = minOpacity + (enhanced * opacityRange);
      const saturation = baseHsl[1] + ((maxTargetSaturation - baseHsl[1]) * enhanced);
      const minLightness = Math.max(0, baseHsl[2] * minLightnessFactor);
      const lightness = Math.max(minLightness, baseHsl[2] - (this.HEATMAP_TARGET_L_DROP * enhanced));
      const [nextR, nextG, nextB] = this.hslToRgb(baseHsl[0], Math.min(1, saturation), lightness);

      data[i] = nextR;
      data[i + 1] = nextG;
      data[i + 2] = nextB;
      data[i + 3] = Math.round(Math.min(1, opacity) * 255);
    }

    densityCtx.putImageData(imageData, 0, 0);
    const previousCompositeOperation = ctx.globalCompositeOperation;
    const previousImageSmoothingEnabled = ctx.imageSmoothingEnabled;
    const previousImageSmoothingQuality = ctx.imageSmoothingQuality;
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(densityCanvas, 0, 0, width, height);
    ctx.imageSmoothingEnabled = previousImageSmoothingEnabled;
    ctx.imageSmoothingQuality = previousImageSmoothingQuality;
    ctx.globalCompositeOperation = previousCompositeOperation;
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
        dot.dataset.markerType = this.resolveMarkerType(marker.markerType, marker.color);
      });
    });
  },

  resolveMarkerType(markerType, markerColor) {
    const normalizedType = String(markerType || "").trim().toLowerCase();
    if (normalizedType === "goal" || normalizedType === "save") return normalizedType;
    const normalizedColor = String(markerColor || "").trim();
    const hexMatch = normalizedColor.match(/^#([0-9a-f]{6})$/i);
    if (hexMatch) {
      const hex = hexMatch[1].toLowerCase();
      if (hex === "c62828") return "goal";
      return "save";
    }
    const rgbMatch = normalizedColor.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,[\d.]+)?\s*\)$/i);
    if (rgbMatch) {
      const red = Number(rgbMatch[1]);
      const green = Number(rgbMatch[2]);
      const blue = Number(rgbMatch[3]);
      if (red === 198 && green === 40 && blue === 40) return "goal";
      return "save";
    }
    return "save";
  },

  renderFieldHeader() {
    const fieldBox = document.getElementById("seasonFieldBox");
    if (!fieldBox) return;
    fieldBox.querySelector(".field-header")?.remove();
  },

  getGoalAreaZoneKey(xPctImage, yPctImage) {
    if (!Number.isFinite(xPctImage) || !Number.isFinite(yPctImage)) return null;
    const frameLeft = this.GOAL_FRAME_LEFT_PCT;
    const frameRight = this.GOAL_FRAME_RIGHT_PCT;
    const frameTop = this.GOAL_FRAME_TOP_PCT;
    const frameBottom = this.GOAL_FRAME_BOTTOM_PCT;
    if (
      xPctImage < frameLeft
      || xPctImage > frameRight
      || yPctImage < frameTop
      || yPctImage > frameBottom
    ) {
      return null;
    }
    const frameWidth = frameRight - frameLeft;
    const frameHeight = frameBottom - frameTop;
    if (!frameWidth || !frameHeight) return null;
    const normalizedX = ((xPctImage - frameLeft) / frameWidth) * 100;
    const normalizedY = ((yPctImage - frameTop) / frameHeight) * 100;

    if (normalizedY < this.GOAL_FRAME_TOP_ROW_SPLIT_PCT) {
      return normalizedX < 50 ? "tl" : "tr";
    }
    if (normalizedX < 33.3333) return "bl";
    if (normalizedX < 66.6667) return "bm";
    return "br";
  },

  computeGoalZoneStats(goalieName) {
    const selectedGoalie = this.normalizeGoalieName(goalieName);
    const zoneStats = {
      tl: { goals: 0, saves: 0 },
      tr: { goals: 0, saves: 0 },
      bl: { goals: 0, saves: 0 },
      bm: { goals: 0, saves: 0 },
      br: { goals: 0, saves: 0 }
    };

    let totalGoalMarkers = 0;
    const goalMarkers = this.getSeasonMarkers()?.[1] || [];
    goalMarkers.forEach((marker) => {
      if (selectedGoalie && this.normalizeGoalieName(marker?.player || "") !== selectedGoalie) return;
      const markerType = this.resolveMarkerType(marker?.markerType, marker?.color);
      const xPctImage = Number(marker?.xPct);
      const yPctImage = Number(marker?.yPct);
      if (markerType === "goal") totalGoalMarkers += 1;
      if (!Number.isFinite(xPctImage) || !Number.isFinite(yPctImage)) return;
      const zoneKey = this.getGoalAreaZoneKey(xPctImage, yPctImage);
      if (!zoneKey || !zoneStats[zoneKey]) return;
      if (markerType === "goal") zoneStats[zoneKey].goals += 1;
      if (markerType === "save") zoneStats[zoneKey].saves += 1;
    });

    const totalGoals = Object.values(zoneStats).reduce((sum, stats) => sum + stats.goals, 0);
    return { zoneStats, totalGoals, totalGoalMarkers };
  },

  getGoalZoneDisplayStats(goalieName) {
    const { zoneStats, totalGoals, totalGoalMarkers } = this.computeGoalZoneStats(goalieName);
    const byZone = {};
    this.GOAL_ZONE_LABELS.forEach((zone) => {
      const goals = Number(zoneStats?.[zone.key]?.goals || 0);
      const saves = Number(zoneStats?.[zone.key]?.saves || 0);
      const shots = goals + saves;
      byZone[zone.key] = {
        goals,
        saves,
        shots,
        goalPercent: totalGoals > 0 ? Math.round((goals / totalGoals) * 100) : null,
        savePercent: shots > 0 ? Math.round((saves / shots) * 100) : null
      };
    });
    return { byZone, totalGoals, totalGoalMarkers };
  },

  createGoalZoneLegend() {
    const legend = document.createElement("div");
    legend.className = "season-goal-zone-legend";
    legend.setAttribute("aria-hidden", "true");

    const gaDot = document.createElement("span");
    gaDot.className = "season-goal-zone-legend-dot season-goal-zone-legend-dot-ga";
    gaDot.textContent = "●";
    legend.appendChild(gaDot);
    legend.append(" GA = goal against · ");

    const svDot = document.createElement("span");
    svDot.className = "season-goal-zone-legend-dot season-goal-zone-legend-dot-sv";
    svDot.textContent = "●";
    legend.appendChild(svDot);
    legend.append(" SV = save · % = share of all GA / save % in zone");
    return legend;
  },

  ensureGoalZoneLegend(goalBox) {
    if (!goalBox?.parentElement) return null;
    let legend = document.getElementById("seasonGoalZoneLegend");
    if (!legend) {
      legend = this.createGoalZoneLegend();
      legend.id = "seasonGoalZoneLegend";
      goalBox.parentElement.insertBefore(legend, goalBox.nextSibling);
    }
    return legend;
  },

  createGoalAreaBadge(zoneStats) {
    const goals = Number(zoneStats?.goals || 0);
    const saves = Number(zoneStats?.saves || 0);
    const shots = goals + saves;
    const goalPercentText = Number.isFinite(zoneStats?.goalPercent) ? `${zoneStats.goalPercent}%` : "–";
    const savePercentText = Number.isFinite(zoneStats?.savePercent) ? `${zoneStats.savePercent}` : "–";

    const label = document.createElement("div");
    label.className = "goal-area-label";
    label.setAttribute("aria-hidden", "true");
    if (goals > 0) label.classList.add("goal-area-label-has-ga");
    if (shots === 0) {
      label.classList.add("goal-area-label-empty");
      label.textContent = "–";
      return label;
    }

    const line1 = document.createElement("span");
    line1.className = "goal-area-label-line goal-area-label-line-primary";
    const gaValue = document.createElement("span");
    gaValue.className = "goal-area-label-ga-value";
    gaValue.textContent = String(goals);
    line1.appendChild(gaValue);
    line1.append(` GA · ${goalPercentText}`);

    const line2 = document.createElement("span");
    line2.className = "goal-area-label-line goal-area-label-line-secondary";
    const svValue = document.createElement("span");
    svValue.className = "goal-area-label-sv-value";
    svValue.textContent = String(saves);
    line2.appendChild(svValue);
    line2.append(" SV");

    const line3 = document.createElement("span");
    line3.className = "goal-area-label-line goal-area-label-line-tertiary";
    line3.textContent = `SV% ${savePercentText}`;

    label.appendChild(line1);
    label.appendChild(line2);
    label.appendChild(line3);
    return label;
  },

  renderGoalAreaStats() {
    const goalBox = document.getElementById("seasonGoalRedBox");
    goalBox?.querySelectorAll(".goal-area-label").forEach(label => label.remove());
    if (!goalBox) return;
    this.ensureGoalZoneLegend(goalBox);

    const selectedGoalie = this.selectedGoalie || "";

    const goalImg = goalBox.querySelector("img");
    if (!goalImg) return;
    if (!goalImg.complete || !goalImg.naturalWidth || !goalImg.naturalHeight) {
      if (this.pendingGoalAreaImage !== goalImg) {
        this.pendingGoalAreaImage = goalImg;
        goalImg.addEventListener("load", () => {
          if (this.pendingGoalAreaImage === goalImg) {
            this.pendingGoalAreaImage = null;
          }
          this.renderGoalAreaStats();
        }, { once: true });
      }
      return;
    }
    this.pendingGoalAreaImage = null;

    const { byZone, totalGoals, totalGoalMarkers } = this.getGoalZoneDisplayStats(selectedGoalie);
    if (totalGoals !== totalGoalMarkers) {
      console.debug("[SeasonMap] goal-zone-goal-sum-check", {
        selectedGoalie,
        zoneGoalSum: totalGoals,
        totalGoalMarkers
      });
    }
    this.GOAL_ZONE_LABELS.forEach(zone => {
      const zoneStats = byZone[zone.key] || {};
      const position = App.markerHandler?.getContainerPercentFromImagePercent?.(
        goalBox,
        goalImg,
        zone.anchorX,
        zone.anchorY
      );
      if (!position?.valid) return;
      const label = this.createGoalAreaBadge(zoneStats);
      label.style.left = `${position.xPct}%`;
      label.style.top = `${position.yPct}%`;
      goalBox.appendChild(label);
    });
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

    const selectedGoalie = this.selectedGoalie || this.getActiveGoalieName() || 'goalie';
    const comparisonLabel = (this.comparisonGoalies || []).length ? this.comparisonGoalies.join(', ') : 'None';
    const date = App.helpers.getCurrentDateString();

    this.renderHeatmap();
    this.renderGoalAreaStats();

    const EXPORT_WIDTH = 1200;
    const PADDING = 16;
    const COL_GAP = 20;
    const INNER_WIDTH = EXPORT_WIDTH - (PADDING * 2);
    const fieldWidth = Math.round(INNER_WIDTH * 0.62);
    const goalWidth = INNER_WIDTH - COL_GAP - fieldWidth;

    const fieldBox = document.getElementById('seasonFieldBox');
    const goalBox = document.getElementById('seasonGoalRedBox');
    const momentum = document.getElementById('seasonMapMomentumContainer');
    if (!fieldBox || !goalBox) {
      alert('Season Map export failed: required elements are missing.');
      return Promise.resolve(false);
    }

    const fieldImgEl = fieldBox.querySelector('img');
    const goalImgEl = goalBox.querySelector('img');
    const fieldImgSrc = fieldImgEl?.getAttribute('src') || 'Spielfeld Overlay.png';
    const goalImgSrc = goalImgEl?.getAttribute('src') || 'Tor Rot.png';
    const crop = this.getDefaultCropRect(fieldBox);
    const fieldNaturalWidth = Number(fieldImgEl?.naturalWidth || 0) || 1;
    const fieldNaturalHeight = Number(fieldImgEl?.naturalHeight || 0) || 1;
    const cropWidthRatio = Math.max(0.0001, crop.width / 100);
    const cropHeightRatio = Math.max(0.0001, crop.height / 100);
    const fieldAspect = (cropHeightRatio / cropWidthRatio) * (fieldNaturalHeight / fieldNaturalWidth);
    const fieldHeight = Math.max(1, Math.round(fieldWidth * fieldAspect));
    const goalHeight = Math.round(goalWidth * 0.62);

    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = `position:absolute;left:-9999px;top:0;width:${EXPORT_WIDTH}px;background:#ffffff;padding:${PADDING}px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;`;

    const header = document.createElement('div');
    header.style.cssText = 'display:block;width:100%;box-sizing:border-box;padding:14px 16px;margin-bottom:16px;text-align:center;font-size:20px;font-weight:700;color:#000;background:#fff;border-bottom:2px solid #333;line-height:1.35;';
    header.textContent = `Goalie: ${selectedGoalie} | Compare: ${comparisonLabel} | Date: ${date}`;
    exportContainer.appendChild(header);

    const row = document.createElement('div');
    row.style.cssText = `display:flex;flex-direction:row;align-items:flex-start;gap:${COL_GAP}px;width:100%;box-sizing:border-box;margin-bottom:16px;`;

    const fieldColumn = document.createElement('div');
    fieldColumn.style.cssText = `flex:0 0 ${fieldWidth}px;width:${fieldWidth}px;height:${fieldHeight}px;position:relative;overflow:hidden;border-radius:10px;background:#ffffff;`;
    const fieldCropBox = document.createElement('div');
    fieldCropBox.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;border-radius:8px;';
    const fieldImg = document.createElement('img');
    fieldImg.src = fieldImgSrc;
    fieldImg.alt = 'Season field';
    fieldImg.style.cssText = `position:absolute;pointer-events:none;max-width:none;max-height:none;
      width:${(100 / cropWidthRatio).toFixed(6)}%;
      height:${(100 / cropHeightRatio).toFixed(6)}%;
      left:${(-100 * crop.left / crop.width).toFixed(6)}%;
      top:${(-100 * crop.top / crop.height).toFixed(6)}%;`;
    fieldCropBox.appendChild(fieldImg);
    fieldColumn.appendChild(fieldCropBox);

    const exportGoalMarkers = [];
    const exportSaveMarkers = [];
    const exportMarkerElements = [];
    fieldBox.querySelectorAll('.marker-dot').forEach((dot) => {
      const xPctImage = parseFloat(dot.dataset.xPctImage);
      const yPctImage = parseFloat(dot.dataset.yPctImage);
      if (!Number.isFinite(xPctImage) || !Number.isFinite(yPctImage)) return;
      const position = App.markerHandler?.getContainerPercentFromImagePercent?.(
        fieldBox,
        fieldImgEl,
        xPctImage,
        yPctImage
      );
      if (!position?.valid) return;
      const marker = { x: position.xPct, y: position.yPct };
      if ((dot.dataset.markerType || '').toLowerCase() === 'goal') {
        exportGoalMarkers.push(marker);
      } else {
        exportSaveMarkers.push(marker);
      }

      const markerEl = document.createElement('div');
      markerEl.className = 'marker-dot';
      markerEl.style.left = `${position.xPct}%`;
      markerEl.style.top = `${position.yPct}%`;
      markerEl.style.width = '10px';
      markerEl.style.height = '10px';
      markerEl.style.backgroundColor = dot.style.backgroundColor || '#808080';
      markerEl.style.pointerEvents = 'none';
      exportMarkerElements.push(markerEl);
    });

    if (exportGoalMarkers.length || exportSaveMarkers.length) {
      const exportHeatmapCanvas = document.createElement('canvas');
      exportHeatmapCanvas.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;';
      this.drawHeatmapToCanvas(
        exportHeatmapCanvas,
        { goalMarkers: exportGoalMarkers, saveMarkers: exportSaveMarkers },
        fieldWidth,
        fieldHeight,
        2
      );
      fieldColumn.appendChild(exportHeatmapCanvas);
    }
    exportMarkerElements.forEach(markerEl => fieldColumn.appendChild(markerEl));

    const goalColumn = document.createElement('div');
    goalColumn.style.cssText = `flex:0 0 ${goalWidth}px;width:${goalWidth}px;display:flex;flex-direction:column;box-sizing:border-box;`;
    const goalExportBox = document.createElement('div');
    goalExportBox.className = 'season-goal-export-box';
    goalExportBox.style.cssText = `width:${goalWidth}px;height:${goalHeight}px;position:relative;overflow:hidden;border-radius:10px;background:#fff;`;
    const goalImg = document.createElement('img');
    goalImg.src = goalImgSrc;
    goalImg.alt = 'Season goal';
    goalImg.style.cssText = 'display:block;width:100%;height:100%;border-radius:8px;';
    goalExportBox.appendChild(goalImg);
    const { byZone } = this.getGoalZoneDisplayStats(selectedGoalie);
    this.GOAL_ZONE_LABELS.forEach((zone) => {
      const zoneStats = byZone[zone.key] || {};
      const position = App.markerHandler?.getContainerPercentFromImagePercent?.(
        goalBox,
        goalImgEl,
        zone.anchorX,
        zone.anchorY
      );
      if (!position?.valid) return;

      const label = this.createGoalAreaBadge(zoneStats);
      label.style.left = `${position.xPct}%`;
      label.style.top = `${position.yPct}%`;
      goalExportBox.appendChild(label);
    });
    goalBox.querySelectorAll('.marker-dot').forEach((dot) => {
      const xPctImage = parseFloat(dot.dataset.xPctImage);
      const yPctImage = parseFloat(dot.dataset.yPctImage);
      if (!Number.isFinite(xPctImage) || !Number.isFinite(yPctImage)) return;
      const position = App.markerHandler?.getContainerPercentFromImagePercent?.(
        goalBox,
        goalImgEl,
        xPctImage,
        yPctImage
      );
      if (!position?.valid) return;
      const markerEl = document.createElement('div');
      markerEl.className = 'marker-dot';
      markerEl.style.left = `${position.xPct}%`;
      markerEl.style.top = `${position.yPct}%`;
      markerEl.style.width = '10px';
      markerEl.style.height = '10px';
      markerEl.style.backgroundColor = dot.style.backgroundColor || '#808080';
      markerEl.style.pointerEvents = 'none';
      goalExportBox.appendChild(markerEl);
    });
    goalColumn.appendChild(goalExportBox);
    const exportLegend = this.createGoalZoneLegend();
    goalColumn.appendChild(exportLegend);

    row.appendChild(fieldColumn);
    row.appendChild(goalColumn);
    exportContainer.appendChild(row);

    if (momentum) {
      const momentumClone = momentum.cloneNode(true);
      momentumClone.style.cssText = 'display:block;width:100%;box-sizing:border-box;margin-top:8px;padding:2px 6px 6px 6px;background:transparent;';
      const svg = momentumClone.querySelector('svg');
      if (svg) {
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.style.display = 'block';
      }
      exportContainer.appendChild(momentumClone);
    }

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
          const filename = `season_map_${date}_${App.helpers.sanitizeFilename(selectedGoalie || 'goalie')}.pdf`;
          doc.save(filename);
          resolve(true);
        }).catch((error) => {
          cleanup();
          console.error('Season map PDF export failed:', error);
          alert('Season map PDF export failed. Please try again.');
          resolve(false);
        });
      });
    });
  },

  exportAll() {
    return this.exportAsPDF().then((success) => {
      if (success === false) return false;
      setTimeout(() => {
        if (App.seasonTable?.exportSeasonWorkbook) {
          App.seasonTable.exportSeasonWorkbook();
          return;
        }
        App.seasonTable?.exportCSV?.();
      }, 600);
      return true;
    });
  },

  reset(options = {}) {
    const { allGoalies = false } = options;
    const teamId = App.helpers.getCurrentTeamId();
    const activeGoalieName = this.getActiveGoalieName() || App.helpers.getStoredActiveGoalieName() || "";
    const normalizedActive = this.normalizeGoalieName(activeGoalieName);

    if (!allGoalies && !normalizedActive) {
      alert("Please select an active goalie first.");
      return;
    }

    if (allGoalies) {
      if (!confirm("Reset data for ALL goalies?")) return;
      AppStorage.removeItem(`seasonMapMarkers_${teamId}`);
      AppStorage.removeItem(`seasonMapTimeData_${teamId}`);
      AppStorage.removeItem(`seasonMapTimeDataWithPlayers_${teamId}`);
      App.goalMap?.clearSeasonMapExportHashes?.();
      this.render();
      return;
    }

    if (!confirm(`Reset Season Map data for ${activeGoalieName}?`)) return;

    const seasonMarkers = this.getSeasonMarkers();
    const scopedMarkers = [
      (seasonMarkers[0] || []).filter(marker => {
        const markerGoalie = this.normalizeGoalieName(marker?.player || "");
        if (!markerGoalie) return true;
        return markerGoalie !== normalizedActive;
      }),
      (seasonMarkers[1] || []).filter(marker => {
        const markerGoalie = this.normalizeGoalieName(marker?.player || "");
        if (!markerGoalie) return true;
        return markerGoalie !== normalizedActive;
      })
    ];

    const seasonTimeData = this.getSeasonTimeData();
    Object.entries(seasonTimeData).forEach(([key, goalieCounts]) => {
      if (!goalieCounts || typeof goalieCounts !== "object") {
        delete seasonTimeData[key];
        return;
      }
      Object.keys(goalieCounts).forEach((goalieName) => {
        if (this.normalizeGoalieName(goalieName) !== normalizedActive) return;
        delete goalieCounts[goalieName];
      });
      if (Object.keys(goalieCounts).length === 0) delete seasonTimeData[key];
    });

    const flattened = {};
    Object.entries(seasonTimeData).forEach(([key, goalieCounts]) => {
      flattened[key] = Object.values(goalieCounts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    });

    if ((scopedMarkers[0]?.length || 0) > 0 || (scopedMarkers[1]?.length || 0) > 0) {
      AppStorage.setItem(`seasonMapMarkers_${teamId}`, JSON.stringify(scopedMarkers));
    } else {
      AppStorage.removeItem(`seasonMapMarkers_${teamId}`);
    }

    if (Object.keys(seasonTimeData).length > 0) {
      AppStorage.setItem(`seasonMapTimeDataWithPlayers_${teamId}`, JSON.stringify(seasonTimeData));
    } else {
      AppStorage.removeItem(`seasonMapTimeDataWithPlayers_${teamId}`);
    }

    if (Object.keys(flattened).length > 0) {
      AppStorage.setItem(`seasonMapTimeData_${teamId}`, JSON.stringify(flattened));
    } else {
      AppStorage.removeItem(`seasonMapTimeData_${teamId}`);
    }
    App.goalMap?.clearSeasonMapExportHashes?.(activeGoalieName);
    this.render();
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
