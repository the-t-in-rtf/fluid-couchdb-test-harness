"use strict";
var fluid = require("infusion");

var jqUnit = require("node-jqunit");

fluid.require("%fluid-couchdb-test-harness");
fluid.test.couchdb.loadTestingSupport();

var kettle = require("kettle");
kettle.loadTestingSupport();

fluid.defaults("fluid.tests.couchdb.lucene.request", {
    gradeNames: ["kettle.test.request.http"],
    port: 25985,
    path: {
        expander: {
            funcName: "fluid.stringTemplate",
            args: [
                "%baseUrl/local/views/_design/lucene/by_content?q=%query",
                { baseUrl: "{testEnvironment}.harness.luceneWorker.options.baseUrl"}
            ]
        }
    }
});

fluid.registerNamespace("fluid.test.couchdb.lucene");

fluid.test.couchdb.lucene.checkResponse = function (response, body, minResults, maxResults) {
    jqUnit.assertEquals("The status code should be as expected.", 200, response.statusCode);
    jqUnit.assertTrue("There should be at least the minimum expected number of results", body.rows.length >= minResults);
    jqUnit.assertTrue("There should be no more than the maximum expected number of results", body.rows.length <= maxResults);
};

fluid.defaults("fluid.tests.couchdb.lucene.caseHolder", {
    gradeNames: ["fluid.test.couchdb.caseHolder"],
    rawModules: [
        {
            name: "Testing couchdb-lucene harness.",
            tests: [
                // Perform a basic search that should return results
                {
                    name: "A search that matches data should return results.",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestWithResults}.send",
                            args: [{}, { termMap: { query: "honey"}}]
                        },
                        {
                            event: "{requestWithResults}.events.onComplete",
                            listener: "fluid.test.couchdb.lucene.checkResponse",
                            args: ["{requestWithResults}.nativeResponse", "@expand:JSON.parse({arguments}.0)", 1, 5] // response, body, minResults, maxResults
                        }
                    ]
                },
                // Perform a basic search that should not return results
                {
                    name: "A search that doesn't match data should not return results.",
                    type: "test",
                    sequence: [
                        {
                            func: "{requestWithoutResults}.send",
                            args: [{}, { termMap: { query: "vinegar" }}]
                        },
                        {
                            event: "{requestWithoutResults}.events.onComplete",
                            listener: "fluid.test.couchdb.lucene.checkResponse",
                            args: ["{requestWithoutResults}.nativeResponse", "@expand:JSON.parse({arguments}.0)", 0, 0] // response, body, minResults, maxResults
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        requestWithResults: {
            type: "fluid.tests.couchdb.lucene.request"
        },
        requestWithoutResults: {
            type: "fluid.tests.couchdb.lucene.request"
        }
    }
});

fluid.defaults("fluid.tests.couchdb.lucene.environment", {
    gradeNames: ["fluid.test.couchdb.lucene.environment"],
    components: {
        testCaseHolder: {
            type: "fluid.tests.couchdb.lucene.caseHolder"
        }
    }
});

fluid.test.runTests("fluid.tests.couchdb.lucene.environment");
