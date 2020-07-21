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

## Vagrant

If you are in an environment (such as Windows 7) where running Docker is not possible, you can set the
`FLUID_TEST_COUCH_USE_VAGRANT` environment variable to use [Vagrant](https://www.vagrantup.com) instead.  See below
for details.

## "External"

If you would like to use your own standalone instance of CouchDB, configure it to listen to the same port used by the
tests in this package (25984) and set the `FLUID_TEST_COUCH_USE_EXTERNAL` environment variable.  This mode is used by
our GitHub CI setup.

Please note, when using an "external" instance, you must ensure that an administrative user named `admin` exists, whose
password is set to `admin`.  You can see an example of the required configuration for GitHub Actions in this package's
`.github` folder.

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
