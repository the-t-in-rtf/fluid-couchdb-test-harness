# fluid-couchdb-test-harness

This package is intended to test integration with [CouchDB](http://couchdb.apache.org).  Although it can in theory be
used on its own, the [harness](./docs/harness.md) provided by this package is designed to interact with and tested
exclusively with the [Fluid IoC Test
Framework](https://docs.fluidproject.org/infusion/development/IoCTestingFramework.html) and the [test fixtures provided
by this package](./docs/test-fixtures.md).

## Requirements

The harness provided by this package can be run in one of three modes:

1. Docker
2. Vagrant
3. "External"

### Docker

By default, the harness attempts to launch a [Docker](https://www.docker.com) container with an instance of CouchDB.
At time of writing, this is conservatively pinned to CouchDB 2.3.1 (see below for details about CouchDB 3.0).

## Vagrant

If you are in an environment (such as Windows 7) where running Docker is not possible, you can set the
`FLUID_TEST_COUCH_USE_VAGRANT` environment variable to use [Vagrant](https://www.vagrantup.com) instead.  See below
for details.  This will use the same version of CouchDB as the Docker route.

## "External"

If you would like to use your own standalone instance of CouchDB, configure it to listen to the same port used by the
tests in this package (25984) and set the `FLUID_TEST_COUCH_USE_EXTERNAL` environment variable.  This mode is used by
our CI setup, and the tests are run against the latest version of the CouchDB docker container (3.x at time of writing).

Please note, when using an "external" instance, you must ensure that an administrative user named `admin` exists, whose
password is set to `admin`.  In CouchDB 2.x, the default was to use the "admin party", where no username/password is
required to access administrative functions.  In CouchDB 3.0 and higher, "admin party" has been removed and you must
have an administrative username and password set.  Thankfully, the process of configuring these at least for docker
containers is the same for both CouchDB 2.x and 3.x, i.e. you set two environment variables when creating the container.

You can see examples of these environment variables in the GitHub Actions workflow found in this package's `.github`
folder.

## Running the Tests

To run the tests for this package on a local machine, you must have either Docker, Vagrant, or a local instance of
CouchDB installed (see above).

### Running the Tests Locally

To run tests using docker, use the command `npm test`.  The required Docker containers will be automatically started if
they are not already running.  To run the tests using Docker or Vagrant, set the relevant environment variable
(see above).

## More Information

1. [More information about the test fixtures provided by this package.](./docs/test-fixtures.md)
2. [More information about the harness provided by this package](./docs/harness.md).
