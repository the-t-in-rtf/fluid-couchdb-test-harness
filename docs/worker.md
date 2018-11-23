# `gpii.test.couchdb.worker`

The worker is [Context Aware](https://docs.fluidproject.org/infusion/development/ContextAwareness.html), meaning that it
brings in an appropriate implementation grade based on your settings.

If `GPII_TEST_COUCH_USE_VAGRANT` is set, the Vagrant worker will be used.  Otherwise, the Docker worker will be used by
default.

## Component Options

| Option                    | Type        | Description |
| ------------------------- | ----------- | ----------- |
| `couch.port`              | `{Integer}` | The port our CouchDB instance will listen on.  Defaults to `25984` |
| `couchSetupCheckInterval` | `{Integer}` | How often (in milliseconds to check to see if CouchDB is available. Defaults to 250 milliseconds. |
| `couchSetupTimeout`       | `{Integer}` | How long to wait before giving up on the CouchDB startup and reporting and error.  Defaults to 5000 milliseconds (5 seconds). |

## Component Invokers

### `{that}.startup()`

* Returns: A `fluid.promise` that will resolve once startup is complete or reject if an error occurs.

This invoker triggers the complex ["promise chaining event"](https://docs.fluidproject.org/infusion/development/PromisesAPI.html#fluidpromisefiretransformeventevent-payload-options)
`combinedStartup`.  Each implementation grade is expected to define the startup sequence.

### `{that}.isUp()`

* Returns: The implementation should return a literal `true` or `false` if the status can be checked synchronously, or a
  `fluid.promise` that will resolve with the status once the check is complete.

Check to see if the associated CouchDB instance is up.  Must be defined in the implementation-specific grade.

### `{that}.shutdown()`

* Returns: A `fluid.promise` that will resolve once shutdown is complete or reject if an error occurs.

This invoker triggers the complex ["promise chaining event"](https://docs.fluidproject.org/infusion/development/PromisesAPI.html#fluidpromisefiretransformeventevent-payload-options)
`combinedShutdown`.  Each implementation grade is expected to define the shutdown sequence.


## `gpii.test.couchdb.worker.docker`

The default implementation uses [Docker](https://www.docker.com) to run an instance of CouchDB.

### Component Options

In addition to the options for the base grade, this grade also supports the following unique options:

| Option                             | Type       | Description |
| ---------------------------------- | ---------- | ----------- |
| `commandTemplates.listContainers`  | `{String}` | The command used to get the list of available containers.  Will be passed to `fluid.stringTemplate` along with our options. |
| `commandTemplates.createContainer` | `{String}` | The command used to create a new container.  Will be passed to `fluid.stringTemplate` along with our options. |
| `commandTemplates.startContainer`  | `{String}` | The command used to start an existing container.  Will be passed to `fluid.stringTemplate` along with a detected `containerId` value. |
| `commandTemplates.removeContainer` | `{String}` | The command used to remove the container.  Will be passed to `fluid.stringTemplate` along with a detected `containerId` value. |
| `commandTemplates.stopContainer`   | `{String}` | The command used to stop the container.  Will be passed to `fluid.stringTemplate` along with a detected `containerId` value. |
| `containerLabel`                   | `{String}` | The label we will use to identify "our" docker container(s).  Defaults to `gpii-couchdb-test-harness`. |
| `containerName`                    | `{String}` | If a container isn't already available, one will be created and labeled with `containerName`.  The default value is expanded from the component's ID. |

### Component Invokers

### `{that}.startup()`

* Returns: A `fluid.promise` that will resolve once startup is complete or reject if an error occurs.

The Docker worker checks to see if a container labeled with the value in `options.containerLabel` (see above) exists and
is running.  If one is running, it does nothing.  If one exists but is stopped, it starts the existing container.  If no
existing container is found, a new one is created.

### `{that}.isUp()`

* Returns: A `fluid.promise` that will resolve with `true` if the Docker container is up, resolve with `false` if the
container is down, or reject if an error occurs.

### `{that}.shutdown()`

* Returns: A `fluid.promise` that will resolve once shutdown is complete or reject if an error occurs.

Depending on the options inherited from the parent grade (see above), on shutdown the grade may:

1. Stop the container.
2. Remove the container.

By default it does neither.

## `gpii.test.couchdb.worker.vagrant`

This grade is only used if the `GPII_TEST_COUCH_USE_VAGRANT` environment variable is set.  It uses a Vagrant VM running
Docker to launch the same Docker image as the Docker worker.  It is intended for environments such as Windows 7 where it
is more difficult to run modern versions of Docker directly.  The `Vagrantfile` in the root of this repository is used
to provision and control the associated VM.

### Component Options

In addition to the options for the base grade, this grade also supports the following unique options:

| Option                      | Type       | Description |
| --------------------------- | ---------- | ----------- |
| `commandTemplates.vmStatus` | `{String}` | The template to use when checking the VM's status.  Will be passed to `fluid.stringTemplate` along with `that.options`. |
| `commandTemplates.startup`  | `{String}` | The template to use when starting the VM.  Will be passed to `fluid.stringTemplate` along with `that.options`. |
| `commandTemplates.shutdown` | `{String}` | The template to use when halting the VM.  Will be passed to `fluid.stringTemplate` along with `that.options`. |

### `{that}.startup()`

* Returns: A `fluid.promise` that will resolve once startup is complete or reject if an error occurs.

The Vagrant worker checks to see if an existing VM associated with our working directory exists.  If a VM is running,
it does nothing.  If not, `vagrant up` is called.  This will create a VM if needed or start an existing VM if one exists
but is not running.

### `{that}.isUp()`

* Returns: A `fluid.promise` that will resolve with `true` if the Vagrant VM is up, resolve with `false` if the
VM is down, or reject if an error occurs.

### `{that}.shutdown()`

* Returns: A `fluid.promise` that will resolve once shutdown is complete or reject if an error occurs.

As the buildup and teardown of Vagrant VMs is more expensive, this grade does not attempt to destroy the container
whether or not the `removeContainer` option is set.  If the `stopContainer` option is `true`, the container will be
halted.
