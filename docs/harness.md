## `gpii.test.couchdb.harness`

The CouchDB harness provided by this package:

1. Checks for the existence of a current CouchDB instance listening on the configured hostname and port.
2. Creates an appropriate worker to manage the CouchDB instance (see [the worker docs](./worker.md) for details).
3. If the harness is configured to do so, it will clear and reload any configured data sets on startup.
4. When all of the above startup checks are complete, the harness will fire an event to indicate that it is ready to
   respond to requests.

### Component Options

| Option                        | Type        | Description |
| ----------------------------- | ----------- | ----------- |
| `cleanDbs`                    | `{Boolean}` | Whether to remove CouchDB data when the database is provisioned. Defaults to `true`. |
| `containerMonitoringInterval` | `{Integer}` | This component will shut itself down if its associated Docker container dies or is stopped.  This setting controls how often (in milliseconds) to check to see if the container is up.  Defaults to `1000`, or one second. |
| `couch.allDbsUrl`             | `{String}`  | The URL on which the `_all_dbs` REST API endpoint for CouchDB can be reached.  Expanded from the baseUrl by default. |
| `couch.baseUrl`               | `{String}`  | The URL on which CouchDB can be reached.  Expanded from the hostname and port by default. |
| `couch.hostname`              | `{String}`  | The hostname CouchDB is expected to be running on. Defaults to `localhost`. |
| `couch.port`                  | `{Integer}` | The port CouchDB is expected to be running on. Defaults to `25984`. |
| `couchSetupCheckInterval`     | `{Integer}` | If we have to create a new container, we have to wait until Couch is responding to requests.  This setting controls how often (in milliseconds) to check to see if CouchDB is up. Defaults to `250`. |
| `couchSetupTimeout`           | `{Integer}` | How long (in milliseconds) to wait for the above health checks to complete before triggering a failure. Defaults to `5000`, or 5 seconds. |
| `databases`                   | `{Array}`   | A map of databases and data files to provision them with.  See below. |
| `monitorContainer`            | `{Boolean}` | Whether or not to monitor the worker's container.  Can be used to keep the process alive, but set to `false` by default. |
| `shutdownContainer`           | `{Boolean}` | Whether or not to shut down the container when the harness is shut down.  Set to `false` by default, i. e. the same container is reused without restarting between runs. |
| `removeContainer`             | `{Boolean}` | Whether or not to remove the container on harness shutdown. Set to `false` by default. |
| `templates.couchBaseUrl`      | `{String}`  | A template that (along with our options) will be passed to `fluid.stringTemplate` when expanding the `couch.baseUrl` setting. |
| `templates.couchAllDbsUrl`    | `{String}`  | A template that (along with our options) will be passed to `fluid.stringTemplate` when expanding the `couch.allDbsUrl` setting. |
| `templates.couchDbUrl`        | `{String}`  | A template that (along with our options) will be passed to `fluid.stringTemplate` when attempting to access individual databases. |

### The `databases` Option

If the container does not exist or `cleanOnStartup` is set to true, the Docker container associated with this component
will be provisioned with databases and content based on the contents of `options.databases`, as shown in this example:

```javascript
var fluid = require("infusion");
var my = fluid.registerNamespace("my");

require("my-package");
require("my-other-package");

fluid.defaults("my.harness", {
    gradeNames: ["gpii.test.couchdb.harness"],
    databases: {
        singleFile: {
            data: "%my-package/tests/data/onePayload.json"
        },
        lotsOfFiles: {
            data: [
                "%my-package/tests/data/onePayload.json",
                "%my-other-package/tests/data/otherPayload.json"
            ]
        },
        empty: {}
    }
});
```

Each file is expected to be a valid payload that can be used with the [CouchDB bulk document
API](http://docs.couchdb.org/en/2.2.0/api/database/bulk-api.html#db-bulk-docs), something like:

```json
{
    "docs": [
        {
            "_id": "id1",
            "key": "value"
        },
        {
            "_id": "id2",
            "other-key": "other value"
        }
    ]
}
```

### Component Invokers

#### `{that}.startup()`

This invoker triggers the complex ["promise chaining event"](https://docs.fluidproject.org/infusion/development/PromisesAPI.html#fluidpromisefiretransformeventevent-payload-options)
`combinedStartup`.  By default:

1. The harness checks to see if CouchDB is already available.
2. If not, the appropriate container manager is created and populated if necessary (see above for options).
3. The `onStartupComplete` event is fired.

You can add your own shutdown steps using additional event listeners.  For more details, see the "Promise Chaining
Events" section below.

#### `{that}.provisionDbs()`

This invoker allows you to trigger a manual reset of all data.  You can also fire the `onCleanup` event to call this
invoker.

This invoker triggers the complex ["promise chaining event"](https://docs.fluidproject.org/infusion/development/PromisesAPI.html#fluidpromisefiretransformeventevent-payload-options)
`combinedCleanup`.  By default:

1. All databases that are not listed in `options.couchDbsToPreserve` will be removed.
2. Any databases listed in `options.databases` will be created and any associated data will be loaded.
3. When the reset is complete, the `onCleanupComplete` event is fired.  

You can add your own cleanup steps using additional event listeners.  For more details, see the "Promise Chaining
Events" section below.

#### `{that}.shutdown()`

This invoker triggers the complex ["promise chaining event"](https://docs.fluidproject.org/infusion/development/PromisesAPI.html#fluidpromisefiretransformeventevent-payload-options)
`combinedShutdown`.  By default:

1. The container manager is instructed to shut down its associated container.
2. When the container is shut down, the `onShutdownComplete` event is fired.

You can add your own shutdown steps using additional event listeners.  For more details, see the "Promise Chaining
Events" section below.

### `gpii.test.couchdb.harness.persistent`

This is a convenience grade that matches the previous grade structure of this package. It is identical to
`gpii.test.couchdb.harness` but has `options.cleanOnStartup` set to `false`.  If you use this grade and need to reset the data,
you must manually call `{that}.provisionDbs()` (see above).

### Promise Chaining Events

The `combinedStartup`, `combinedDbSetup`, and `combinedShutdown` events are ["promise chaining
events"](https://docs.fluidproject.org/infusion/development/PromisesAPI.html#fluidpromisefiretransformeventevent-payload-options).
These chains consist of a prioritised list of listeners.  In this package, each of these listeners calls a function
that either returns a promise, or a promise-returning function.  Each step in the chain is only executed when the
preceding link either returns a literal value, or when the promise associated with the previous step in the chain is
resolved.  If any link in the chain is rejected, the chain does not continue execution further.

To give a practical example, let's assume that we are working with a CouchDB view that must be indexed the first time
it is retrieved, and that we want to ourselves retrieve the view to ensure that no end user has to wait for the
indexing to occur.  We might use code like the following to accomplish this:

```javascript
/*

        You can find all steps in the chain in ./src/js/harness.js, for our purposes we want to execute after this step:

        "combinedStartup.startIfNeeded": {
            priority: "first",
            funcName: "gpii.test.couchdb.harness.startIfNeeded",
            args:     ["{that}"]
        },

 */
var fluid = require("infusion");
var my    = fluid.registerNamespace("my");

fluid.require("%my-package");

var request = require("request");

fluid.registerNamespace("my.custom.harness");

my.custom.harness.indexView = function (that) {
    var indexingPromise = fluid.promise();
    try {
        var viewUrl = fluid.stringTemplate(that.options.templates.viewUrl, that.options);
        request.get(viewUrl, function (requestError, response, body) {
            if (requestError) {
                indexingPromise.resolve(requestError);
            }
            else if (response.status !== 200) {
                indexingPromise.resolve(body);
            }
            else {
                indexingPromise.resolve(body);
            }
        });
    }
    // Low level error such as undefined template.
    catch (error) {
        indexingPromise.resolve(error);
    }
    return indexingPromise;
};

fluid.defaults("my.custom.harness", {
    gradeNames: ["gpii.test.couchdb.harness"],
    templates: {
        viewUrl: "%couch.baseUrl/mydb/_design/docName/_view/viewName",
    },
    databases: {
        mydb: {
            data: "%my-package/tests/data/views.json"
        }
    },
    listeners: {
        "combinedStartup.indexView": {
            priority: "after:startIfNeeded",
            funcName: "my.custom.harness.indexView",
            args: ["{that}"]
        },
        "combinedStartup.logIndexResults": {
            priority: "after:indexView",
            funcName: "fluid.log",
            args:     ["Index results:", "{arguments}.0"]
        }
    }
});

my.custom.harness();
```

Our custom harness will now try to access our view once the Docker container is available.  In this case we don't wish
to block startup, so whether there is an error or a successful view retrieval, the associated promise will be resolved.
The next step we've added in the chain will simply log the results.  Because `fluid.log` immediately returns, execution
will immediately continue to the next link in the startup chain.  This illustrates how you can mix asynchronous and
synchronous functions in a "chained promise event".

## Running a Standalone Instance of the Harness

The file `tests/js/launch-test-harness.js` included with this package can be used to launch a standalone test instance
of this package for manual QA. You can use this launcher using a command like:

`node tests/js/launch-test-harness.js`

Run the command with the `--help` argument to see a list of configurable options.

## Using the Harness in Fluid IoC Tests

See the [test fixtures documentation.](test-fixtures.md)

