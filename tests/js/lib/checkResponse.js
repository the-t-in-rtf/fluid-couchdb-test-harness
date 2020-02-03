/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

fluid.registerNamespace("gpii.test.couchdb");
/**
 *
 * A static function that can be used to inspect an HTTP response and confirm whether its status and body are as expected.
 *
 * @param {Object} response - The response object, used to check the statusCode.
 * @param {Anything} body - The body of the response returned by the server.
 * @param {Number} expectedStatus - The expected HTTP status code associated with the response.
 * @param {Anything} expectedBody - The expected body.
 *
 */
gpii.test.couchdb.checkResponse = function (response, body, expectedStatus, expectedBody) {
    expectedStatus = expectedStatus ? expectedStatus : 200;

    var bodyData = JSON.parse(body);

    jqUnit.assertEquals("The status should be as expected.", expectedStatus, response.statusCode);

    if (expectedBody) {
        if (typeof expectedBody === "object" && expectedBody.rows) {
            jqUnit.assertLeftHand(
                "Everything but the row data should match.",
                fluid.filterKeys(expectedBody, ["rows"], true),
                fluid.filterKeys(bodyData, ["rows"], true)
            );
            fluid.each(expectedBody.rows, function (expectedValue, index) {
                var actualValue = bodyData.rows[index];
                jqUnit.assertLeftHand("Row entry " + index + " should be as expected.", expectedValue, actualValue);
            });
        }
        else {
            jqUnit.assertLeftHand("The body should be as expected.", expectedBody, bodyData);
        }
    }
};
