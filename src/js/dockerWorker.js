"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.test.couchdb.worker.docker");

require("./runCommand");
require("./checkUrl");

/**
 *
 * Check to see if there is a container with our label that is running.
 *
 * @param {Object} that - The docker worker component.
 * @return {Promise} - A `fluid.promise` that will be resolved with `true` if a container is running, resolved with `false` if no container is running, or rejected if there is an error checking the container status.
 *
 */
gpii.test.couchdb.worker.docker.isContainerUp = function (that) {
    var isUpPromise = fluid.promise();

    var containerListPromise = that.listContainers();
    containerListPromise.then(
        function (containerListOutput) {
            var containerEntries = gpii.test.couchdb.worker.docker.parseDockerOutput(containerListOutput);
            var runningContainer = fluid.find(containerEntries, function (containerEntry) {
                return containerEntry.Status.indexOf("Up") === 0 ? containerEntry : undefined;
            });
            if (runningContainer) {
                that.containerName = runningContainer.Names;
                isUpPromise.resolve(true);
            }
            else {
                isUpPromise.resolve(false);
            }
        },
        isUpPromise.reject
    );

    return isUpPromise;
};

gpii.test.couchdb.worker.docker.parseDockerOutput = function (rawOutput) {
    var individualOutputLines = rawOutput.trim().split("\n");
    var containerEntries = [];
    fluid.each(individualOutputLines, function (individualOutputLine) {
        if (individualOutputLine.length) {
            containerEntries.push(JSON.parse(individualOutputLine));
        }
    });
    return containerEntries;
};

gpii.test.couchdb.worker.docker.startIfNeeded = function (that, containerIsUp) {
    var outerStartupPromise = fluid.promise();

    if (containerIsUp) {
        fluid.log("Container already running, worker does not need to start anything.");
        outerStartupPromise.resolve("Container already running.");
    }
    else {
        var containerCreationPromise = gpii.test.couchdb.runCommandAsPromise(that.options.commandTemplates.createContainer, that);
        containerCreationPromise.then(outerStartupPromise.resolve, outerStartupPromise.reject);
    }

    return outerStartupPromise;
};

/**
 *
 * During shutdown, look at how aggressively we're meant to manage our containers, and based on that, either:
 *
 * 1. Do nothing.
 * 2. Stop the containers.
 * 3. Remove the containers.
 *
 * @param {Object} that - The Docker worker component.
 * @param {String} listContainerOutput - The results of a previous "list containers" command.
 * @return {Promise} - A `fluid.promise` that will resolve when our part of shutdown is complete, or reject on an error.
 *
 */
gpii.test.couchdb.worker.docker.stopOrRemoveContainers = function (that, listContainerOutput) {
    var containerShutdownPromises = [];

    var containerData = gpii.test.couchdb.worker.docker.parseDockerOutput(listContainerOutput);
    fluid.each(containerData, function (containerEntry) {
        var containerId = containerEntry.ID;
        if (that.options.removeContainer || that.options.shutdownContainer) {
            var commandTemplate = that.options.removeContainer ? that.options.commandTemplates.removeContainer : that.options.commandTemplates.stopContainer;
            containerShutdownPromises.push(function () {
                return gpii.test.couchdb.runCommandAsPromise(commandTemplate, { containerId: containerId });
            });
        }
    });

    return fluid.promise.sequence(containerShutdownPromises);
};

fluid.defaults("gpii.test.couchdb.worker.docker", {
    gradeNames: ["fluid.component"],
    containerLabel: "gpii-couchdb-test-harness",
    members: {
        containerName: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["gpii-couchdb-test-harness-%id", { id: "{that}.id" }]
            }
        }
    },
    commandTemplates: {
        listContainers:  "docker ps -a --filter label=%options.containerLabel --format '{{ json . }}'",
        createContainer: "docker run -d -l %options.containerLabel -p %options.port:5984 --name %containerName couchdb:2.3.1",
        startContainer:  "docker start %containerId",
        removeContainer: "docker rm -f %containerId",
        stopContainer:   "docker stop %containerId"
    },
    invokers: {
        isUp: {
            funcName: "gpii.test.couchdb.worker.docker.isContainerUp",
            args:     ["{that}"]
        },
        listContainers: {
            funcName: "gpii.test.couchdb.runCommandAsPromise",
            args: [
                "{that}.options.commandTemplates.listContainers",
                "{that}",
                "Retrieving list of docker containers."
            ]
        }
    },
    listeners: {
        "combinedShutdown.listContainers": {
            priority: "first",
            func:     "{that}.listContainers"
        },
        "combinedShutdown.stopOrRemoveContainers": {
            priority: "after:listContainers",
            funcName: "gpii.test.couchdb.worker.docker.stopOrRemoveContainers",
            args:     ["{that}", "{arguments}.0"] // listContainerOutput
        },
        "combinedShutdown.fireEvent": {
            func: "{that}.events.onShutdownComplete.fire"
        },
        "combinedStartup.log": {
            priority: "first",
            funcName: "fluid.log",
            args:     ["Running using 'docker' worker."]
        },
        "combinedStartup.isUp": {
            priority: "after:log",
            func:     "{that}.isUp"
        },
        "combinedStartup.startIfNeeded": {
            priority: "after:isUp",
            funcName: "gpii.test.couchdb.worker.docker.startIfNeeded",
            args:     ["{that}", "{arguments}.0"] // isUp
        },
        "combinedStartup.fireEvent": {
            priority: "last",
            func: "{that}.events.onStartupComplete.fire"
        }
    }
});

fluid.defaults("gpii.test.couchdb.lucene.worker.docker", {
    gradeNames: ["gpii.test.couchdb.worker.docker"],
    containerLabel: "gpii-couchdb-lucene-test-harness",
    members: {
        containerName: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["gpii-couchdb-lucene-test-harness-%id", { id: "{that}.id" }]
            }
        },
        couchContainerName: ""
    },
    commandTemplates: {
        listContainers:  "docker ps -a --filter label=%options.containerLabel --format '{{ json . }}'",
        createContainer: "docker run -d -l %options.containerLabel -p %options.port:5985 --link %couchContainerName:couchdb --name %containerName klaemo/couchdb-lucene:2.1.0"
    }
});
