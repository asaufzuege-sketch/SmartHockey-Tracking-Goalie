App.statsTable = {
  container: null,

  init() {
    this.container = document.getElementById("statsContainer");
    document.getElementById("exportBtn")?.addEventListener("click", () => {
      if (App.csvHandler?.exportGoalieGameStats) App.csvHandler.exportGoalieGameStats();
    });
    document.getElementById("resetBtn")?.addEventListener("click", () => {
      App.goalMap?.reset?.();
    });
  },

  getRows() {
    const selectedGoalies = Array.isArray(App.data.selectedPlayers) ? App.data.selectedPlayers : [];
    const goalMapData = App.data.goalMapData || {};

    return selectedGoalies.map(goalie => {
      const events = Array.isArray(goalMapData[goalie.name]) ? goalMapData[goalie.name] : [];
      const goals = events.filter(event => event.eventType === "goal" && event.workflowType === "conceded").length;
      const saves = events.filter(event => event.eventType === "opponent-shot").length;
      const shots = goals + saves;
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
      this.container.innerHTML = `<div class="empty-state-card">Select at least one goalie on the Goalie Selection page.</div>`;
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
