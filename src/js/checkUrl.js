"use strict";
var fluid = require("infusion");

var request = require("request");

fluid.registerNamespace("fluid.test.couchdb");

/**
 *
 * Check to see if a URL served by a worker is responding to requests.
 *
 * @param {Object} options - The options to use when checking to see if CouchDB is up, notably `couch.baseUrl`.
 * @return {Promise} - A `fluid.promise` instance that will be resolved when the check is complete or rejected on error.  The promise will be resolved with `true` if CouchDB is reachable, and `false` otherwise.
 *
 */
fluid.test.couchdb.checkUrlOnce = function (options) {
    var urlCheckPromise = fluid.promise();
    request.get(options.baseUrl, function (error, response) {
        if (error) {
            urlCheckPromise.resolve(false);
        }
        else if (response.statusCode === 200) {
            urlCheckPromise.resolve(true);
        }
        else {
            urlCheckPromise.resolve(false);
        }
    });
    return urlCheckPromise;
};

/**
 *
 * Construct a promise-returning function that will detect when a couch instance is ready to respond to requests.
 *
 * @param {Object} options - The options to use when constructing the promise.
 * @return {Promise} - A `fluid.promise` that will be resolved when couch is available or rejected if the instance doesn't respond in time.
 *
 */
fluid.test.couchdb.checkUrlRepeatedly = function (options) {
    var urlCheckPromise = fluid.promise();
    var timeout = setTimeout( function () {
        if (!urlCheckPromise.disposition) {
            urlCheckPromise.reject("Timed out waiting for URL '" + options.baseUrl + "' to respond.");
        }
    }, options.setupTimeout || 30000);

    var interval = setInterval(function () {
        var singleCouchCheckPromise = fluid.test.couchdb.checkUrlOnce(options);
        singleCouchCheckPromise.then(
            function (isUp) {
                if (isUp) {
                    clearTimeout(timeout);
                    clearInterval(interval);

                    // Workaround for fluid-3989 to reduce the frequency of double promise resolution.
                    if (!urlCheckPromise.disposition) {
                        urlCheckPromise.resolve();
                    }
                }
            },
            urlCheckPromise.reject
        );
    }, options.setupCheckInterval || 250);

    return urlCheckPromise;
};
