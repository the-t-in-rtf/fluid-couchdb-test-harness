"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

require("../..");

if (fluid.get(process, "env.GPII_TEST_COUCH_USE_EXTERNAL")) {
    fluid.log("Skipping container cleanup for 'external' worker(s).");
}
else {
    gpii.test.couchdb.worker.couch({
        removeContainer: true,
        listeners: {
            "onCreate.shutdown": {
                func: "{that}.shutdown"
            }
        }
    });

    if (!fluid.get(process, "env.GPII_TEST_COUCH_USE_VAGRANT")) {
        gpii.test.couchdb.worker.lucene({
            removeContainer: true,
            listeners: {
                "onCreate.shutdown": {
                    func: "{that}.shutdown"
                }
            }
        });
    }
}
