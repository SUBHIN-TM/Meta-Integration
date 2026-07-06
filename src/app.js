/*
|==============================================================================
| app.js  —  BUILDS THE EXPRESS APP
|==============================================================================
| WHAT THIS FILE IS:
|   Creates the Express application, turns on the middleware we need, and
|   connects ALL our routes (via the master address book, routes/index.js).
|
| WHY IT'S SEPARATE FROM server.js:
|   app.js only BUILDS the app. server.js STARTS it (listens on a port).
|   Keeping them apart makes the app easy to test and easy to read.
|==============================================================================
*/

const express = require("express");
const routes = require("./routes");

const app = express();

// Middleware: automatically parse incoming JSON bodies (Meta sends JSON)
app.use(express.json());

// Connect every route from the master address book
app.use(routes);

module.exports = app;
