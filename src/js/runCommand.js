"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var exec  = require("child_process").exec;

fluid.registerNamespace("gpii.test.couchdb");

gpii.test.couchdb.defaultCommandOptions = {
    cwd: fluid.module.resolvePath("%gpii-couchdb-test-harness")
};

/**
 *
 * Unsupported, non-API function.
 *
 * Run a command and then execute a callback.  NOTE:  This function is only intended for intervals and other edge cases.
 * Please use `gpii.test.couchdb.harness.runCommandAsPromise` instead.
 *
 * @param {String} commandTemplate - A template representing the command to be run.  Along with `that.options`, will be passed to `fluid.stringTemplate`.
 * @param {Object} commandPayload - The data to use to resolve variables in the template.
 * @param {Function} callback - A callback with the signature (error, stdout, stderr) that will be called after the command executes.
 * @param {String} [message] - An optional message that will be logged if present.
 * @param {Object} [commandOptions] - Optional options (cwd, etc.) to use when running commands.
 *
 */
gpii.test.couchdb.runCommand = function (commandTemplate, commandPayload, callback, message, commandOptions) {
    var mergedCommandOptions = fluid.extend({}, gpii.test.couchdb.defaultCommandOptions, commandOptions);
    if (message) {
        fluid.log(message);
    }

    var command = fluid.stringTemplate(
        commandTemplate,
        commandPayload
    );
    exec(command, mergedCommandOptions, callback);
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
gpii.test.couchdb.runCommandAsPromise = function (commandTemplate, commandPayload, message, commandOptions) {
    var commandPromise = fluid.promise();

    try {
        gpii.test.couchdb.runCommand(commandTemplate, commandPayload, function (error, stdout) {
            if (error) {
                commandPromise.reject(error);
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
