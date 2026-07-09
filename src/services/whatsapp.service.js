/*
|==============================================================================
| whatsapp.service.js  —  THE "SEND" WORKER (talks TO Meta)
|==============================================================================
| WHAT THIS FILE IS:
|   Every OUTGOING call to Meta lives here. When our app wants to SEND a
|   WhatsApp message, it asks this file to do it.
|
| REMEMBER THE DIRECTION:
|   - Webhook  = Meta calls US   (we receive)      -> handled elsewhere
|   - Service  = WE call Meta     (we send)         -> THIS FILE
|
| TWO NUMBERS:
|   Because we now run two numbers (test + production), this file exports a
|   FACTORY: createSender(account) builds the 3 send-functions bound to ONE
|   account's token + phone number id. We then pre-build one sender per account
|   (whatsapp.test and whatsapp.production) so callers just pick the right one.
|
| WHAT EACH SENDER OFFERS (3 ways to send):
|   1) sendTemplateMessage() -> sends an approved template (e.g. "hello_world")
|   2) replyMessage()        -> sends free text, hides errors (safe auto-reply)
|   3) sendTextMessage()     -> sends free text, THROWS on error (so the
|                               dashboard popup can show Meta's real reason)
|==============================================================================
*/

const axios = require("axios");
const config = require("../config");

/*
| createSender(account)
|   Builds a set of send-functions locked to ONE account. Everything below
|   (the URL, the auth header) uses THIS account's phone number id + token,
|   so the test sender and the production sender never mix credentials.
*/
function createSender(account) {
  // Build the Meta "send message" URL for THIS account's phone number.
  function messagesUrl() {
    return `https://graph.facebook.com/${config.graphApiVersion}/${account.phoneNumberId}/messages`;
  }

  // The auth headers Meta requires, using THIS account's access token.
  function authHeaders() {
    return {
      Authorization: `Bearer ${account.whatsappAccessToken}`,
      "Content-Type": "application/json",
    };
  }

  /*
  | 1) TEMPLATE MESSAGE
  |    Used when WE start the conversation (outside the 24h window), which Meta
  |    only allows with a pre-approved template.
  */
  async function sendTemplateMessage(to, templateName = "hello_world") {
    try {
      await axios.post(
        messagesUrl(),
        {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: { name: templateName, language: { code: "en_US" } },
        },
        { headers: authHeaders() },
      );
      console.log(`[${account.label}] Template message sent successfully ✅`);
    } catch (error) {
      console.error(`[${account.label}] Send Error:`, error?.response?.data || error);
    }
  }

  /*
  | 2) AUTO-REPLY (free text)
  |    Used by the webhook to auto-answer a user. It SWALLOWS errors on purpose,
  |    so a failed reply never crashes the webhook handler.
  |    (Free text only works inside the 24h customer-service window.)
  */
  async function replyMessage(to, text) {
    try {
      await axios.post(
        messagesUrl(),
        { messaging_product: "whatsapp", to, text: { body: text } },
        { headers: authHeaders() },
      );
      console.log(`[${account.label}] Reply sent successfully ✅`);
    } catch (error) {
      console.error(`[${account.label}] Reply Error:`, error?.response?.data || error);
    }
  }

  /*
  | 3) MANUAL SEND (free text)
  |    Used by the dashboard "reply" popup. Unlike replyMessage, this one
  |    THROWS if Meta rejects it, so the popup can show the exact error
  |    (e.g. "outside 24h window" or "Authentication Error").
  |    Returns Meta's response data (which contains the message id) on success.
  */
  async function sendTextMessage(to, text) {
    const result = await axios.post(
      messagesUrl(),
      { messaging_product: "whatsapp", to, text: { body: text } },
      { headers: authHeaders() },
    );
    return result.data;
  }

  return { sendTemplateMessage, replyMessage, sendTextMessage };
}

// Pre-build one sender per account so callers just import and use them:
//   whatsapp.test        -> sends from the Meta test number
//   whatsapp.production   -> sends from the Interval Connect number
module.exports = {
  createSender,
  test: createSender(config.accounts.test),
  production: createSender(config.accounts.production),
};
