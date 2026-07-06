/*
|==============================================================================
| routes/index.js  —  THE MASTER ADDRESS BOOK
|==============================================================================
| WHAT THIS FILE IS:
|   It gathers every route file into one place and hands them to the app.
|   When we add a NEW feature later (for example an OTP module via MSG91),
|   we create otp.routes.js and add ONE line here.
|
| CURRENT ROUTES:
|   /health                 -> health check
|   /webhook                -> Meta calls us (receive messages/statuses)
|   /send, /send-message    -> we send messages
|   /meta-notifications*    -> the live dashboard
|
| FUTURE (planned):
|   /otp/*                  -> OTP via MSG91 (kept separate — see OTP notes)
|==============================================================================
*/

const express = require("express");
const router = express.Router();

const healthRoutes = require("./health.routes");
const webhookRoutes = require("./webhook.routes");
const messageRoutes = require("./message.routes");
const dashboardRoutes = require("./dashboard.routes");

router.use(healthRoutes);
router.use(webhookRoutes);
router.use(messageRoutes);
router.use(dashboardRoutes);

// When OTP is ready:
// const otpRoutes = require("./otp.routes");
// router.use(otpRoutes);

module.exports = router;
