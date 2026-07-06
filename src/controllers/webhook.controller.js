/*
|==============================================================================
| webhook.controller.js  —  WHAT TO DO WHEN META CALLS US
|==============================================================================
| WHAT THIS FILE IS:
|   The "brain" for the /webhook endpoint. Meta calls /webhook; this file
|   decides what happens.
|
| TWO JOBS (two functions):
|   1) verifyWebhook()  -> the ONE-TIME handshake when you register the URL
|                          in Meta (checks the secret verify token).
|   2) receiveWebhook() -> runs EVERY time an event happens (message, status).
|                          It records the event for the dashboard and, if a
|                          user texted us, sends a friendly auto-reply.
|==============================================================================
*/

const config = require("../config");
const eventStore = require("../services/eventStore.service");
const whatsapp = require("../services/whatsapp.service");

// 1) VERIFICATION HANDSHAKE  (Meta calls this once, with GET)
function verifyWebhook(req, res) {
  console.log("WebHook GET for VERIFICATION");
  console.log("QUERY:", req.query);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Only pass if the mode is right AND the token matches our secret
  if (mode === "subscribe" && token === config.verifyToken) {
    console.log("Webhook verified successfully ✅");
    return res.status(200).send(challenge); // echo the challenge back to Meta
  }

  console.log("Verification failed ❌");
  return res.sendStatus(403);
}

// 2) RECEIVE AN EVENT  (Meta calls this every time, with POST)
async function receiveWebhook(req, res) {
  try {
    console.log("Incoming webhook:", JSON.stringify(req.body, null, 2));

    // Save a decoded copy so the dashboard can show it
    eventStore.recordWebhook(req.body);

    // Pull out the first message (if this webhook was a user message)
    const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // If it was only a status update (sent/delivered/read), there is no
    // message to reply to — just acknowledge and stop.
    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message?.text?.body || "Message received";

    console.log("FROM:", from);
    console.log("TEXT:", text);

    // Auto-reply to the user (free text — allowed inside the 24h window)
    await whatsapp.replyMessage(
      from,
      `We received your message: "${text}"

Thank you for contacting us.
Our team will get back to you soon.`,
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error(error?.response?.data || error);
    return res.sendStatus(500);
  }
}

module.exports = { verifyWebhook, receiveWebhook };
