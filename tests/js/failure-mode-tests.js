/*

    Failure tests for easily-tested "reject" conditions in promise-returning functions.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

require("../../");

var jqUnit = require("node-jqunit");

jqUnit.module("Failure mode tests for promise-returning functions.");

fluid.registerNamespace("gpii.tests.harness.failure");

gpii.tests.harness.failure.testSingleTestDef = function (testDef) {
    jqUnit.test(testDef.message, function () {
        jqUnit.stop();
        var promiseOrFn = fluid.invokeGlobalFunction(testDef.funcName, testDef.args);
        var promise = typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;
        promise.then(
            function () {
                jqUnit.start();
                jqUnit.fail("The promise should not have been resolved.");
            },
            function () {
                jqUnit.start();
                jqUnit.assert("The promise should have been rejected.");
            }
        );
    });
};

gpii.tests.harness.failure.runTests = function (that) {
    fluid.each(that.options.testDefs, gpii.tests.harness.failure.testSingleTestDef);
};

fluid.defaults("gpii.tests.harness.failure.testRunner", {
    gradeNames: ["fluid.component"],
    testDefs: {
        checkCouchRepeatedly: {
            message:  "Test error handling in `gpii.test.couchdb.checkCouchRepeatedly`.",
            funcName: "gpii.test.couchdb.checkCouchRepeatedly",
            args:     [{ couch: { baseUrl: "http://localhost:5050/" } } ]
        },
        constructCouch: {
            message:  "Test error handling in `gpii.test.couchdb.harness.constructCouchReadyPromise`.",
            funcName: "gpii.test.couchdb.harness.constructCouchReadyPromise",
            args:     [{ options: { couch: { port: 5050 }, couchSetupTimeout:250, couchSetupCheckInterval: 100 } }]
        },
        dbCleaning: {
            message:  "Test error handling in `gpii.test.couchdb.harness.constructDbCleaningPromise`.",
            funcName: "gpii.test.couchdb.harness.constructDbCleaningPromise",
            args:     ["http://localhost:5050/myDb"]
        },
        dbCreation: {
            message:  "Test error handling in `gpii.test.couchdb.harness.constructDbCreationPromise`.",
            funcName: "gpii.test.couchdb.harness.constructDbCreationPromise",
            args:     ["http://localhost:5050/myDb"]
        },
        provisionSingleDbMissingHost: {
            message:  "Test async error handling in `gpii.test.couchdb.harness.provisionSingleDbIfNeeded`.",
            funcName: "gpii.test.couchdb.harness.provisionSingleDbIfNeeded",
            args:     [{ options: { couch: {}, templates: { couchDbUrl: "http://localhost:5050/"}}}, {}, "myDb"]
        },
        provisionSingleDbGrossError: {
            message:  "Test gross error handling in `gpii.test.couchdb.harness.provisionSingleDbIfNeeded`.",
            funcName: "gpii.test.couchdb.harness.provisionSingleDbIfNeeded",
            args:     []
        },
        runCommandAsPromiseBadCommand: {
            message:  "Test command error output handling in `gpii.test.couchdb.runCommandAsPromise`.",
            funcName: "gpii.test.couchdb.runCommandAsPromise",
            args:     ["halt and catch fire", {}]
        },
        runCommandAsPromiseUndefinedCommand: {
            message:  "Test low-level error handling in `gpii.test.couchdb.runCommandAsPromise`.",
            funcName: "gpii.test.couchdb.runCommandAsPromise",
            args:     [undefined, {}]
        }

    },
    listeners: {
        "onCreate.runTests": {
            funcName: "gpii.tests.harness.failure.runTests",
            args:     ["{that}"]
        }
    }
});

gpii.tests.harness.failure.testRunner();
