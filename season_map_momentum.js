(function () {
  const SVG_W = 430;
  const SVG_H = 230;
  const MARGIN = { left: 28, right: 18, top: 16, bottom: 44 };
  const TOP_GUIDE_Y = 34;
  const MIDLINE_Y = SVG_H - MARGIN.bottom;
  const MAX_DISPLAY = 6;
  const BUCKET_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60];
  const BUCKET_KEY_RE = /^(?:p|sp)[1-3]_[0-3]$/i;

  function getContainer() {
    return document.getElementById("seasonMapMomentumContainer");
  }

  function minuteToX(minute) {
    const usableW = SVG_W - MARGIN.left - MARGIN.right;
    return MARGIN.left + (Math.max(0, Math.min(60, minute)) / 60) * usableW;
  }

  function valueToYConceded(value, maxScale) {
    const topSpace = MIDLINE_Y - TOP_GUIDE_Y;
    const t = (Number(value || 0) || 0) / maxScale;
    return MIDLINE_Y - t * topSpace;
  }

  function catmullRom2bezier(points) {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    if (points.length === 2) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
    const padded = [points[0], ...points, points[points.length - 1]];
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 1; i < padded.length - 2; i++) {
      const p0 = padded[i - 1];
      const p1 = padded[i];
      const p2 = padded[i + 1];
      const p3 = padded[i + 2];
      const b1x = p1.x + (p2.x - p0.x) / 6;
      const b1y = p1.y + (p2.y - p0.y) / 6;
      const b2x = p2.x - (p3.x - p1.x) / 6;
      const b2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${b1x.toFixed(2)} ${b1y.toFixed(2)}, ${b2x.toFixed(2)} ${b2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return d;
  }

  function normalizeGoalieName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getBucketValue(timeData, key, selectedGoalie) {
    const normalizedKey = String(key || "").toLowerCase();
    const legacyKey = normalizedKey.replace(/^p/, "sp");
    const directKey = Object.keys(timeData || {}).find(storedKey => String(storedKey || "").toLowerCase() === normalizedKey);
    const directLegacyKey = Object.keys(timeData || {}).find(storedKey => String(storedKey || "").toLowerCase() === legacyKey);
    const entry = timeData?.[directKey] ?? timeData?.[directLegacyKey];
    const isGoalieBucket = entry && typeof entry === "object" && !Array.isArray(entry);
    if (isGoalieBucket) {
      if (!selectedGoalie) return 0;
      const direct = Number(entry[selectedGoalie]);
      if (Number.isFinite(direct)) return direct;
      const target = String(selectedGoalie).trim().toLowerCase();
      const alias = Object.keys(entry).find(goalie => String(goalie).trim().toLowerCase() === target);
      return Number(entry[alias] || 0);
    }
    return Number(entry || 0) || 0;
  }

  function readValuesFromStorage() {
    const app = typeof App !== "undefined" ? App : globalThis.App;
    const timeData = app?.seasonMap?.getSeasonTimeData?.() || {};
    const selectedGoalie = app?.seasonMap?.selectedGoalie || "";
    const values = [];
    ["p1", "p2", "p3"].forEach(period => {
      for (let index = 0; index < 4; index += 1) {
        values.push(getBucketValue(timeData, `${period}_${index}`, selectedGoalie));
      }
    });
    while (values.length < 12) values.push(0);
    const recognizedKeys = Object.keys(timeData || {}).filter(key => BUCKET_KEY_RE.test(String(key || "").trim()));
    const hasAnyBucketData = recognizedKeys.some(key => {
      const entry = timeData?.[key];
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        return Object.values(entry).some(value => Number(value || 0) > 0);
      }
      return Number(entry || 0) > 0;
    });
    return { values: values.slice(0, 12), recognizedKeys, hasAnyBucketData, selectedGoalie };
  }

  function renderSeasonMomentumGraphic() {
    const container = getContainer();
    if (!container) return;

    const { values, hasAnyBucketData, selectedGoalie } = readValuesFromStorage();
    const hasVisibleValues = values.some(value => Number(value || 0) > 0);
    if (!String(selectedGoalie || "").trim() || (!hasAnyBucketData && !hasVisibleValues)) {
      container.innerHTML = '<div class="momentum-empty-state">No momentum data yet</div>';
      return;
    }

    const maxScale = Math.max(MAX_DISPLAY, ...values, 1);
    const points = values.map((value, index) => ({
      x: minuteToX(BUCKET_MINUTES[index]),
      y: valueToYConceded(value, maxScale),
      value
    }));
    const pathD = catmullRom2bezier(points.map(point => ({ x: point.x, y: point.y })));
    const closedAreaD = `${pathD} L ${points[points.length - 1].x.toFixed(2)} ${MIDLINE_Y.toFixed(2)} L ${points[0].x.toFixed(2)} ${MIDLINE_Y.toFixed(2)} Z`;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("viewBox", `0 0 ${SVG_W} ${SVG_H}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Season map momentum chart showing conceded goals over game time");

    const line = (x1, y1, x2, y2, stroke, width) => {
      const el = document.createElementNS(svgNS, "line");
      el.setAttribute("x1", x1);
      el.setAttribute("y1", y1);
      el.setAttribute("x2", x2);
      el.setAttribute("y2", y2);
      el.setAttribute("stroke", stroke);
      el.setAttribute("stroke-width", width);
      el.setAttribute("stroke-linecap", "round");
      svg.appendChild(el);
    };

    const text = (x, y, value, size, fill, weight) => {
      const el = document.createElementNS(svgNS, "text");
      el.setAttribute("x", x);
      el.setAttribute("y", y);
      el.setAttribute("text-anchor", "middle");
      el.setAttribute("font-size", size);
      el.setAttribute("fill", fill);
      el.setAttribute("font-weight", weight);
      el.textContent = value;
      svg.appendChild(el);
    };

    line(minuteToX(0), TOP_GUIDE_Y, minuteToX(60), TOP_GUIDE_Y, "#ffffff", "1");
    line(minuteToX(0), MIDLINE_Y, minuteToX(60), MIDLINE_Y, "#7a7a7a", "3");

    const majorSet = new Set([0, 20, 40, 60]);
    for (let minute = 0; minute <= 60; minute += 5) {
      const x = minuteToX(minute);
      const isMajor = majorSet.has(minute);
      line(x, MIDLINE_Y, x, MIDLINE_Y + (isMajor ? 13 : 8), "#cccccc", isMajor ? "1.6" : "1");
      text(x, MIDLINE_Y + (isMajor ? 23 : 18), String(minute), isMajor ? "13" : "11", "#ffffff", isMajor ? "800" : "700");
    }

    if (values.some(value => Number(value || 0) > 0)) {
      const area = document.createElementNS(svgNS, "path");
      area.setAttribute("d", closedAreaD);
      area.setAttribute("fill", "#f07d7d");
      area.setAttribute("stroke", "#7a7a7a");
      area.setAttribute("stroke-width", "0.9");
      area.setAttribute("stroke-linejoin", "round");
      svg.appendChild(area);

      const outline = document.createElementNS(svgNS, "path");
      outline.setAttribute("d", pathD);
      outline.setAttribute("fill", "none");
      outline.setAttribute("stroke", "#c04040");
      outline.setAttribute("stroke-width", "2.2");
      outline.setAttribute("stroke-linejoin", "round");
      outline.setAttribute("stroke-linecap", "round");
      svg.appendChild(outline);
    }

    points.forEach(point => {
      if (point.value <= 0) return;
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", point.x.toFixed(2));
      circle.setAttribute("cy", point.y.toFixed(2));
      circle.setAttribute("r", "3");
      circle.setAttribute("fill", "#c04040");
      circle.setAttribute("opacity", "0.95");
      svg.appendChild(circle);
    });

    container.innerHTML = "";
    container.appendChild(svg);
  }

  App.seasonMap = App.seasonMap || {};
  App.seasonMap.renderMomentumGraphic = function () {
    renderSeasonMomentumGraphic();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => App.seasonMap?.renderMomentumGraphic?.());
  } else {
    App.seasonMap?.renderMomentumGraphic?.();
  }
})();
