/*
|==============================================================================
| dashboard.controller.js  —  THE BRAIN FOR THE DASHBOARD PAGE
|==============================================================================
| WHAT THIS FILE IS:
|   Handles the three dashboard endpoints. Note: Meta NEVER calls these — they
|   are for us (the humans) to watch and interact with the webhook activity.
|
| THREE ENDPOINTS:
|   1) showDashboard() -> GET  /meta-notifications        (the web page)
|   2) getData()       -> GET  /meta-notifications/data   (JSON the page polls)
|   3) clearData()     -> POST /meta-notifications/clear  (the Clear button)
|==============================================================================
*/

const eventStore = require("../services/eventStore.service");
const { renderDashboardHtml } = require("../views/dashboard.view");

// 1) Serve the HTML page
function showDashboard(req, res) {
  res.type("html").send(renderDashboardHtml());
}

// 2) Serve the current events as JSON (the page fetches this every 2s)
function getData(req, res) {
  res.json(eventStore.getEvents());
}

// 3) Wipe the list (the Clear button)
function clearData(req, res) {
  eventStore.clearEvents();
  res.json({ ok: true });
}

module.exports = { showDashboard, getData, clearData };
