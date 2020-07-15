/*

    Failure tests for easily-tested "reject" conditions in promise-returning functions.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");

require("../../");

var jqUnit = require("node-jqunit");

jqUnit.module("Failure mode tests for promise-returning functions.");

fluid.registerNamespace("fluid.tests.harness.failure");

fluid.tests.harness.failure.testSingleTestDef = function (testDef) {
    jqUnit.asyncTest(testDef.message, function () {
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

fluid.tests.harness.failure.runTests = function (that) {
    fluid.each(that.options.testDefs, fluid.tests.harness.failure.testSingleTestDef);
};

fluid.defaults("fluid.tests.harness.failure.testRunner", {
    gradeNames: ["fluid.component"],
    testDefs: {
        checkUrlRepeatedly: {
            message:  "Test error handling in `fluid.test.couchdb.checkUrlRepeatedly`.",
            funcName: "fluid.test.couchdb.checkUrlRepeatedly",
            args:     [{ baseUrl: "http://localhost:5050/", setupTimeout: 500  } ]
        },
        dbCleaning: {
            message:  "Test error handling in `fluid.test.couchdb.harness.constructDbCleaningPromise`.",
            funcName: "fluid.test.couchdb.harness.constructDbCleaningPromise",
            args:     ["http://localhost:5050/myDb"]
        },
        dbCreation: {
            message:  "Test error handling in `fluid.test.couchdb.harness.constructDbCreationPromise`.",
            funcName: "fluid.test.couchdb.harness.constructDbCreationPromise",
            args:     ["http://localhost:5050/myDb"]
        },
        provisionSingleDbMissingHost: {
            message:  "Test async error handling in `fluid.test.couchdb.harness.provisionSingleDbIfNeeded`.",
            funcName: "fluid.test.couchdb.harness.provisionSingleDbIfNeeded",
            args:     [{ options: { couch: {}, templates: { couchDbUrl: "http://localhost:5050/"}}}, {}, "myDb"]
        },
        provisionSingleDbGrossError: {
            message:  "Test gross error handling in `fluid.test.couchdb.harness.provisionSingleDbIfNeeded`.",
            funcName: "fluid.test.couchdb.harness.provisionSingleDbIfNeeded",
            args:     []
        },
        runCommandAsPromiseBadCommand: {
            message:  "Test command error output handling in `fluid.test.couchdb.runCommandAsPromise`.",
            funcName: "fluid.test.couchdb.runCommandAsPromise",
            args:     ["halt and catch fire", {}]
        },
        runCommandAsPromiseUndefinedCommand: {
            message:  "Test low-level error handling in `fluid.test.couchdb.runCommandAsPromise`.",
            funcName: "fluid.test.couchdb.runCommandAsPromise",
            args:     [undefined, {}]
        }

    },
    listeners: {
        "onCreate.runTests": {
            funcName: "fluid.tests.harness.failure.runTests",
            args:     ["{that}"]
        }
    }
});

fluid.tests.harness.failure.testRunner();
