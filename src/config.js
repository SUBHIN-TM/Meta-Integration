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
| WHO USES IT:
|   The WhatsApp service (needs the token + phone number id), the webhook
|   controller (needs the verify token), and server.js (needs the port).
|==============================================================================
*/

require("dotenv").config(); // loads the .env file into process.env

const config = {
  // The port our server listens on (from .env, e.g. 3005)
  port: process.env.PORT,

  // Secret word Meta and we both agree on, used only during webhook setup
  verifyToken: process.env.VERIFY_TOKEN,

  // The permanent access token that lets us call Meta's API to send messages
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,

  // The ID of our WhatsApp phone number (from Meta > WhatsApp > API Setup)
  phoneNumberId: process.env.PHONE_NUMBER_ID,

  // Meta Graph API version we call. Kept here so upgrades are a one-line change.
  graphApiVersion: "v25.0",
};

module.exports = config;
