/*

    A caseholder for use with `gpii.test.couchdb.harness`, which updates all tests to:

    1. Start the harness before the test.
    2. Stop the harness after the test.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.test.couchdb.caseHolder");

/**
 *
 * Tag any tests without their own `sequenceGrade` with our default grade name.  Any grades with their own value for
 * `sequenceGrade` will be left unaltered.  For more details about sequence grades, see:
 *
 * https://docs.fluidproject.org/infusion/development/IoCTestingFramework.html#example-of-sequence-building-using-sequencegrade
 *
 * @param {Object} rawModules - Fluid IoC test definitions.
 * @param {String} sequenceGrade - The sequence grade to use by default for all tests.
 * @return {Object} - The expanded test definitions.
 *
 */
gpii.test.couchdb.caseHolder.expandModules = function (rawModules, sequenceGrade) {
    var expandedModules = fluid.copy(rawModules);

    for (var a = 0; a < expandedModules.length; a++) {
        var testSuite = expandedModules[a];
        for (var b = 0; b < testSuite.tests.length; b++) {
            var tests = testSuite.tests[b];
            if (!tests.sequenceGrade) {
                tests.sequenceGrade = sequenceGrade;
            }
        }
    }

    return expandedModules;
};

fluid.defaults("gpii.test.couchdb.sequenceElement.startHarness", {
    gradeNames: "fluid.test.sequenceElement",
    sequence: [{
        // TODO: Improve this IoC reference once potentia ii is merged.
        task:        "{testEnvironment}.harness.startup",
        resolve:     "fluid.log",
        resolveArgs: ["Harness startup successful."]
    }]
});

fluid.defaults("gpii.test.couchdb.sequenceElement.stopHarness", {
    gradeNames: "fluid.test.sequenceElement",
    sequence: [{
        // TODO: Improve this IoC reference once potentia ii is merged.
        task:        "{testEnvironment}.harness.shutdown",
        resolve:     "fluid.log",
        resolveArgs: ["Harness shutdown successful."]
    }]
});

fluid.defaults("gpii.test.couchdb.sequence", {
    gradeNames: "fluid.test.sequence",
    sequenceElements: {
        startHarness: {
            gradeNames: "gpii.test.couchdb.sequenceElement.startHarness",
            priority:   "before:sequence"
        },
        stopHarness: {
            gradeNames: "gpii.test.couchdb.sequenceElement.stopHarness",
            priority:   "after:sequence"
        }
    }
});

fluid.defaults("gpii.test.couchdb.caseHolder", {
    gradeNames: ["fluid.test.testCaseHolder"],
    sequenceGrade: "gpii.test.couchdb.sequence",
    mergePolicy: {
        rawModules: "noexpand, nomerge"
    },
    moduleSource: {
        funcName: "gpii.test.couchdb.caseHolder.expandModules",
        args:    ["{that}.options.rawModules", "{that}.options.sequenceGrade"]
    }
});
