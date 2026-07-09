/*
|==============================================================================
| webhook.routes.js  —  THE WEBHOOK ADDRESSES (Meta calls these)
|==============================================================================
| These are our WEBHOOKS — the URLs we give Meta so Meta can call US.
| We now have TWO numbers, so TWO webhook paths (same server, same port):
|
|   TEST number (Meta sandbox):
|     GET  /webhook           ->  verify handshake
|     POST /webhook           ->  every real event (message/status)
|
|   PRODUCTION number (Interval Connect):
|     GET  /webhook-interval  ->  verify handshake
|     POST /webhook-interval  ->  every real event (message/status)
|
| Each path is wired to a controller built for THAT account, so the right
| verify token is checked and the auto-reply goes out from the right number.
|==============================================================================
*/

const express = require("express");
const router = express.Router();

const { createWebhookController } = require("../controllers/webhook.controller");
const whatsapp = require("../services/whatsapp.service");
const config = require("../config");

// TEST number → /webhook  (original — unchanged behaviour)
const testWebhook = createWebhookController(config.accounts.test, whatsapp.test);
router.get(config.accounts.test.webhookPath, testWebhook.verifyWebhook);
router.post(config.accounts.test.webhookPath, testWebhook.receiveWebhook);

// PRODUCTION number (Interval Connect) → /webhook-interval
const intervalWebhook = createWebhookController(config.accounts.production, whatsapp.production);
router.get(config.accounts.production.webhookPath, intervalWebhook.verifyWebhook);
router.post(config.accounts.production.webhookPath, intervalWebhook.receiveWebhook);

module.exports = router;
