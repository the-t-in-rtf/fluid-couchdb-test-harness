"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var process = require("process");

require("./dockerWorker");
require("./vagrantWorker");
require("./externalWorker");

fluid.registerNamespace("gpii.test.couchdb.worker");

gpii.test.couchdb.worker.useVagrant = function () {
    return fluid.get(process, "env.GPII_TEST_COUCH_USE_VAGRANT") ? true : false;
};

fluid.contextAware.makeChecks({
    "gpii.test.couchdb.useVagrant": "gpii.test.couchdb.worker.useVagrant"
});

gpii.test.couchdb.worker.useExternal = function () {
    return fluid.get(process, "env.GPII_TEST_COUCH_USE_EXTERNAL") ? true : false;
};

fluid.contextAware.makeChecks({
    "gpii.test.couchdb.useExternal": "gpii.test.couchdb.worker.useExternal"
});

fluid.defaults("gpii.test.couchdb.worker.base", {
    gradeNames: ["fluid.component", "fluid.contextAware"],
    setupCheckInterval: 250,
    setupTimeout: 30000,
    hostname: "localhost",
    port: 25984,
    baseUrl: {
        expander: {
            funcName: "fluid.stringTemplate",
            args: ["{that}.options.templates.baseUrl", { hostname: "{that}.options.hostname", port: "{that}.options.port"}]
        }
    },
    templates: {
        baseUrl: "http://%hostname:%port"
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
        },
        isReady: {
            funcName: "gpii.test.couchdb.checkUrlRepeatedly",
            args:     ["{that}.options"]
        }
    }
});

fluid.defaults("gpii.test.couchdb.worker.couch", {
    gradeNames: ["gpii.test.couchdb.worker.base", "fluid.contextAware"],
    port: 25984,
    allDbsUrl: {
        expander: {
            funcName: "fluid.stringTemplate",
            args: ["{that}.options.templates.allDbsUrl", { baseUrl: "{that}.options.baseUrl"}]
        }
    },
    templates: {
        allDbsUrl: "%baseUrl/_all_dbs"
    },
    contextAwareness: {
        whichWorker: {
            defaultGradeNames: "gpii.test.couchdb.worker.docker",
            checks: {
                useVagrant: {
                    contextValue: "{gpii.test.couchdb.useVagrant}",
                    gradeNames: "gpii.test.couchdb.worker.vagrant"
                },
                useExternal: {
                    contextValue: "{gpii.test.couchdb.useExternal}",
                    gradeNames: "gpii.test.couchdb.worker.external"
                }
            }
        }
    }
});

fluid.defaults("gpii.test.couchdb.worker.lucene", {
    gradeNames: ["gpii.test.couchdb.worker.base", "fluid.contextAware"],
    port: 25985,
    contextAwareness: {
        whichWorker: {
            defaultGradeNames: "gpii.test.couchdb.lucene.worker.docker",
            checks: {
                useVagrant: {
                    contextValue: "{gpii.test.couchdb.useVagrant}",
                    gradeNames: "gpii.test.couchdb.lucene.worker.vagrant"
                },
                useExternal: {
                    contextValue: "{gpii.test.couchdb.useExternal}",
                    gradeNames: "gpii.test.couchdb.lucene.worker.external"
                }
            }
        }
    }
});
