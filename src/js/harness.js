"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var request = require("request");

require("./isCouchReady");
require("./worker");

fluid.registerNamespace("gpii.test.couchdb.harness");

/**
 *
 * If CouchDB is not already responding, let our worker know to start its container.
 *
 * @param {Object} that - The harness component itself
 * @param {Boolean} isCouchUp - Whether or not CouchDB is already running (returned by an earlier step in the promise chain).
 * @return {Promise} - A `fluid.promise` that will be resolved when the container is available or rejected if an error occurs.
 *
 */
gpii.test.couchdb.harness.startIfNeeded = function (that, isCouchUp) {
    var startPromise = fluid.promise();
    that.worker.isUp().then(function () {
        if (isCouchUp) {
            startPromise.resolve("CouchDB is already running, no need to start it.");
        }
        else {
            var innerStartPromise = that.worker.startup();
            innerStartPromise.then(startPromise.resolve, startPromise.reject);
        }
    }, startPromise.reject);
    return startPromise;
};

/**
 *
 * If we are configured to shut down the associated container on shutdown, do so.
 *
 * @param {Object} that - The harness component.
 * @return {Promise} - A `fluid.promise` that will be resolved once shutdown is complete (or skipped), or rejected on an error.
 *
 */
gpii.test.couchdb.harness.shutdownIfNeeded = function (that) {
    if (that.options.shutdownContainer) {
        return that.worker.shutdown();
    }
    else {
        var promise = fluid.promise();
        promise.resolve("We are not configured to shut down the associated container, skipping container shutdown.");
        return promise;
    }
};

/**
 *
 * Provision all databases as needed depending on the status of the database and our configuration.
 *
 * @param {Object} that - The harness component.
 * @param {Boolean} forceClean - Whether or not to force cleanup of the database.
 * @return {Promise} - A `fluid.promise` that will be resolved when provisioning is complete or rejected if an error occurs.
 *
 */
gpii.test.couchdb.harness.provisionDbsIfNeeded = function (that, forceClean) {
    var provisioningPromiseMap = fluid.transform(that.options.databases, function (dbDef, dbName) {
        return gpii.test.couchdb.harness.provisionSingleDbIfNeeded(that, dbDef, dbName, forceClean);
    });
    var provisioningPromises = fluid.values(provisioningPromiseMap);
    var provisioningSequence = fluid.promise.sequence(provisioningPromises);
    return provisioningSequence;
};

/**
 *
 * Construct a promise-returning function to provision a single database.
 *
 * @param {Object} that - The harness component.
 * @param {Object} dbDef - The database definition, including any `data` files to load.
 * @param {String} dbName - The name of the database.
 * @param {Boolean} forceClean - Whether or not to force cleanup of the database.
 * @return {Function} - A `fluid.promise` returning function.  The promise will be resolved when the database is provisioned or rejected if an error occurs.
 *
 */
gpii.test.couchdb.harness.provisionSingleDbIfNeeded = function (that, dbDef, dbName, forceClean) {
    return function () {
        var dbProvisioningPromise = fluid.promise();
        try {
            var dbUrl = fluid.stringTemplate(
                that.options.templates.couchDbUrl,
                {
                    baseUrl: that.options.couch.baseUrl,
                    dbName:  dbName
                }
            );

            // TODO: Once we only support CouchDB 2.2 or higher, we can get metadata for all endpoints at once:
            // See: http://docs.couchdb.org/en/stable/api/server/common.html#post--_dbs_info
            fluid.log(fluid.logLevel.TRACE, "Requesting metadata for database: ", dbUrl);
            request.get(dbUrl, function (error, response) {
                if (error) {
                    dbProvisioningPromise.reject(error);
                }
                else {
                    var provisioningPromises = [];

                    var alreadyExists = response.statusCode !== 404;
                    var shouldClean = (that.options.cleanDbs || forceClean);

                    // Delete the existing data if needed.
                    if (alreadyExists && shouldClean) {
                        fluid.log(fluid.logLevel.TRACE, "Queueing up deletion of existing database: ", dbUrl);
                        provisioningPromises.push(gpii.test.couchdb.harness.constructDbCleaningPromise(dbUrl));
                    }

                    // Create the database if needed.
                    if (shouldClean || !alreadyExists) {
                        fluid.log(fluid.logLevel.TRACE, "Queueing up creation of database: ", dbUrl);
                        provisioningPromises.push(gpii.test.couchdb.harness.constructDbCreationPromise(dbUrl));
                    }

                    // Load data if needed.
                    if ((!alreadyExists || shouldClean) && dbDef.data) {
                        fluid.log(fluid.logLevel.TRACE, "Queueing up data loading of database: ", dbUrl);
                        provisioningPromises.push(gpii.test.couchdb.harness.constructDataLoadingPromise(dbUrl, dbName, dbDef));
                    }

                    if (provisioningPromises.length > 0) {
                        // Perform whichever steps of the above we need to, in order.
                        var provisioningSequence = fluid.promise.sequence(provisioningPromises);

                        provisioningSequence.then(function () {
                            fluid.log(fluid.logLevel.TRACE, "Provisioning complete for database: ", dbUrl);
                        });

                        // Resolve our wrapper promise when our tasks are complete.
                        provisioningSequence.then(dbProvisioningPromise.resolve, dbProvisioningPromise.reject);
                    }
                    else {
                        fluid.log(fluid.logLevel.INFO, "No provisioning required for database: ", dbUrl);
                        dbProvisioningPromise.resolve("No provisioning required.");
                    }
                }
            });
        }
        catch (error) {
            dbProvisioningPromise.reject(error);
        }

        return dbProvisioningPromise;
    };
};

/**
 *
 * Construct a promise-returning function to delete an existing database.
 *
 * @param {String} dbUrl - The URL to the database's CouchDB API endpoint.
 * @return {Function} - A `fluid.promise` returning function.  The promise will be resolved when the existing database is deleted or rejected if an error occurs.
 *
 */
gpii.test.couchdb.harness.constructDbCleaningPromise = function (dbUrl) {
    return function () {
        var singleDbCleaningPromise = fluid.promise();
        fluid.log(fluid.logLevel.TRACE, "Deleting existing content for database: ", dbUrl);
        request["delete"](dbUrl, function (error, response) {
            if (error) {
                singleDbCleaningPromise.reject(error);
            }
            else if (response.statusCode !== 200) {
                singleDbCleaningPromise.reject("Response indicates an error removing the DB (" + response.statusCode + ").");
            }
            else {
                fluid.log(fluid.logLevel.TRACE, "Finished deleting existing content for database: ", dbUrl);
                singleDbCleaningPromise.resolve();
            }
        });
        return singleDbCleaningPromise;
    };
};

/**
 *
 * Construct a promise-returning function that will handle the creation of a single database.
 *
 * @param {String} dbUrl - The URL for the database.
 * @return {Function} - A `fluid.promise`-returning function.  The promise returned will be resolved when the database is created or rejected on error.
 *
 */
gpii.test.couchdb.harness.constructDbCreationPromise = function (dbUrl) {
    return function () {
        var dbCreationPromise = fluid.promise();

        fluid.log(fluid.logLevel.TRACE, "Starting creating database: ", dbUrl);
        request.put(dbUrl, function (error) {
            if (error) {
                dbCreationPromise.reject(error);
            }
            else {
                dbCreationPromise.resolve();
            }
            fluid.log(fluid.logLevel.TRACE, "Finished creating database: ", dbUrl);
        });

        return dbCreationPromise;
    };
};

/**
 *
 * Construct a promise-returning function that will handle the data loading for a single database.
 *
 * @param {String} dbUrl - The URL for the database.
 * @param {String} dbName - The name of the database.
 * @param {Object} dbDef - An object containing details about the database's data.
 * @return {Function} - A `fluid.promise`-returning function.  The promise returned will be resolved when the data is loaded or rejected on error.
 *
 */
gpii.test.couchdb.harness.constructDataLoadingPromise = function (dbUrl, dbName, dbDef) {
    return function () {
        var dataLoadingPromise = fluid.promise();

        var dbBulkDocsUri = dbUrl + "/_bulk_docs";
        var allData = { docs: [] };
        fluid.each(fluid.makeArray(dbDef.data), function (dataFilePath) {
            try {
                var resolvedPath = fluid.module.resolvePath(dataFilePath);
                var data = require(resolvedPath);
                var fileDocs = Array.isArray(data) ? data : fluid.get(data, "docs");
                if (fileDocs) {
                    allData.docs = allData.docs.concat(fileDocs);
                }
            }
            catch (error) {
                dataLoadingPromise.reject(error);
            }
        });

        if (!dataLoadingPromise.resolution) {
            var individualDbLoadingPromises = [];
            individualDbLoadingPromises.push(function () {
                var individualDataLoadingPromise = fluid.promise();
                fluid.log(fluid.logLevel.TRACE, "loading all data into database '"  + dbName + "'.");
                request.post({ uri: dbBulkDocsUri, body: allData, json: true, headers: { "Content-Type": "application/json" } }, function (error, response, body) {
                    if (error) { individualDataLoadingPromise.reject(error); }
                    else if ([200,201].indexOf(response.statusCode) === -1) {
                        individualDataLoadingPromise.reject(body);
                    }
                    else {
                        fluid.log(fluid.logLevel.TRACE, "Data loaded into database '"  + dbName + "'.");
                        individualDataLoadingPromise.resolve();
                    }
                });

                return individualDataLoadingPromise;
            });

            var dbLoadingSequence = fluid.promise.sequence(individualDbLoadingPromises);
            dbLoadingSequence.then(dataLoadingPromise.resolve, dataLoadingPromise.reject);
        }

        return dataLoadingPromise;
    };
};

/**
 *
 * Clear the "health check" monitoring interval and discontinue monitoring.
 *
 * @param {Object} that - The harness component.
 *
 */
gpii.test.couchdb.harness.clearTimeout = function (that) {
    if (that.monitorTimeout) {
        clearTimeout(that.monitorTimeout);
        that.monitorTimeout = false;
    }
};

/**
 *
 * Start monitoring the health of the associated docker container so that we can shut ourselves down if it fails to
 * start up or is stopped externally, for example by using a docker command.  Also serves to keep the component running
 * until it's either manually destroyed or until its associated CouchDB instance is brought down.
 *
 * @param {Object} that - The harness component.
 *
 */
gpii.test.couchdb.harness.startMonitoring = function (that) {
    if (that.options.monitorContainer) {
        that.monitorTimeout = setTimeout(
            that.monitorContainerOnce,
            that.options.containerMonitoringInterval
        );
    }
};

gpii.test.couchdb.harness.monitorContainerOnce = function (that) {
    var isUpPromise = that.worker.isUp();
    isUpPromise.then(
        function (isUp) {
            fluid.log(fluid.logLevel.TRACE, "Container " + isUp ? "is" : "is not" + " up.");

            if (!isUp) {
                that.events.onCouchMissing.fire();
            }

            // We use this pattern instead of setInterval to avoid piling up multiple checks.
            setTimeout(
                that.monitorContainerOnce,
                that.options.containerMonitoringInterval
            );
        },
        fluid.fail
    );
    return isUpPromise;
};

/**
 *
 * Construct a promise-returning function that will detect when a couch instance is ready to respond to requests.
 *
 * @param {Object} that - The harness component.
 * @return {Function} - A `fluid.promise`-returning function.  The promise returned will be resolved when couch is available or rejected if the instance doesn't respond in time.
 *
 */
gpii.test.couchdb.harness.constructCouchReadyPromise = function (that) {
    return function () {
        var couchReadyPromise = fluid.promise();
        var timeout = setTimeout( function () {
            if (!couchReadyPromise.disposition) {
                couchReadyPromise.reject("Couch startup timed out.");
            }
        }, that.options.couchSetupTimeout);
        var interval = setInterval(function () {
            request.get(that.options.couch.baseUrl, function (error, response) {
                if (!error && response.statusCode === 200) {
                    clearTimeout(timeout);
                    clearInterval(interval);
                    couchReadyPromise.resolve();
                }
                else {
                    fluid.log(fluid.logLevel.TRACE, "couch instance at '" + that.options.couch.baseUrl + "' not ready, waiting " + that.options.couchSetupCheckInterval + " ms and trying again.");
                }
            });
        }, that.options.couchSetupCheckInterval);

        return couchReadyPromise;
    };
};

fluid.defaults("gpii.test.couchdb.harness", {
    gradeNames: ["fluid.component"],
    cleanDbs: true,
    monitorContainer: false,
    shutdownContainer: false,
    removeContainer: false,
    containerMonitoringInterval: 500,
    couchSetupCheckInterval: 500,
    couchSetupTimeout: 10000,
    members: {
        monitorTimeout: false
    },
    databases: {
    },
    couch: {
        port:      25984,
        hostname:  "localhost",
        baseUrl:   "@expand:fluid.stringTemplate({that}.options.templates.couchBaseUrl, {that}.options.couch)",
        allDbsUrl: {
            expander: {
                funcName: "fluid.stringTemplate",
                args: ["{that}.options.templates.couchAllDbsUrl", { baseUrl: "{that}.options.couch.baseUrl"}]
            }
        }
    },
    templates: {
        couchBaseUrl:   "http://%hostname:%port",
        couchAllDbsUrl: "%baseUrl/_all_dbs",
        couchDbUrl:     "%baseUrl/%dbName"
    },
    events: {
        combinedDbSetup:          null,
        combinedShutdown:         null,
        combinedStartup:          null,
        onCouchMissing:           null,
        onDbProvisioningComplete: null,
        onShutdownComplete:       null,
        onStartupComplete:        null
    },
    invokers: {
        monitorContainerOnce: {
            funcName: "gpii.test.couchdb.harness.monitorContainerOnce",
            args:     ["{that}"]
        },
        provisionDbs: {
            funcName: "fluid.promise.fireTransformEvent",
            args:     ["{that}.events.combinedDbSetup", "{arguments}.0"] // forceClean
        },
        shutdown: {
            funcName: "fluid.promise.fireTransformEvent",
            args:     ["{that}.events.combinedShutdown"]
        },
        startup: {
            funcName: "fluid.promise.fireTransformEvent",
            args:     ["{that}.events.combinedStartup"]
        }
    },
    listeners: {
        "combinedDbSetup.provisionDbsIfNeeded": {
            priority: "first",
            funcName: "gpii.test.couchdb.harness.provisionDbsIfNeeded",
            args:     ["{that}", "{arguments}.0"] // forceClean
        },
        "combinedDbSetup.fireCleanupComplete": {
            priority: "last",
            func:     "{that}.events.onDbProvisioningComplete.fire"
        },
        "combinedStartup.isCouchUp": {
            priority: "first",
            funcName: "gpii.test.couchdb.checkCouchOnce",
            args:     ["{that}.options"]
        },
        "combinedStartup.startIfNeeded": {
            priority: "after:isCouchUp",
            funcName: "gpii.test.couchdb.harness.startIfNeeded",
            args:     ["{that}", "{arguments}.0"] // isCouchUp
        },
        "combinedStartup.isCouchUpAfterStartup": {
            priority: "after:startIfNeeded",
            funcName: "gpii.test.couchdb.checkCouchRepeatedly",
            args:     ["{that}.options"]
        },
        "combinedStartup.provisionDbs": {
            priority: "after:isCouchUpAfterStartup",
            func:     "{that}.provisionDbs",
            args:     []
        },
        "combinedStartup.startMonitoring": {
            priority: "after:provisionDbs",
            funcName: "gpii.test.couchdb.harness.startMonitoring",
            args:     ["{that}"]
        },
        "combinedStartup.fireEvent": {
            priority: "last",
            func:      "{that}.events.onStartupComplete.fire"
        },
        "combinedShutdown.clearTimeout": {
            priority: "first",
            funcName: "gpii.test.couchdb.harness.clearTimeout",
            args:     ["{that}"]
        },
        "combinedShutdown.shutdownIfNeeded": {
            priority: "after:clearTimeout",
            funcName: "gpii.test.couchdb.harness.shutdownIfNeeded",
            args:     ["{that}"]
        },
        "combinedShutdown.fireEvent": {
            priority: "last",
            func:     "{that}.events.onShutdownComplete.fire"
        },
        "onCouchMissing.clearTimeout": {
            funcName: "gpii.test.couchdb.harness.clearTimeout",
            args:     ["{that}"]
        }
    },
    components: {
        worker: {
            type: "gpii.test.couchdb.worker",
            options: {
                shutdownContainer: "{gpii.test.couchdb.harness}.options.shutdownContainer",
                removeContainer:   "{gpii.test.couchdb.harness}.options.removeContainer",
                couch:             "{gpii.test.couchdb.harness}.options.couch"
            }
        }
    }
});

fluid.defaults("gpii.test.couchdb.harness.persistent", {
    gradeNames: ["gpii.test.couchdb.harness"],
    cleanDbs: false
});
