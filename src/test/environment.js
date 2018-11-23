/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

require("../js/harness");
require("./harness-config");

fluid.registerNamespace("gpii.test.couchdb.environment");

fluid.defaults("gpii.test.couchdb.environment.base", {
    gradeNames: ["fluid.test.testEnvironment"],
    couch: {
        port: 25984,
        hostname: "localhost"
    },
    databases: {},
    components: {
        harness: {
            type: "gpii.test.couchdb.harness",
            options: {
                couch: {
                    port:     "{gpii.test.couchdb.environment.base}.options.couch.port",
                    hostname: "{gpii.test.couchdb.environment.base}.options.couch.hostname"
                },
                databases: "{gpii.test.couchdb.environment.base}.options.databases"
            }
        }
    }
});

fluid.defaults("gpii.test.couchdb.environment", {
    gradeNames: ["gpii.test.couchdb.environment.base"],
    databases:  gpii.test.couchdb.harness.config.databases
});
