/* eslint-env node */
"use strict";
var fluid = require("infusion");

fluid.module.register("fluid-couchdb-test-harness", __dirname, require);

require("./src/js/harness");
require("./src/test/harness-config");

fluid.registerNamespace("fluid.test.couchdb");

fluid.test.couchdb.loadTestingSupport = function () {
    require("./src/test/caseholder");
    require("./src/test/environment");
    require("./src/test/request");
};
