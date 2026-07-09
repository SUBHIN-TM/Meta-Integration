/*
|==============================================================================
| config.js  —  ALL SETTINGS IN ONE PLACE
|==============================================================================
| WHAT THIS FILE IS:
|   The single spot where we read values from the .env file. Nothing else in
|   the project reads process.env directly — everyone imports from here.
|
| WHY IT EXISTS:
|   So that when a value changes (a token, the port, the Meta API version),
|   we change it in ONE place, and the whole app picks it up.
|
| TWO WHATSAPP NUMBERS NOW:
|   We run TWO numbers side by side, each with its OWN credentials and its OWN
|   webhook path — but BOTH inside the SAME server on the SAME port:
|     - "test"       -> the original Meta sandbox test number  (/webhook)
|     - "production"  -> the real Interval Connect number       (/webhook-interval)
|   The production values come from the "_2" variables in .env.
|==============================================================================
*/

require("dotenv").config(); // loads the .env file into process.env

const config = {
  // The port our server listens on (from .env, e.g. 3005). ONE port for BOTH
  // numbers — they are told apart by their webhook path, not by the port.
  port: process.env.PORT,

  // Meta Graph API version we call. Kept here so upgrades are a one-line change.
  graphApiVersion: "v25.0",

  // Each account is fully self-contained: its verify token, its access token,
  // its phone number id, and the webhook path Meta should call for it.
  accounts: {
    // ORIGINAL Meta test number — unchanged, still on /webhook
    test: {
      label: "test",
      webhookPath: "/webhook",
      verifyToken: process.env.VERIFY_TOKEN,
      whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: process.env.PHONE_NUMBER_ID,
    },

    // NEW production number (Interval Connect app) — reads the "_2" values
    production: {
      label: "interval",
      webhookPath: "/webhook-interval",
      verifyToken: process.env.VERIFY_TOKEN_2,
      whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN_2,
      phoneNumberId: process.env.PHONE_NUMBER_ID_2,
    },
  },
};

module.exports = config;
