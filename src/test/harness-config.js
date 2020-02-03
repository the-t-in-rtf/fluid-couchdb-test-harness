/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.test.couchdb.harness.config");

gpii.test.couchdb.harness.config = {
    databases: {
        sample:           { data: [ "%gpii-couchdb-test-harness/tests/data/data.json", "%gpii-couchdb-test-harness/tests/data/supplemental.json"] },
        users:            { data: "%gpii-couchdb-test-harness/tests/data/users.json"},
        // A ~100k data set to confirm that the async data loads do not take too long.
        massive:          { data: "%gpii-couchdb-test-harness/tests/data/massive.json"},
        rgb:              { data: "%gpii-couchdb-test-harness/tests/data/rgb.json"},
        // Sample data to test views, including map/reduce
        views:            { data: "%gpii-couchdb-test-harness/tests/data/views.json"},
        // Test loading of payloads that have not been wrapped in a "docs" element.
        nonbulk:          { data: "%gpii-couchdb-test-harness/tests/data/non-bulk.json"},
        nodata:           {}
    }
};
