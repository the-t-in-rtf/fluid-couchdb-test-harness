"use strict";
var fluid = require("infusion");

require("../..");

if (fluid.get(process, "env.FLUID_TEST_COUCH_USE_EXTERNAL")) {
    fluid.log("Skipping container cleanup for 'external' worker(s).");
}
else {
    fluid.test.couchdb.worker.couch({
        removeContainer: true,
        listeners: {
            "onCreate.shutdown": {
                func: "{that}.shutdown"
            }
        }
    });

    if (!fluid.get(process, "env.FLUID_TEST_COUCH_USE_VAGRANT")) {
        fluid.test.couchdb.worker.lucene({
            removeContainer: true,
            listeners: {
                "onCreate.shutdown": {
                    func: "{that}.shutdown"
                }
            }
        });
    }
}
