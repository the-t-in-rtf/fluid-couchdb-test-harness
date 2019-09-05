# gpii-couchdb-test-harness

This package is intended to test integration with [CouchDB](http://couchdb.apache.org).  Although it can in theory be
used on its own, the [harness](./docs/harness.md) provided by this package is designed to interact with and tested
exclusively with the [Fluid IoC Test
Framework](https://docs.fluidproject.org/infusion/development/IoCTestingFramework.html) and the [test fixtures provided
by this package](./docs/test-fixtures.md).

## Requirements

The harness provided by this package can be run in one of three modes:

1. By default, the harness attempts to launch a [Docker](https://www.docker.com) container with an instance of CouchDB.
2. If you are in an environment (such as Windows 7) where running Docker is not possible, you can set the
   `GPII_TEST_COUCH_USE_VAGRANT` environment variable to use [Vagrant](https://www.vagrantup.com) instead.  See below
   for details.
3. If you would like to use your own standalone instance of CouchDB, configure it to listen to the same port used by the
   tests in this package (25984) and set the `GPII_TEST_COUCH_USE_EXTERNAL` environment variable.

## Running the Tests

To run the tests for this package on a local machine, you must have either Docker, Vagrant, or a local instance of
CouchDB installed (see above).

### Running the Tests Locally Using a Docker CouchDB Container

To run tests using docker, use the command `npm test`.  The required Docker containers will be automatically started if
they are not already running.

### Running Tests Locally Using Vagrant to Provide a Docker CouchDB Container

You can also run the tests locally using a Vagrant VM to start the CouchDB docker container.  To use this option, you
need to have both Vagrant and the [Vagrant GPII CI plugin](https://github.com/gpii-ops/vagrant-gpii-ci) installed.  You
also need to set the `GPII_TEST_COUCH_USE_VAGRANT` to `true`.  The test scripts will detect the environment variable and
start the Vagrant VM if required.  Please note, the `Vagrantfile` used to run the tests locally is different than the
one in the root of the repository, which is used to run the tests in a Vagrant VM (see below).  If you need to run
manual commands against the Vagrant VM created by the tests, you will need to issue all commands from the `src/test`
directory rather than from the root of the repository.

#### Running the Tests (and a Docker CouchDB Container) in a Vagrant linux VM

To run the tests for this package in a linux VM using Docker and the official Apache CouchDB image, use commands like:

`vagrant up linux`
`vagrant ci test linux`

#### Running the Tests (and the windows version of CouchDB) in a Vagrant Windows VM

To run the tests for this package in a Windows 10 VM using a standalone instance of CouchDB, use commands like:

`vagrant up windows`
`vagrant ci test windows`

## More Information

1. [More information about the test fixtures provided by this package.](./docs/test-fixtures.md)
2. [More information about the harness provided by this package](./docs/harness.md).
