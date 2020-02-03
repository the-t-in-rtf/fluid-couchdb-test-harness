/*

    Unit tests for the vagrant worker's command output parser.

*/
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");
jqUnit.module("Command output parser tests.");

fluid.registerNamespace("gpii.tests.couchdb.parser");

require("../../src/js/vagrantWorker");

gpii.tests.couchdb.parser.runTestDef = function (testDef) {
    jqUnit.asyncTest(testDef.message, function () {
        var inputAsBuffer = Buffer.from(testDef.input);
        var parsePromise = gpii.test.couchdb.worker.vagrant.parseVagrantOutput(inputAsBuffer);
        parsePromise.then(
            function (parserOutput) {
                jqUnit.start();
                jqUnit.assertDeepEq("The output should be as expected.", testDef.expected, parserOutput);
            },
            function (error) {
                jqUnit.start();
                jqUnit.fail(error);
            }
        );
    });
};

fluid.defaults("gpii.tests.couchdb.parser", {
    gradeNames: ["fluid.component"],
    testDefs: {
        carriage: {
            message: "We should be able to parse output with only carriage returns.",
            input: "-,-,foo,bar\n-,-,baz,quux\n",
            expected: {
                "foo": "bar",
                "baz": "quux"
            }
        },
        crlf: {
            message: "We should be able to parse output with both carriage returns and line feeds.",
            input: "-,-,foo,bar\r\n-,-,baz,quux\r\n",
            expected: {
                "foo": "bar",
                "baz": "quux"
            }
        },
        nesting: {
            message: "We should be able to handle nesting properly.",
            input: "-,-,deep,deeper,deepest",
            expected: {
                deep: {
                    deeper: "deepest"
                }
            }
        },
        commas: {
            message: "We should be able unescape Vagrant's comma escaping.",
            input: "-,-,commas,Are nice%!(VAGRANT_COMMA) but sometimes overused.",
            expected: {
                commas: "Are nice, but sometimes overused."
            }
        }
    },
    invokers: {
        runSingleTest: {
            funcName: "gpii.tests.couchdb.parser.runTestDef",
            args:     ["{arguments}.0"]
        }
    },
    listeners: {
        "onCreate.runTests": {
            funcName: "fluid.each",
            args: ["{that}.options.testDefs", "{that}.runSingleTest"]
        }
    }
});

gpii.tests.couchdb.parser();
