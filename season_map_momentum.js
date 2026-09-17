(function () {
  const SVG_W = 900;
  const SVG_H = 150;
  const MARGIN = { left: 32, right: 32, top: 16, bottom: 44 };
  const PLOT_TOP_Y = 30;
  const PLOT_BASELINE_Y = SVG_H - MARGIN.bottom;
  const MAX_DISPLAY = 6;
  const BUCKET_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60];

  function getContainer() {
    return document.getElementById("seasonMapMomentumContainer");
  }

  function minuteToX(minute) {
    const usableW = SVG_W - MARGIN.left - MARGIN.right;
    return MARGIN.left + (Math.max(0, Math.min(60, minute)) / 60) * usableW;
  }

  function valueToY(value, maxScale) {
    const usableH = PLOT_BASELINE_Y - PLOT_TOP_Y;
    return PLOT_BASELINE_Y - ((Number(value || 0) || 0) / maxScale) * usableH;
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

  function getBucketValue(timeData, key, selectedGoalie) {
    const legacyKey = key.replace(/^p/, "sp");
    const entry = timeData?.[key] ?? timeData?.[legacyKey];
    if (entry && typeof entry === "object") {
      return selectedGoalie
        ? Number(entry[selectedGoalie] || 0)
        : Object.values(entry).reduce((sum, value) => sum + Number(value || 0), 0);
    }
    if (selectedGoalie) return 0;
    return Number(entry || 0) || 0;
  }

  function readValuesFromStorage() {
    const timeData = App.seasonMap?.getSeasonTimeData?.() || {};
    const selectedGoalie = App.seasonMap?.selectedGoalie || "";
    const values = [];
    ["p1", "p2", "p3"].forEach(period => {
      for (let index = 0; index < 4; index += 1) {
        values.push(getBucketValue(timeData, `${period}_${index}`, selectedGoalie));
      }
    });
    while (values.length < 12) values.push(0);
    return values.slice(0, 12);
  }

  function renderSeasonMomentumGraphic() {
    const container = getContainer();
    if (!container) return;

    const values = readValuesFromStorage();
    const maxScale = Math.max(MAX_DISPLAY, ...values, 1);
    const points = values.map((value, index) => ({
      x: minuteToX(BUCKET_MINUTES[index]),
      y: valueToY(value, maxScale),
      value
    }));
    const positiveRuns = [];
    let currentRun = [];
    points.forEach(point => {
      if (point.value > 0) {
        currentRun.push(point);
        return;
      }
      if (currentRun.length) positiveRuns.push(currentRun);
      currentRun = [];
    });
    if (currentRun.length) positiveRuns.push(currentRun);

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("viewBox", `0 0 ${SVG_W} ${SVG_H}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Season map momentum chart showing red period totals over game time");

    const line = (x1, y1, x2, y2, stroke, width) => {
      const el = document.createElementNS(svgNS, "line");
      el.setAttribute("x1", x1);
      el.setAttribute("y1", y1);
      el.setAttribute("x2", x2);
      el.setAttribute("y2", y2);
      el.setAttribute("stroke", stroke);
      el.setAttribute("stroke-width", width);
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

    line(minuteToX(0), PLOT_TOP_Y, minuteToX(60), PLOT_TOP_Y, "#ffffff", "2");
    line(minuteToX(0), PLOT_BASELINE_Y, minuteToX(60), PLOT_BASELINE_Y, "#d6d6d6", "2");

    const majorSet = new Set([0, 20, 40, 60]);
    for (let minute = 0; minute <= 60; minute += 5) {
      const x = minuteToX(minute);
      const isMajor = majorSet.has(minute);
      line(x, PLOT_BASELINE_Y - (isMajor ? 10 : 6), x, PLOT_BASELINE_Y + (isMajor ? 10 : 6), "#cccccc", isMajor ? "1.6" : "1");
      text(x, PLOT_BASELINE_Y + (isMajor ? 16 : 13), String(minute), isMajor ? "13" : "11", "#ffffff", isMajor ? "800" : "700");
    }

    positiveRuns.forEach(run => {
      const pathD = catmullRom2bezier(run.map(point => ({ x: point.x, y: point.y })));
      const fill = document.createElementNS(svgNS, "path");
      fill.setAttribute("d", `${pathD} L ${run[run.length - 1].x.toFixed(2)} ${PLOT_BASELINE_Y.toFixed(2)} L ${run[0].x.toFixed(2)} ${PLOT_BASELINE_Y.toFixed(2)} Z`);
      fill.setAttribute("fill", "#f07d7d");
      fill.setAttribute("stroke", "#7a7a7a");
      fill.setAttribute("stroke-width", "0.9");
      fill.setAttribute("stroke-linejoin", "round");
      svg.appendChild(fill);

      const outline = document.createElementNS(svgNS, "path");
      outline.setAttribute("d", pathD);
      outline.setAttribute("fill", "none");
      outline.setAttribute("stroke", "#c04040");
      outline.setAttribute("stroke-width", "2.2");
      outline.setAttribute("stroke-linejoin", "round");
      outline.setAttribute("stroke-linecap", "round");
      svg.appendChild(outline);
    });

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
