/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");


fluid.module.register("gpii-couchdb-test-harness", __dirname, require);

require("./src/js/harness");
require("./src/test/harness-config");

fluid.registerNamespace("gpii.test.couchdb");

gpii.test.couchdb.loadTestingSupport = function () {
    require("./src/test/caseHolder");
    require("./src/test/environment");
    require("./src/test/request");
};
