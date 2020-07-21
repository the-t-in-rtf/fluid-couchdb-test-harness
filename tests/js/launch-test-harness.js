/* eslint-env node */
// A convenience script to start the test harness, used for manual QA.
"use strict";
var fluid = require("infusion");

require("../../");

fluid.setLogging(true);

fluid.test.couchdb.harness({
    port: 6789,
    monitorContainer: true, // You should not clear this unless you have made other arrangements to keep the harness alive.
    databases: fluid.test.couchdb.harness.config.databases,
    listeners: {
        "onCreate.startup": {
            func: "{that}.startup"
        },
        "onDestroy.shutdown": {
            func: "{that}.shutdown"
        }
    }
});
