/* eslint-env node */
/* Tests for the "pouch" module */
"use strict";
var fluid = require("infusion");
fluid.logObjectRenderChars = 20480;
var gpii  = fluid.registerNamespace("gpii");

fluid.require("%gpii-couchdb-test-harness");
gpii.test.couchdb.loadTestingSupport();

var kettle = require("kettle");
kettle.loadTestingSupport();

require("./lib/checkResponse");

fluid.registerNamespace("gpii.tests.couchdb.views");

fluid.defaults("gpii.tests.couchdb.views.caseHolder", {
    gradeNames: ["gpii.test.couchdb.caseHolder"],
    expected: {
        noReduce: {
            "total_rows":4,
            "offset":0,
            "rows":[
                {"key":"beast","value":"honey badger"},
                {"key":"beast","value":"wolverine"},
                {"key":"bird","value":"ostrich"},
                {"key":"bird","value":"coot"}
            ]
        },
        allReduced:     {"rows":[{"key":"beast","value":2},{"key":"bird","value":2}]},
        reducedWithKey: {"rows":[{"key":"beast", "value":2}]}
    },
    rawModules: [
        {
            name: "Testing view handling.",
            tests: [
                {
                    name: "Load a view without reducing the contents.",
                    type: "test",
                    sequence: [
                        {
                            func: "{noReduceRequest}.send"
                        },
                        {
                            listener: "gpii.test.couchdb.checkResponse",
                            event:    "{noReduceRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{noReduceRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.noReduce"]
                        }
                    ]
                },
                {
                    name: "Load all records and reduce the contents.",
                    type: "test",
                    sequence: [
                        {
                            func: "{allReducedRequest}.send"
                        },
                        {
                            listener: "gpii.test.couchdb.checkResponse",
                            event:    "{allReducedRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{allReducedRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.allReduced"]
                        }
                    ]
                },
                {
                    name: "Reduce only records matching a key.",
                    type: "test",
                    sequence: [
                        {
                            func: "{reducedWithKeyRequest}.send"
                        },
                        {
                            listener: "gpii.test.couchdb.checkResponse",
                            event:    "{reducedWithKeyRequest}.events.onComplete",
                            //        (response, body, expectedStatus, expectedBody)
                            args:     ["{reducedWithKeyRequest}.nativeResponse", "{arguments}.0", 200, "{testCaseHolder}.options.expected.reducedWithKey"]
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        noReduceRequest: {
            type: "gpii.test.couchdb.request",
            options: {
                path: "/views/_design/count/_view/count?reduce=false"
            }
        },
        allReducedRequest: {
            type: "gpii.test.couchdb.request",
            options: {
                path: "/views/_design/count/_view/count?group=true"
            }
        },
        reducedWithKeyRequest: {
            type: "gpii.test.couchdb.request",
            options: {
                path: "http://localhost:25984/views/_design/count/_view/count?group=true&key=\"beast\""
            }
        }
    }
});

fluid.defaults("gpii.tests.couchdb.views.environment", {
    gradeNames: ["gpii.test.couchdb.environment"],
    components: {
        testCaseHolder: {
            type: "gpii.tests.couchdb.views.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.couchdb.views.environment");
