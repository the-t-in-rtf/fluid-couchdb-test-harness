"use strict";
var fluid = require("infusion");

var request = require("request");

require("./checkUrl");
require("./worker");

fluid.registerNamespace("fluid.test.couchdb.harness");

/**
 *
 * If the worker is not already "up", start it.
 *
 * @param {Object} worker - The worker to start.
 * @param {Boolean} isWorkerUp - Whether or not the worker is already "up" (returned by an earlier step in the promise chain).
 * @return {Promise} - A `fluid.promise` that will be resolved when the container is available or rejected if an error occurs.
 *
 */
fluid.test.couchdb.harness.startIfNeeded = function (worker, isWorkerUp) {
    var startPromise = fluid.promise();
    // If our worker has already been destroyed, startup is not needed.
    if (fluid.isDestroyed(worker)) {
        startPromise.reject("Our worker has been destroyed, aborting startup.");
    }
    else {
        if (isWorkerUp) {
            startPromise.resolve("CouchDB is already running, no need to start it.");
        }
        else {
            var innerStartPromise = worker.startup();
            innerStartPromise.then(startPromise.resolve, startPromise.reject);
        }
    }
    return startPromise;
};

/**
 *
 * If we are configured to shut down the associated container on shutdown, do so.
 *
 * @param {Object} worker - The harness component.
 * @return {Promise} - A `fluid.promise` that will be resolved once shutdown is complete (or skipped), or rejected on an error.
 *
 */
fluid.test.couchdb.harness.shutdownIfNeeded = function (worker) {
    if (worker.options.shutdownContainer) {
        return worker.shutdown();
    }
    else {
        var promise = fluid.promise();
        promise.resolve("We are not configured to shut down the associated worker, skipping shutdown.");
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
fluid.test.couchdb.harness.provisionDbsIfNeeded = function (that, forceClean) {
    var provisioningPromiseMap = fluid.transform(that.options.databases, function (dbDef, dbName) {
        return fluid.test.couchdb.harness.provisionSingleDbIfNeeded(that, dbDef, dbName, forceClean);
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
fluid.test.couchdb.harness.provisionSingleDbIfNeeded = function (that, dbDef, dbName, forceClean) {
    return function () {
        var dbProvisioningPromise = fluid.promise();
        try {
            var dbUrl = fluid.stringTemplate(
                that.options.templates.adminBaseUrl,
                {
                    username: that.couchWorker.options.username,
                    password: that.couchWorker.options.password,
                    couchUrl: that.couchWorker.options.baseUrl,
                    dbName:   dbName
                }
            );

            // TODO: Once we only support CouchDB 2.2 or higher, we can get metadata for all endpoints at once:
            // See: http://docs.couchdb.org/en/stable/api/server/common.html#post--_dbs_info
            fluid.log(fluid.logLevel.TRACE, "Requesting metadata for database: ", dbUrl);
            request.get(dbUrl, function (error, response, body) {
                if (error) {
                    dbProvisioningPromise.reject(error);
                }
                else if ([200, 404].indexOf(response.statusCode) === -1) {
                    dbProvisioningPromise.reject(body);
                }
                else {
                    var provisioningPromises = [];

                    var alreadyExists = response.statusCode !== 404;
                    var shouldClean = (that.options.cleanDbs || forceClean);

                    // Delete the existing data if needed.
                    if (alreadyExists && shouldClean) {
                        fluid.log(fluid.logLevel.TRACE, "Queueing up deletion of existing database: ", dbUrl);
                        provisioningPromises.push(fluid.test.couchdb.harness.constructDbCleaningPromise(dbUrl));
                    }

                    // Create the database if needed.
                    if (shouldClean || !alreadyExists) {
                        fluid.log(fluid.logLevel.TRACE, "Queueing up creation of database: ", dbUrl);
                        provisioningPromises.push(fluid.test.couchdb.harness.constructDbCreationPromise(dbUrl));
                    }

                    // Load data if needed.
                    if ((!alreadyExists || shouldClean) && dbDef.data) {
                        fluid.log(fluid.logLevel.TRACE, "Queueing up data loading of database: ", dbUrl);
                        provisioningPromises.push(fluid.test.couchdb.harness.constructDataLoadingPromise(dbUrl, dbName, dbDef));
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
fluid.test.couchdb.harness.constructDbCleaningPromise = function (dbUrl) {
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

                // Delay resolving the promise to give CouchDB enough time to actually be ready to recreate it.
                setTimeout(singleDbCleaningPromise.resolve, 64);
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
fluid.test.couchdb.harness.constructDbCreationPromise = function (dbUrl) {
    return function () {
        var dbCreationPromise = fluid.promise();

        fluid.log(fluid.logLevel.TRACE, "Starting creating database: ", dbUrl);
        request.put(dbUrl, function (error, response, body) {
            if (error) {
                dbCreationPromise.reject(error);
            }
            else if ([200,201].indexOf(response.statusCode) === -1) {
                dbCreationPromise.reject(body);
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
fluid.test.couchdb.harness.constructDataLoadingPromise = function (dbUrl, dbName, dbDef) {
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

fluid.defaults("fluid.test.couchdb.harness", {
    gradeNames: ["fluid.component"],
    cleanDbs: true,
    shutdownContainers: false,
    removeContainers: false,
    couch: {
        port: 25984,
        hostname: "localhost"
    },
    templates: {
        dbUrl: "%couchUrl/%dbName"
    },
    databases: {
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
            funcName: "fluid.test.couchdb.harness.provisionDbsIfNeeded",
            args:     ["{that}", "{arguments}.0"] // forceClean
        },
        "combinedDbSetup.fireCleanupComplete": {
            priority: "last",
            func:     "{that}.events.onDbProvisioningComplete.fire"
        },
        "combinedStartup.isCouchUp": {
            priority: "first",
            // TODO: Update to use {fluid.test.couchdb.worker.couch}.isUp once potentia ii is merged.
            func: "{harness}.couchWorker.isUp"
        },
        "combinedStartup.startCouchIfNeeded": {
            priority: "after:isCouchUp",
            funcName: "fluid.test.couchdb.harness.startIfNeeded",
            // TODO: Update to use {fluid.test.couchdb.worker.couch} once potentia ii is merged.
            args:     ["{harness}.couchWorker", "{arguments}.0"] // worker, isWorkerUp
        },
        "combinedStartup.isCouchReady": {
            priority: "after:startCouchIfNeeded",
            // TODO: Update to use {fluid.test.couchdb.worker.couch}.isReady once potentia ii is merged.
            func:     "{harness}.couchWorker.isReady"
        },
        "combinedStartup.provisionDbs": {
            priority: "after:isCouchReady",
            func:     "{that}.provisionDbs",
            args:     []
        },
        "combinedStartup.fireEvent": {
            priority: "last",
            func:      "{that}.events.onStartupComplete.fire"
        },
        "combinedShutdown.shutdownCouchIfNeeded": {
            priority: "before:fireEvent",
            funcName: "fluid.test.couchdb.harness.shutdownIfNeeded",
            // TODO: Update to use {fluid.test.couchdb.worker.couch} once potentia ii is merged.
            args:     ["{harness}.couchWorker"]
        },
        "combinedShutdown.fireEvent": {
            priority: "last",
            func:     "{that}.events.onShutdownComplete.fire"
        }
    },
    components: {
        couchWorker: {
            type: "fluid.test.couchdb.worker.couch",
            options: {
                shutdownContainer: "{fluid.test.couchdb.harness}.options.shutdownContainers",
                removeContainer:   "{fluid.test.couchdb.harness}.options.removeContainers",
                port:              "{fluid.test.couchdb.harness}.options.couch.port",
                hostname:          "{fluid.test.couchdb.harness}.options.couch.hostname"
            }
        }
    }
});

fluid.defaults("fluid.test.couchdb.harness.persistent", {
    gradeNames: ["fluid.test.couchdb.harness"],
    cleanDbs: false
});

fluid.registerNamespace("fluid.test.couchdb.harness.lucene");
fluid.test.couchdb.harness.lucene.registerCouchContainerName = function (luceneWorker, couchWorker) {
    luceneWorker.couchContainerName = couchWorker.containerName;
};

fluid.defaults("fluid.test.couchdb.harness.lucene", {
    gradeNames: ["fluid.test.couchdb.harness"],
    lucene: {
        hostname: "localhost",
        port: 25985
    },
    listeners: {
        "combinedStartup.registerCouchContainerName": {
            priority: "after:provisionDbs",
            funcName: "fluid.test.couchdb.harness.lucene.registerCouchContainerName",
            // TODO: Update to use {fluid.test.couchdb.worker.lucene} and {fluid.test.couchdb.worker.couch} once potentia ii is merged.
            args: ["{harness}.luceneWorker", "{harness}.couchWorker"] // luceneWorker, couchWorker
        },
        "combinedStartup.isLuceneUp": {
            priority: "after:registerCouchContainerName",
            // TODO: Update to use {fluid.test.couchdb.worker.lucene}.isUp once potentia ii is merged.
            func: "{harness}.luceneWorker.isUp"
        },
        "combinedStartup.startLuceneIfNeeded": {
            priority: "after:isLuceneUp",
            funcName: "fluid.test.couchdb.harness.startIfNeeded",
            // TODO: Update to use {fluid.test.couchdb.worker.lucene} once potentia ii is merged.
            args:     ["{harness}.luceneWorker", "{arguments}.0"] // worker, isWorkerUp
        },
        "combinedStartup.isLuceneReady": {
            priority: "after:startLuceneIfNeeded",
            // TODO: Update to use {fluid.test.couchdb.worker.lucene}.isReady once potentia ii is merged.
            func:     "{harness}.luceneWorker.isReady"
        },
        "combinedShutdown.shutdownLuceneIfNeeded": {
            priority: "before:shutdownCouchIfNeeded",
            funcName: "fluid.test.couchdb.harness.shutdownIfNeeded",
            // TODO: Update to use {fluid.test.couchdb.worker.lucene} once potentia ii is merged.
            args:     ["{harness}.luceneWorker"]
        }
    },
    components: {
        luceneWorker: {
            type: "fluid.test.couchdb.worker.lucene",
            options: {
                shutdownContainer:  "{fluid.test.couchdb.harness}.options.shutdownContainers",
                removeContainer:    "{fluid.test.couchdb.harness}.options.removeContainers",
                port:               "{fluid.test.couchdb.harness}.options.lucene.port",
                hostname:           "{fluid.test.couchdb.harness}.options.lucene.hostname"
            }
        }
    }
});
