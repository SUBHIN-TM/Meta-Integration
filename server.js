/*
|==============================================================================
| server.js  —  THE STARTING POINT (entry file)
|==============================================================================
| WHAT THIS FILE IS:
|   The very first file that runs. Its ONLY job is to start the server and
|   begin listening for requests. All the real logic lives inside /src.
|
| THE BIG PICTURE (how a request flows):
|
|   Meta / browser
|        │
|        ▼
|   server.js  ──starts──▶  src/app.js  ──uses──▶  src/routes/*  (address book)
|                                                        │
|                                                        ▼
|                                              src/controllers/*  (the brain)
|                                                        │
|                                    ┌───────────────────┴───────────────────┐
|                                    ▼                                       ▼
|                         src/services/whatsapp   (send to Meta)   src/services/eventStore (remember)
|
| To run:  node server.js   (or: npm start)
|==============================================================================
*/

const app = require("./src/app");
const config = require("./src/config");

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
