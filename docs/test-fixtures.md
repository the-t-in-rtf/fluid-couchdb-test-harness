# Test Fixtures Provided by This Package

This package provides two key test fixtures for use with the [Fluid IoC Test
Framework](https://docs.fluidproject.org/infusion/development/IoCTestingFramework.html).

## `fluid.test.couchdb.testEnvironment`

The CouchDB test environment provided by this package, which configures [the harness provided by this package](./harness.md)
for use in Fluid IoC Tests.

### Component Options

| Option           | Type        | Description |
| ---------------- | ----------- | ----------- |
| `couch.port`     | `{Integer}` | The port on which CouchDB will be available.  Defaults to `25984`. |
| `couch.hostname` | `{String}`  | The hostname on which CouchDB is running.  Defaults to `localhost`. |
| `databases`      | `{Object}`  | The databases to create and provision.  See [the harness docs](./harness.md) for details. |

## `fluid.test.couchdb.testEnvironment.lucene`

A test environment that provides both CouchDB and [couchdb-lucene](https://github.com/rnewson/couchdb-lucene).  Uses 
[the `fluid.test.couchdb.harness.lucene` grade provided by this package](./harness.md).

### Component Options

| Option           | Type        | Description |
| ---------------- | ----------- | ----------- |
| `couch.port`     | `{Integer}` | The port on which CouchDB will be available.  Defaults to `25984`. |
| `couch.hostname` | `{String}`  | The hostname on which CouchDB is running.  Defaults to `localhost`. |
| `databases`      | `{Object}`  | The databases to create and provision.  See [the harness docs](./harness.md) for details. |


## `fluid.test.couchdb.caseHolder`

A test case holder intended for use with both of the above test environments.  It:

1. Starts the harness and waits for it to indicate that it's ready to respond to requests.
2. Runs any configured test sequence steps.
3. Shuts down the harness and waits for shutdown to complete.

The case holder provided by this package makes use of [sequence
grades](https://docs.fluidproject.org/infusion/development/IoCTestingFramework.html#using-sequencegrade-to-build-up-complex-reusable-test-sequences)
to perform the container startup and shutdown tasks.  If you want to add additional (non startup and shutdown) tasks,
consult that documentation for details on composing complex tests from sequence grades.

If you only want to add startup or shutdown steps, see the "Promise Chaining Events" section of [the harness
documentation](./harness.md).


### Component Options

| Option          | Type       | Description |
| --------------- | ---------- | ----------- |
| `rawModules`    | `{Object}` | The tests to execute.  Note that your tests must be defined in `rawModules` rather than `modules`,  otherwise they will not be able to trigger the automatic startup and shutdown sequence needed to use the harness safely. |
| `sequenceGrade` | `{String}` | The sequence grade to use with any test that does not already have a sequence grade. |
 
## `fluid.test.couchdb.request`

A grade derived from
[`kettle.test.request.http`](https://github.com/fluid-project/kettle/blob/master/docs/KettleTestingFramework.md#the-kettle-testing-framework)
for use in retrieving and then inspecting results from the test harness.

### Component Options

| Option | Type        | Description |
| ------ | ----------- | ----------- |
| `port` | `{Integer}` | The port on which CouchDB is running.  This is picked up from the test environment by default. |
