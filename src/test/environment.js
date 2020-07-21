/* eslint-env node */
"use strict";
var fluid = require("infusion");

require("../js/harness");
require("./harness-config");

fluid.registerNamespace("fluid.test.couchdb.environment");

fluid.defaults("fluid.test.couchdb.environment.base", {
    gradeNames: ["fluid.test.testEnvironment"],
    couch: {
        port: 25984,
        hostname: "localhost"
    },
    databases: {},
    components: {
        harness: {
            type: "fluid.test.couchdb.harness",
            options: {
                couch: "{fluid.test.couchdb.environment.base}.options.couch",
                databases: "{fluid.test.couchdb.environment.base}.options.databases"
            }
        }
    }
});

fluid.defaults("fluid.test.couchdb.environment", {
    gradeNames: ["fluid.test.couchdb.environment.base"],
    databases:  fluid.test.couchdb.harness.config.databases
});

fluid.defaults("fluid.test.couchdb.lucene.environment", {
    gradeNames: ["fluid.test.couchdb.environment"],
    components: {
        harness: {
            type: "fluid.test.couchdb.harness.lucene"
        }
    }
});
