/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../src/js/worker");

require("./js/parser-unit-tests");

require("./js/container-cleanup");

require("./js/basic-tests");
require("./js/failure-mode-tests");
require("./js/persistence-tests");
require("./js/view_tests");

// The couchdb-lucene tests can only run in Docker.
if (!gpii.test.couchdb.worker.useVagrant() && !gpii.test.couchdb.worker.useExternal()) {
    require("./js/lucene-tests");
}
