// Copia la web-app ../In-Iure in app/ con lo strato desktop (desktop/desktop.js),
// riusando lo script del progetto mobile.
"use strict";
const path = require("path");
const { copyWeb } = require("../../In-Iure-App/scripts/copy-web.js");

const ROOT = path.resolve(__dirname, "..");
copyWeb({ out: path.join(ROOT, "app"), layer: path.join(ROOT, "desktop", "desktop.js") });
