"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

var request = require("request");

fluid.registerNamespace("gpii.test.couchdb");

/**
 *
 * Check to see if CouchDB is up.
 *
 * @param {Object} options - The options to use when checking to see if CouchDB is up, notably `couch.baseUrl`.
 * @return {Promise} - A `fluid.promise` instance that will be resolved when the check is complete or rejected on error.  The promise will be resolved with `true` if CouchDB is reachable, and `false` otherwise.
 */
gpii.test.couchdb.checkCouchOnce = function (options) {
    var couchUpPromise = fluid.promise();
    request.get(options.couch.baseUrl, function (error, response) {
        if (error) {
            couchUpPromise.resolve(false);
        }
        else if (response.statusCode === 200) {
            couchUpPromise.resolve(true);
        }
        else {
            couchUpPromise.resolve(false);
        }
    });
    return couchUpPromise;
};

/**
 *
 * Construct a promise-returning function that will detect when a couch instance is ready to respond to requests.
 *
 * @param {Object} options - The options to use when constructing the promise.
 * @return {Promise} - A `fluid.promise` that will be resolved when couch is available or rejected if the instance doesn't respond in time.
 *
 */
gpii.test.couchdb.checkCouchRepeatedly = function (options) {
    var couchReadyPromise = fluid.promise();
    var timeout = setTimeout( function () {
        if (!couchReadyPromise.disposition) {
            couchReadyPromise.reject("Timed out waiting for CouchDB to be available.");
        }
    }, options.couchSetupTimeout || 30000);
    var interval = setInterval(function () {
        var singleCouchCheckPromise = gpii.test.couchdb.checkCouchOnce(options);
        singleCouchCheckPromise.then(
            function (isUp) {
                if (isUp) {
                    clearTimeout(timeout);
                    clearInterval(interval);
                    couchReadyPromise.resolve();
                }
            },
            couchReadyPromise.reject
        );
    }, options.couchSetupCheckInterval || 250);

    return couchReadyPromise;
};
