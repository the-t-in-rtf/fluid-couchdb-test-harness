"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../../");

fluid.registerNamespace("gpii.test.couchdb.worker.external");

gpii.test.couchdb.worker.external.isUp = function () {
    fluid.log("Running using 'external' worker, which we assume is up.");
    var promise = fluid.promise();
    promise.resolve(true);
    return promise;
};

fluid.defaults("gpii.test.couchdb.worker.external", {
    gradeNames: ["gpii.test.couchdb.worker"],
    invokers: {
        isUp: {
            funcName: "gpii.test.couchdb.worker.external.isUp"
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
