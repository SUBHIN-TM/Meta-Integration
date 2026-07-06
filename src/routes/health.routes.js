/*
|==============================================================================
| health.routes.js  —  "IS THE SERVER ALIVE?" CHECK
|==============================================================================
| A tiny endpoint used to confirm the server is up.
|   GET /health  ->  "Server running successfully.."
| Handy for quick tests and for uptime monitors later.
|==============================================================================
*/

const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  console.log("HEALTH CHECK");
  res.send("Server running successfully..");
});

module.exports = router;
