App.statsTable = {
  container: null,

  init() {
    this.container = document.getElementById("statsContainer");
    const exportBtn = document.getElementById("exportBtn");
    exportBtn?.addEventListener("click", () => {
      if (App.helpers?.showDownloadChoiceDialog) {
        App.helpers.showDownloadChoiceDialog({
          onPdf: () => App.goalMap?.exportAsPDF?.(),
          onExcel: () => {
            if (App.goalMap?.exportWorkbook) return App.goalMap.exportWorkbook();
            return App.csvHandler?.exportGoalieGameStats?.();
          }
        });
        return;
      }
      App.goalMap?.exportAll?.();
    });

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn && App.helpers?.bindLongPressAction) {
      App.helpers.bindLongPressAction(resetBtn, {
        longPressMs: 800,
        onClick: () => App.goalMap?.reset?.({ allGoalies: false }),
        onLongPress: () => App.goalMap?.reset?.({ allGoalies: true })
      });
      return;
    }
    resetBtn?.addEventListener("click", () => App.goalMap?.reset?.({ allGoalies: false }));
  },

  getRows() {
    const activeGoalie = App.goalMap?.getActiveGoalie?.();
    const selectedGoalies = activeGoalie ? [activeGoalie] : [];
    const fieldMarkers = App.goalMap?.getCurrentMarkersFromDOM?.()?.[0] || [];
    const counts = new Map();

    fieldMarkers.forEach(marker => {
      if (!marker.player) return;
      if (!counts.has(marker.player)) counts.set(marker.player, { shots: 0, saves: 0, goals: 0 });
      const entry = counts.get(marker.player);
      entry.shots += 1;
      if (App.goalMap?.isGoalMarker?.(marker)) {
        entry.goals += 1;
      } else {
        entry.saves += 1;
      }
    });

    return selectedGoalies.map(goalie => {
      const totals = counts.get(goalie.name) || { shots: 0, saves: 0, goals: 0 };
      const goals = totals.goals;
      const saves = totals.saves;
      const shots = totals.shots;
      const savePct = shots ? `${((saves / shots) * 100).toFixed(1)}%` : "0.0%";

      return {
        num: goalie.num || "",
        name: goalie.name,
        shots,
        saves,
        goals,
        savePct
      };
    });
  },

  render() {
    if (!this.container) return;

    const rows = this.getRows();
    if (rows.length === 0) {
      this.container.innerHTML = `<div class="empty-state-card">Select one active goalie on the Goalie Selection page.</div>`;
      return;
    }

    const table = document.createElement("table");
    table.className = "stats-table goalie-stats-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>#</th>
          <th>Goalie</th>
          <th>Shots</th>
          <th>Saves</th>
          <th>Goals</th>
          <th>Save %</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row, index) => `
          <tr class="${index % 2 === 0 ? 'even-row' : 'odd-row'}">
            <td><strong>${App.helpers.escapeHtml(row.num || "-")}</strong></td>
            <td style="text-align:left;padding-left:12px;"><strong>${App.helpers.escapeHtml(row.name)}</strong></td>
            <td>${row.shots}</td>
            <td>${row.saves}</td>
            <td>${row.goals}</td>
            <td>${row.savePct}</td>
          </tr>
        `).join("")}
      </tbody>
    `;

    this.container.innerHTML = "";
    this.container.appendChild(table);
  },

  updateTotals() {
    this.render();
  }
};
