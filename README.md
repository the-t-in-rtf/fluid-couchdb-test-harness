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
   `GPII_TEST_COUCH_USE_VAGRANT` environment variable to use [Vagrant](https://www.vagrantup.com) instead.  If you need
   to run manual commands against the created Vagrant VM, you will need to issue the commands from the src/test
   subdirectory containing the relevant Vagrantfile.
3. If you would like to use your own standalone instance of CouchDB, configure it to listen to the same port used by the
   tests in this package (25984) and set the `GPII_TEST_COUCH_USE_EXTERNAL` environment variable.

## Running the Tests

To run the tests for this package on a local machine, you must have either Docker, Vagrant, or a local instance of
CouchDB installed (see above).  To run tests locally, use the command `npm test`.

You can also run the tests in a Vagrant VM.  You will need to have both Vagrant and the
[Vagrant GPII CI plugin](https://github.com/gpii-ops/vagrant-gpii-ci) installed.

To run the tests for this package in a linux VM using Docker and the official Apache CouchDB image, use commands like:

`vagrant up linux`
`vagrant ci test linux`

To run the tests for this package in a Windows 10 VM using a standalone instance of CouchDB, use commands like:

`vagrant up windows`
`vagrant ci test windows`

## More Information

1. [More information about the test fixtures provided by this package.](./docs/test-fixtures.md)
2. [More information about the harness provided by this package](./docs/harness.md).
