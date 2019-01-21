"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var process = require("process");

require("./dockerWorker");
require("./vagrantWorker");

fluid.registerNamespace("gpii.test.couchdb.worker");

gpii.test.couchdb.worker.useVagrant = function () {
    return fluid.get(process, "env.GPII_TEST_COUCH_USE_VAGRANT") ? true : false;
};

fluid.contextAware.makeChecks({
    "gpii.test.couchdb.useVagrant": "gpii.test.couchdb.worker.useVagrant"
});

fluid.defaults("gpii.test.couchdb.worker", {
    gradeNames: ["fluid.component", "fluid.contextAware"],
    couchSetupCheckInterval: 250,
    couchSetupTimeout: 30000,
    couch: {
        port: 35984
    },
    contextAwareness: {
        useVagrant: {
            defaultGradeNames: "gpii.test.couchdb.worker.docker",
            checks: {
                useVagrant: {
                    contextValue: "{gpii.test.couchdb.useVagrant}",
                    gradeNames: "gpii.test.couchdb.worker.vagrant"
                }
            }
        }
    },
    events: {
        combinedShutdown:   null,
        combinedStartup:    null,
        onShutdownComplete: null,
        onStartupComplete:  null
    },
    invokers: {
        shutdown: {
            funcName: "fluid.promise.fireTransformEvent",
            args:     ["{that}.events.combinedShutdown"]
        },
        startup: {
            funcName: "fluid.promise.fireTransformEvent",
            args:     ["{that}.events.combinedStartup"]
        },
        isUp: {
            funcName: "fluid.notImplemented"
        }
    }
});
