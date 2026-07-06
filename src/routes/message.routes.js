/*
|==============================================================================
| message.routes.js  —  THE ADDRESSES WHERE *WE* SEND MESSAGES
|==============================================================================
| These are the endpoints our own app/dashboard call to send a WhatsApp msg.
|
|   POST /send          ->  sendManual()  (dashboard reply popup)
|   POST /send-message  ->  sendEcho()    (demo echo route)
|==============================================================================
*/

const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");

router.post("/send", messageController.sendManual);
router.post("/send-message", messageController.sendEcho);

module.exports = router;
