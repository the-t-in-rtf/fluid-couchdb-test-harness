/* eslint-env node */
/* Tests for the container monitoring. */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var process = require("process");

if (fluid.get(process, "env.GPII_TEST_COUCH_USE_EXTERNAL")) {
    fluid.log("Skipping monitoring tests for 'external' worker.");
}
else {
    fluid.require("%gpii-couchdb-test-harness");
    gpii.test.couchdb.loadTestingSupport();

    var kettle = require("kettle");
    kettle.loadTestingSupport();

    fluid.defaults("gpii.tests.couchdb.basic.caseHolder", {
        gradeNames: ["gpii.test.couchdb.caseHolder"],
        rawModules: [
            {
                name: "Confirming that the harness monitors its container as expected.",
                tests: [
                    {
                        name: "Test shutdown from secondary harness.",
                        type: "test",
                        sequence: [
                            {
                                func: "{worker}.shutdown"
                            },
                            {
                                listener: "jqUnit.assert",
                                event:    "{harness}.events.onCouchMissing",
                                args:     ["Primary harness should have shut down once container was shut down."]
                            }
                        ]
                    }
                ]
            }
        ]
    });

    fluid.defaults("gpii.tests.couchdb.basic.environment", {
        gradeNames: ["gpii.test.couchdb.environment"],
        components: {
            testCaseHolder: {
                type: "gpii.tests.couchdb.basic.caseHolder"
            },
            harness: {
                options: {
                    monitorContainer: true
                }
            },
            worker: {
                type: "gpii.test.couchdb.worker",
                options: {
                    shutdownContainer: true,
                    couch: {
                        port:     "{gpii.test.couchdb.environment.base}.options.couch.port",
                        hostname: "{gpii.test.couchdb.environment.base}.options.couch.hostname"
                    }
                }
            }
        }
    });

    fluid.test.runTests("gpii.tests.couchdb.basic.environment");
}
