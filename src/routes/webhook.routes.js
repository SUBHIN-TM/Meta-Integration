/*
|==============================================================================
| webhook.routes.js  —  THE ADDRESS "/webhook" (Meta calls this)
|==============================================================================
| This is our WEBHOOK — the URL we give Meta so Meta can call US.
|
|   GET  /webhook  ->  verifyWebhook()   (one-time setup handshake)
|   POST /webhook  ->  receiveWebhook()  (every real event: message/status)
|
| The actual logic lives in the controller; this file only maps the URL to it.
|==============================================================================
*/

const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhook.controller");

router.get("/webhook", webhookController.verifyWebhook);
router.post("/webhook", webhookController.receiveWebhook);

module.exports = router;
