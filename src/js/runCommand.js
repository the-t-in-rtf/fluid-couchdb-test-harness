"use strict";
var fluid = require("infusion");
var exec  = require("child_process").exec;

fluid.registerNamespace("fluid.test.couchdb");

fluid.test.couchdb.defaultCommandOptions = {
    cwd: fluid.module.resolvePath("%fluid-couchdb-test-harness")
};

/**
 *
 * Unsupported, non-API function.
 *
 * Run a command and then execute a callback.  NOTE:  This function is only intended for intervals and other edge cases.
 * Please use `fluid.test.couchdb.harness.runCommandAsPromise` instead.
 *
 * @param {String} commandTemplate - A template representing the command to be run.  Along with `that.options`, will be passed to `fluid.stringTemplate`.
 * @param {Object} commandPayload - The data to use to resolve variables in the template.
 * @param {Function} callback - A callback with the signature (error, stdout, stderr) that will be called after the command executes.
 * @param {String} [message] - An optional message that will be logged if present.
 * @param {Object} [commandOptions] - Optional options (cwd, etc.) to use when running commands.
 *
 */
fluid.test.couchdb.runCommand = function (commandTemplate, commandPayload, callback, message, commandOptions) {
    var mergedCommandOptions = fluid.extend({}, fluid.test.couchdb.defaultCommandOptions, commandOptions);
    var filteredCommandOptions = fluid.filterKeys(mergedCommandOptions, [
        "cwd", "env", "encoding", "shell", "timeout", "maxBuffer", "killSignal", "uid", "gid", "windowsHide"
    ]);
    if (message) {
        fluid.log(fluid.logLevel.TRACE, message);
    }

    var command = fluid.stringTemplate(
        commandTemplate,
        commandPayload
    );
    exec(command, filteredCommandOptions, callback);
};

/**
 *
 * Run a command and resolve/reject a promise when the results are known..
 *
 * @param {String} commandTemplate - A template representing the command to be run.  Along with `that.options`, will be passed to `fluid.stringTemplate`.
 * @param {Object} commandPayload - The data to use to resolve variables in the template.
 * @param {String} [message] - An optional message that will be logged if present.
 * @param {Object} [commandOptions] - Optional options (cwd, etc.) to use when running commands.
 * @return {Promise} A `fluid.promise` instance that will be resolved when the command completes successfully or rejected if there's an error.
 *
 */
fluid.test.couchdb.runCommandAsPromise = function (commandTemplate, commandPayload, message, commandOptions) {
    var commandPromise = fluid.promise();

    try {
        fluid.test.couchdb.runCommand(commandTemplate, commandPayload, function (error, stdout) {
            if (error) {
                // Neither the "message" or "stack" property of the error survive the eventual trip
                // through JSON.stringify, so we need to manually shove the output of toString into a
                // combined error payload so that the root cause of an error is included in the logs.
                commandPromise.reject(fluid.extend(error, { message: error.toString() }));
            }
            else {
                commandPromise.resolve(stdout);
            }
        }, message, commandOptions);
    }
    // Low-level errors like an `undefined` command template.
    catch (execError) {
        commandPromise.reject(execError);
    }

    return commandPromise;
};
