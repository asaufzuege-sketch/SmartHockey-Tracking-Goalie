App.seasonMap = {
  selectedGoalie: "",
  comparisonGoalie: "",
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
    { key: "tr", anchorX: 75, anchorY: 22 },
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
    this.bindCompareFilter();
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
    if (this.selectedGoalie && this.selectedGoalie === this.comparisonGoalie) {
      this.comparisonGoalie = "";
    }
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

  getComparableGoalies() {
    const seasonNames = new Map(
      Object.keys(App.data.goalieSeasonData || {}).map(name => [String(name || "").trim().toLowerCase(), name])
    );
    return this.getRosterGoalies()
      .map(name => seasonNames.get(String(name || "").trim().toLowerCase()) || "")
      .filter(goalie => goalie && goalie !== this.selectedGoalie)
      .filter((goalie, index, array) => array.indexOf(goalie) === index)
      .sort((a, b) => a.localeCompare(b));
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
    const previousComparison = this.comparisonGoalie || "";
    select.innerHTML = '<option value="">+ Compare goalie</option>';

    if (!this.selectedGoalie) {
      select.disabled = true;
      this.comparisonGoalie = "";
      if (previousComparison) this.persistFilters();
      return;
    }

    const savedValue = this.resolveGoalieName(this.comparisonGoalie);
    let goalies = this.getComparableGoalies();
    if (goalies.length === 0) {
      goalies = this.getAvailableGoalies().filter(goalie => goalie !== this.selectedGoalie);
    }
    goalies.forEach(goalie => {
      const option = document.createElement("option");
      option.value = goalie;
      option.textContent = goalie;
      select.appendChild(option);
    });

    const canCompare = Boolean(this.selectedGoalie) && goalies.length > 0;
    select.disabled = !canCompare;
    const nextComparison = canCompare && goalies.includes(savedValue) ? savedValue : "";
    select.value = nextComparison;
    this.comparisonGoalie = select.value || "";
    if (this.comparisonGoalie !== previousComparison) this.persistFilters();
  },

  render() {
    this.syncSelectedGoalieToActive();
    this.updateGoalieButton();
    this.populateCompareFilter();
    this.renderFieldHeader();
    this.renderMarkers();
    this.renderGoalAreaStats();
    this.scheduleHeatmapRender();
    this.renderTimeTracking();
    this.persistFilters();
    this.renderMomentumGraphic?.();
    if (App.seasonTable) {
      App.seasonTable.externalGoalieFilter = this.selectedGoalie || "";
      App.seasonTable.externalComparisonGoalie = this.comparisonGoalie || "";
      App.seasonTable.render();
    }
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

  bindCompareFilter() {
    const select = document.getElementById("seasonMapCompareGoalie");
    if (!select || select.dataset.bound === "true") return;

    select.addEventListener("change", () => {
      if (App.seasonTable) {
        App.seasonTable.goalieSortState.key = null;
        App.seasonTable.goalieSortState.asc = true;
      }
      this.comparisonGoalie = this.resolveGoalieName(select.value || "");
      this.persistFilters();
      this.render();
      App.seasonTable?.render?.();
    });

    select.dataset.bound = "true";
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

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    this.drawHeatmapZone(ctx, saveMarkers, canvasRect.width, canvasRect.height, "rgba(68, 68, 68, 0.6)", dpr);
    this.drawHeatmapZone(ctx, goalMarkers, canvasRect.width, canvasRect.height, "rgba(255, 0, 0, 0.6)", dpr);

    const firstMarker = fieldBox.querySelector(".marker-dot");
    if (firstMarker) {
      fieldBox.insertBefore(canvas, firstMarker);
      return;
    }
    fieldBox.appendChild(canvas);
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

  renderGoalAreaStats() {
    const goalBox = document.getElementById("seasonGoalRedBox");
    goalBox?.querySelectorAll(".goal-area-label").forEach(label => label.remove());
    if (!goalBox) return;

    const selectedGoalie = String(this.selectedGoalie || "").trim().toLowerCase();
    if (!selectedGoalie) return;

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

    const zoneStats = {
      tl: { goals: 0, saves: 0 },
      tr: { goals: 0, saves: 0 },
      bl: { goals: 0, saves: 0 },
      bm: { goals: 0, saves: 0 },
      br: { goals: 0, saves: 0 }
    };

    goalBox.querySelectorAll(".marker-dot").forEach(marker => {
      if (marker.style.display === "none") return;
      if (String(marker.dataset.player || "").trim().toLowerCase() !== selectedGoalie) return;

      const markerType = this.resolveMarkerType(marker.dataset.markerType, marker.style.backgroundColor);
      const xPctImage = parseFloat(marker.dataset.xPctImage);
      const yPctImage = parseFloat(marker.dataset.yPctImage);
      if (!Number.isFinite(xPctImage) || !Number.isFinite(yPctImage)) return;

      const zoneKey = this.getGoalAreaZoneKey(xPctImage, yPctImage);
      if (!zoneKey || !zoneStats[zoneKey]) return;
      if (markerType === "goal") zoneStats[zoneKey].goals += 1;
      if (markerType === "save") zoneStats[zoneKey].saves += 1;
    });

    const totalGoals = Object.values(zoneStats).reduce((sum, stats) => sum + stats.goals, 0);
    const totalGoalMarkers = Array.from(goalBox.querySelectorAll(".marker-dot")).reduce((sum, marker) => {
      if (marker.style.display === "none") return sum;
      if (String(marker.dataset.player || "").trim().toLowerCase() !== selectedGoalie) return sum;
      return this.resolveMarkerType(marker.dataset.markerType, marker.style.backgroundColor) === "goal" ? sum + 1 : sum;
    }, 0);
    if (totalGoals !== totalGoalMarkers) {
      console.debug("[SeasonMap] goal-zone-goal-sum-check", {
        selectedGoalie,
        zoneGoalSum: totalGoals,
        totalGoalMarkers
      });
    }
    this.GOAL_ZONE_LABELS.forEach(zone => {
      const goals = zoneStats[zone.key]?.goals || 0;
      const saves = zoneStats[zone.key]?.saves || 0;
      const shots = goals + saves;
      const percent = totalGoals ? Math.round((goals / totalGoals) * 100) : 0;
      const savePercentText = shots > 0 ? `SV ${Math.round((saves / shots) * 100)}%` : "SV –";
      const position = App.markerHandler?.getContainerPercentFromImagePercent?.(
        goalBox,
        goalImg,
        zone.anchorX,
        zone.anchorY
      );
      if (!position?.valid) return;
      const label = document.createElement("div");
      label.className = "goal-area-label";
      label.setAttribute("aria-hidden", "true");
      label.style.left = `${position.xPct}%`;
      label.style.top = `${position.yPct}%`;
      const line1 = document.createElement("span");
      line1.className = "goal-area-label-line goal-area-label-line-primary";
      line1.textContent = `${goals} · ${percent}%`;
      const line2 = document.createElement("span");
      line2.className = "goal-area-label-line goal-area-label-line-secondary";
      line2.textContent = savePercentText;
      label.appendChild(line1);
      label.appendChild(line2);
      goalBox.appendChild(label);
    });
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
