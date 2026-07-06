/*
|==============================================================================
| message.controller.js  —  WHEN WE DECIDE TO SEND A MESSAGE
|==============================================================================
| WHAT THIS FILE IS:
|   The "brain" for the endpoints where OUR app sends a message to a user.
|   (Different from the webhook: here WE start the action, not Meta.)
|
| TWO ENDPOINTS:
|   1) sendManual()  -> POST /send          (used by the dashboard reply popup)
|   2) sendEcho()    -> POST /send-message  (a demo "you said: ..." echo route)
|==============================================================================
*/

const eventStore = require("../services/eventStore.service");
const whatsapp = require("../services/whatsapp.service");

// 1) MANUAL SEND — the dashboard popup POSTs { to, text } here
async function sendManual(req, res) {
  const { to, text } = req.body || {};

  // Basic validation so we don't call Meta with missing data
  if (!to || !text) {
    return res.status(400).json({ ok: false, error: "Both 'to' and 'text' are required." });
  }

  try {
    const data = await whatsapp.sendTextMessage(to, text); // throws on failure
    const wamid = data?.messages?.[0]?.id;

    // Show it instantly in the dashboard as an outgoing (right-side) bubble
    eventStore.pushEvent({
      kind: "manual-out",
      direction: "out",
      dirLabel: "SERVER → USER",
      title: "📤 You sent (manual)",
      who: `to  ${to}`,
      detail: text,
      id: wamid,
    });

    return res.json({ ok: true, id: wamid });
  } catch (error) {
    // Surface Meta's real reason (e.g. outside 24h window) back to the popup
    const err = error?.response?.data?.error?.message || error?.response?.data || String(error);
    console.error("Manual send error:", err);
    return res.status(500).json({ ok: false, error: err });
  }
}

// 2) ECHO DEMO — POST /send-message
//    Expects a Meta-shaped body and echoes the text back with a template.
async function sendEcho(req, res) {
  try {
    const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message?.text?.body || "Message received";

    console.log("FROM:", from, "TEXT: ", text);

    await whatsapp.sendTemplateMessage(from); // sends the hello_world template

    return res.sendStatus(200);
  } catch (error) {
    console.error(error?.response?.data || error);
    return res.sendStatus(500);
  }
}

module.exports = { sendManual, sendEcho };
