"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

var readline = require("readline");
var stream   = require("stream");

require("../../");

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
 * @return {Promise} - A `fluid.promise` that will be resolved with the output or rejected on error.
 *
 */
gpii.test.couchdb.worker.vagrant.parseVagrantOutput = function (rawOutput) {
    var parsePromise = fluid.promise();

    // http://stackoverflow.com/questions/16038705/how-to-wrap-a-buffer-as-a-stream2-readable-stream
    var bufferStream = new stream.PassThrough();
    bufferStream.end(rawOutput);

    var rl = readline.createInterface({
        input: bufferStream
    });

    var entry = {};

    rl.on("line", function (line) {
        if (line.length) {
            var segments = line.split(",").slice(2);
            var value = segments.pop().replace("%!(VAGRANT_COMMA)", ",");
            fluid.set(entry, segments, value);
        }
    });

    rl.on("close", function () {
        parsePromise.resolve(entry);
    });

    rl.on("error", function (error) {
        parsePromise.reject(error);
    });

    return parsePromise;
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

    var vagrantStatusPromise = gpii.test.couchdb.runCommandAsPromise(that.options.commandTemplates.vmStatus, that.options, "Checking Vagrant status.", that.options);
    vagrantStatusPromise.then(
        function (commandOutput) {
            gpii.test.couchdb.worker.vagrant.parseVagrantOutput(commandOutput).then(
                function (containerEntry) {
                    if (fluid.get(containerEntry, "state") === "running") {
                        isUpPromise.resolve(true);
                    }
                    else {
                        isUpPromise.resolve(false);
                    }
                },
                isUpPromise.reject
            );
        },
        isUpPromise.reject
    );

    return isUpPromise;
};

gpii.test.couchdb.worker.vagrant.startIfNeeded = function (that, isUp) {
    if (!isUp) {
        return gpii.test.couchdb.runCommandAsPromise(that.options.commandTemplates.startup, that.options, "Starting Vagrant VM.", that.options);
    }
};

fluid.defaults("gpii.test.couchdb.worker.vagrant", {
    gradeNames: ["gpii.test.couchdb.worker"],
    cwd: "@expand:fluid.module.resolvePath({that}.options.cwdPath)",
    cwdPath: "%gpii-couchdb-test-harness/src/test",
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
            args:     ["{that}.options.commandTemplates.shutdown", "{that}.options", "Halting VM", "{that}.options"]
        },
        "combinedShutdown.fireEvent": {
            func: "{that}.events.onShutdownComplete.fire"
        },
        "combinedStartup.log": {
            priority: "first",
            funcName: "fluid.log",
            args:     ["Running using 'vagrant' worker."]
        },
        "combinedStartup.isUp": {
            priority: "after:log",
            func:     "{that}.isUp"
        },
        "combinedStartup.startIfNeeded": {
            priority: "after:isUp",
            funcName: "gpii.test.couchdb.worker.vagrant.startIfNeeded",
            args:     ["{that}", "{arguments}.0"] // isUp
        },
        "combinedStartup.waitForCouch": {
            priority: "after:startIfNeeded",
            funcName: "gpii.test.couchdb.checkUrlOnce",
            args:     ["{that}.options"]
        },
        "combinedStartup.fireEvent": {
            priority: "last",
            func: "{that}.events.onStartupComplete.fire"
        }
    }
});

fluid.defaults("gpii.test.couchdb.lucene.worker.vagrant", {
    gradeNames: ["gpii.test.couchdb.worker"],
    listeners: {
        "onCreate.explode": {
            funcName: "fluid.fail",
            args: ["The lucene test harness can only be used with Docker."]
        }
    }
});
