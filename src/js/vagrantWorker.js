"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.test.couchdb.worker.vagrant");

/**
 *
 * Parse the `--machine-readable` output of a Vagrant command (this is only tested with `vagrant status`). The raw
 * output looks something like:
 *
 * 1542968865,default,metadata,provider,virtualbox
 * 1542968865,default,provider-name,virtualbox
 * 1542968865,default,state,poweroff
 * 1542968865,default,state-human-short,poweroff
 * 1542968865,default,state-human-long,The VM is powered off. To restart the VM%!(VAGRANT_COMMA) simply run `vagrant up`
 * 1542968865,,ui,info,Current machine states:\n\n[...truncated for brevity..]
 *
 * The first two segments will be stripped from the output.  The last segment will be treated as the value, and the
 * preceding segments will be treated as the path to the value within a new object.  The above example would result in
 * output like the following:
 *
 * {
 *     metadata: { provider: "virtualbox" },
 *     state: "poweroff",
 *     state-human-short: "poweroff",
 *     state-human-long: "The VM is powered off. To restart the VM, simply run `vagrant up`",
 *     ui: { info: "Current machine states:\n\n[...truncated for brevity..]" }
 * }
 *
 * @param {String} rawOutput - The output of a Vagrant command run using the `--machine-readable` option.
 * @return {Object} - An object whose deep structure is as outlined above.
 *
 */
gpii.test.couchdb.worker.vagrant.parseVagrantOutput = function (rawOutput) {
    var entry = {};
    var lines = rawOutput.split("\n");
    fluid.each(lines, function (line) {
        if (line.length) {
            var segments = line.split(",").slice(2);
            var value = segments.pop().replace("%!(VAGRANT_COMMA)", ",");
            fluid.set(entry, segments, value);
        }
    });
    return entry;
};

/**
 *
 * Check the status of the associated vagrant VM.
 *
 * @param {Object} that - The worker component.
 * @return {Promise} - A `fluid.promise` that will resolve with `true` if our VM is running or `false` if the container is not running, or reject if an error occurs.
 *
 */
gpii.test.couchdb.worker.vagrant.isUp = function (that) {
    var isUpPromise = fluid.promise();

    var vagrantStatusPromise = gpii.test.couchdb.runCommandAsPromise(that.options.commandTemplates.vmStatus, that.options, "Checking Vagrant status.");
    vagrantStatusPromise.then(
        function (commandOutput) {
            var containerEntry = gpii.test.couchdb.worker.vagrant.parseVagrantOutput(commandOutput);
            if (fluid.get(containerEntry, "state") === "running") {
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

gpii.test.couchdb.worker.vagrant.startIfNeeded = function (that, isUp) {
    if (!isUp) {
        return gpii.test.couchdb.runCommandAsPromise(that.options.commandTemplates.startup, that.options, "Starting Vagrant VM.");
    }
};

fluid.defaults("gpii.test.couchdb.worker.vagrant", {
    gradeNames: ["gpii.test.couchdb.worker"],
    commandTemplates: {
        vmStatus: "vagrant status --machine-readable",
        startup:  "vagrant up",
        shutdown: "vagrant halt"
    },
    invokers: {
        isUp: {
            funcName: "gpii.test.couchdb.worker.vagrant.isUp",
            args:     ["{that}"]
        }
    },
    listeners: {
        "combinedShutdown.stopOrRemoveContainers": {
            priority: "after:listContainers",
            funcName: "gpii.test.couchdb.runCommandAsPromise",
            args:     ["{that}.options.commandTemplates.shutdown", "{that}.options", "Halting VM"]
        },
        "combinedShutdown.fireEvent": {
            func: "{that}.events.onShutdownComplete.fire"
        },
        "combinedStartup.isUp": {
            priority: "first",
            func:     "{that}.isUp"
        },
        "combinedStartup.startIfNeeded": {
            priority: "after:isUp",
            funcName: "gpii.test.couchdb.worker.vagrant.startIfNeeded",
            args:     ["{that}", "{arguments}.0"] // isUp
        },
        "combinedStartup.waitForCouch": {
            priority: "after:startIfNeeded",
            funcName: "gpii.test.couchdb.checkCouchOnce",
            args:     ["{that}.options"]
        },
        "combinedStartup.fireEvent": {
            priority: "last",
            func: "{that}.events.onStartupComplete.fire"
        }
    }
});
