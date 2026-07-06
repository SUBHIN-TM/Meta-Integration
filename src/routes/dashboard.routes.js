/*
|==============================================================================
| dashboard.routes.js  —  THE ADDRESSES FOR THE LIVE DASHBOARD
|==============================================================================
| Our own monitoring UI (Meta never calls these).
|
|   GET  /meta-notifications        ->  showDashboard()  (the web page)
|   GET  /meta-notifications/data   ->  getData()        (JSON feed, polled)
|   POST /meta-notifications/clear  ->  clearData()      (Clear button)
|==============================================================================
*/

const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");

router.get("/meta-notifications", dashboardController.showDashboard);
router.get("/meta-notifications/data", dashboardController.getData);
router.post("/meta-notifications/clear", dashboardController.clearData);

module.exports = router;
