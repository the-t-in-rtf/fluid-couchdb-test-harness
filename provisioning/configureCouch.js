/*

    A script to install CouchDB in a Windows VM.

 */
"use strict";
var fluid   = require("infusion");
var gpii    = fluid.registerNamespace("gpii");
var request = require("request");

fluid.registerNamespace("gpii.test.couchdb.configureCouch");

gpii.test.couchdb.configureCouch.executePutsInOrder = function (that) {
    var promises = [];
    fluid.each(that.options.putOptions, function (singlePutOptions) {
        promises.push(function () {
            var singlePutPromise = fluid.promise();
            request.put(singlePutOptions, function (error, response, body) {
                if (error) {
                    singlePutPromise.reject(body);
                }
                else if ([200, 201].indexOf(response.statusCode) === -1) {
                    singlePutPromise.reject(body);
                }
                else {
                    singlePutPromise.resolve(body);
                }
            });
            return singlePutPromise;
        });
    });

    var sequence = fluid.promise.sequence(promises);
    sequence.then(
        function () { fluid.log("All couch provisioning PUTs complete."); },
        function (error) { fluid.fail("ERROR provisioning Couch: ", error); }
    );
};

fluid.defaults("gpii.test.couchdb.configureCouch", {
    gradeNames: ["fluid.component"],
    putOptions: [
        //  Apparently these are not needed with the default Windows CouchDB installer.
        // { url: "http://localhost:5984/_global_changes" },
        // { url: "http://localhost:5984/_replicator" },
        // { url: "http://localhost:5984/_users" },
        {
            url: "http://localhost:5984/_node/couchdb@localhost/_config/chttpd/port",
            json: true,
            body: "25984"
        }
    ],
    listeners: {
        "onCreate.executePutsInOrder": {
            funcName: "gpii.test.couchdb.configureCouch.executePutsInOrder",
            args: ["{that}"]
        }
    }
});

gpii.test.couchdb.configureCouch();


