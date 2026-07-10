/*
|==============================================================================
| webhook.controller.js  —  WHAT TO DO WHEN META CALLS US
|==============================================================================
| WHAT THIS FILE IS:
|   The "brain" for a /webhook endpoint. Meta calls the webhook; this file
|   decides what happens.
|
| TWO NUMBERS:
|   Because we run two numbers (test + production), this file exports a
|   FACTORY: createWebhookController(account, sender) builds the handlers for
|   ONE account. Each account has its OWN verify token (so the handshake only
|   passes for the right number) and its OWN sender (so the auto-reply goes out
|   from the SAME number the user messaged).
|
| TWO JOBS (two functions per account):
|   1) verifyWebhook()  -> the ONE-TIME handshake when you register the URL
|                          in Meta (checks THIS account's verify token).
|   2) receiveWebhook() -> runs EVERY time an event happens (message, status).
|                          It records the event for the dashboard and, ONLY if
|                          the user's message is a "hi" greeting, auto-replies
|                          from THIS account. Any other message: no auto-reply.
|==============================================================================
*/

const eventStore = require("../services/eventStore.service");

/*
| createWebhookController(account, sender)
|   account -> the config block (label, verifyToken, ...) for ONE number
|   sender  -> the whatsapp.service sender bound to that SAME number
*/
function createWebhookController(account, sender) {
  // 1) VERIFICATION HANDSHAKE  (Meta calls this once, with GET)
  function verifyWebhook(req, res) {
    console.log(`[${account.label}] WebHook GET for VERIFICATION`);
    console.log("QUERY:", req.query);

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // Only pass if the mode is right AND the token matches THIS account's secret
    if (mode === "subscribe" && token === account.verifyToken) {
      console.log(`[${account.label}] Webhook verified successfully ✅`);
      return res.status(200).send(challenge); // echo the challenge back to Meta
    }

    console.log(`[${account.label}] Verification failed ❌`);
    return res.sendStatus(403);
  }

  // 2) RECEIVE AN EVENT  (Meta calls this every time, with POST)
  async function receiveWebhook(req, res) {
    try {
      console.log(`[${account.label}] Incoming webhook:`, JSON.stringify(req.body, null, 2));

      // Save a decoded copy so the dashboard can show it (tagged with the account)
      eventStore.recordWebhook(req.body, account.label);

      // Pull out the first message (if this webhook was a user message)
      const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      // If it was only a status update (sent/delivered/read), there is no
      // message to reply to — just acknowledge and stop.
      if (!message) {
        return res.sendStatus(200);
      }

      const from = message.from;
      const text = message?.text?.body || "";

      console.log(`[${account.label}] FROM:`, from);
      console.log(`[${account.label}] TEXT:`, text);

      // Only auto-reply to a greeting. We match the word "hi" in any casing
      // ("hi", "Hi", "HI", "oh hi there") but NOT inside other words like
      // "this" or "ship" (the \b word boundaries take care of that).
      // Any other message is recorded for the dashboard but gets no auto-reply.
      const isGreeting = /\bhi\b/i.test(text);

      if (isGreeting) {
        // Auto-reply FROM THIS SAME NUMBER (free text — inside the 24h window)
        await sender.replyMessage(from, `Received: "${text}" 👋`);
      } else {
        console.log(`[${account.label}] No "hi" greeting — skipping auto-reply.`);
      }

      return res.sendStatus(200);
    } catch (error) {
      console.error(error?.response?.data || error);
      return res.sendStatus(500);
    }
  }

  return { verifyWebhook, receiveWebhook };
}

module.exports = { createWebhookController };
