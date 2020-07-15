"use strict";
var fluid = require("infusion");

require("../../");

fluid.registerNamespace("fluid.test.couchdb.worker.external");

fluid.test.couchdb.worker.external.isUp = function () {
    fluid.log("Running using 'external' worker, which we assume is up.");
    var promise = fluid.promise();
    promise.resolve(true);
    return promise;
};

fluid.defaults("fluid.test.couchdb.worker.external", {
    gradeNames: ["fluid.test.couchdb.worker"],
    invokers: {
        isUp: {
            funcName: "fluid.test.couchdb.worker.external.isUp"
        }
    },
    listeners: {
        "combinedShutdown.fireEvent": {
            func: "{that}.events.onShutdownComplete.fire"
        },
        "combinedStartup.fireEvent": {
            func: "{that}.events.onStartupComplete.fire"
        }
    }
});

// We have no reasonable way to install couchdb-lucene for external use in CI, so blow up if someone tries to run those
// tests.
fluid.defaults("fluid.test.couchdb.lucene.worker.external", {
    gradeNames: ["fluid.test.couchdb.worker"],
    listeners: {
        "onCreate.explode": {
            funcName: "fluid.fail",
            args: ["The lucene test harness can only be used with Docker."]
        }
    }
});
