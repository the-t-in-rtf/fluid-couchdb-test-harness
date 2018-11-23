"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

require("../..");

gpii.test.couchdb.worker({
    removeContainer: true,
    listeners: {
        "onCreate.shutdown": {
            func: "{that}.shutdown"
        }
    }
});
