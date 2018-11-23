/* eslint-env node */
// A convenience script to start the test harness, used for manual QA.
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../../");

//fluid.setLogging(true);
fluid.setLogLevel(fluid.logLevel.TRACE);

gpii.test.couchdb.harness({
    port: 6789,
    monitorContainer: true, // You should not clear this unless you have made other arrangements to keep the harness alive.
    databases: gpii.test.couchdb.harness.config.databases,
    listeners: {
        "onCreate.startup": {
            func: "{that}.startup"
        },
        "onDestroy.shutdown": {
            func: "{that}.shutdown"
        }
    }
});
