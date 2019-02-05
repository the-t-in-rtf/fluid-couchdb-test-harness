# gpii-couchdb-test-harness

This package is intended to test integration with [CouchDB](http://couchdb.apache.org).  Although it can in theory be
used on its own, the [harness](./docs/harness.md) provided by this package is designed to interact with and tested
exclusively with the [Fluid IoC Test
Framework](https://docs.fluidproject.org/infusion/development/IoCTestingFramework.html) and the [test fixtures provided
by this package](./docs/test-fixtures.md).

## Requirements

To use this package, you will need to either have [Docker](https://www.docker.com) or
[Vagrant](https://www.vagrantup.com) installed.  By default, the package will attempt to work with Docker directly.  If
you are in an environment (such as Windows 7) where running Docker is not possible, you can set the
`GPII_TEST_COUCH_USE_VAGRANT` environment variable to use Vagrant instead.   If you need to run manual commands against
the created Vagrant VM, you will need to issue the commands from the src/test subdirectory containing the relevant
Vagrantfile.

## More Information

1. [More information about the test fixtures provided by this package.](./docs/test-fixtures.md)
2. [More information about the harness provided by this package](./docs/harness.md).
