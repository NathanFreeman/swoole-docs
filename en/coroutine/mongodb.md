# MongoDB Coroutine Hooks

The `mongodb` extension is synchronous blocking, so its functions cannot be hooked directly like `PDO` or `Redis`. Swoole's approach is to swap out the client class: `MongoDB\Client` becomes the proxy class `Swoole\MongoDB\Client`, the real driver object runs in a separate long-running process, and the proxy forwards every call to it over a Unix Socket. Coroutines only yield while waiting for the socket response, so MongoDB operations no longer block the entire process.

> [!IMPORTANT]
> Prerequisites: `swoole` ≥ `6.2`, `PHP` ≥ `8.2`, and `swoole.enable_library=On` in `php.ini` (enabled by default; when set to `Off`, `SWOOLE_HOOK_MONGODB` is silently dropped); hooks must be set on the main thread before any child threads have been created; both construction and calls of the client must happen inside a coroutine.

## Complete Example

The script below can be saved and run as-is: it connects to MongoDB, bulk-inserts documents, creates an index, queries and updates, upserts, paginates, runs an aggregation, catches an exception, and finally cleans up the data, printing the result of every step.

**Prepare a MongoDB** (skip if you already have one):

```shell
docker run -d --name mongo -p 27017:27017 mongo:7
```

**Install dependencies**:

```shell
pecl install mongodb
composer require mongodb/mongodb
```

**Save as `demo.php`**:

```php
<?php
declare(strict_types=1);

use Swoole\RemoteObject\Exception;
use function Swoole\Coroutine\run;

// SWOOLE_HOOK_ALL does not include SWOOLE_HOOK_MONGODB; it must be OR-ed in explicitly
Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    // Must be constructed inside a coroutine. typeMap returns documents as plain arrays; otherwise every field access is a remote call
    $client = new Swoole\MongoDB\Client(
        'mongodb://127.0.0.1:27017',
        [],
        ['typeMap' => ['root' => 'array', 'document' => 'array', 'field' => 'array']]
    );

    // Select the database and collection; both are created automatically on the first write if they do not exist
    $articles = $client->selectCollection('demo', 'articles');

    // Start from a clean state so the script can be run repeatedly
    $articles->deleteMany([]);

    $inserted = $articles->insertMany([
        ['title' => 'Coroutine Basics', 'tag' => 'php', 'views' => 120],
        ['title' => 'Connection Pool in Practice', 'tag' => 'php', 'views' => 340],
        ['title' => 'MQTT Server', 'tag' => 'iot', 'views' => 80],
        ['title' => 'HTTP Service', 'tag' => 'php', 'views' => 560],
        ['title' => 'Timers', 'tag' => 'php', 'views' => 45],
    ]);
    echo '1. Inserted ', count($inserted->getInsertedIds()), " rows\n";

    echo '2. Index ', $articles->createIndex(['views' => -1]), "\n";

    $one = $articles->findOne(['title' => 'Coroutine Basics']);
    echo '3. Found ', $one['title'], ' views=', $one['views'], "\n";
    $articles->updateOne(['title' => 'Coroutine Basics'], ['$inc' => ['views' => 1]]);

    // upsert: insert a document when nothing matches
    $articles->updateOne(
        ['title' => 'Thread Pool'],
        ['$set' => ['tag' => 'php', 'views' => 0]],
        ['upsert' => true]
    );
    echo '4. Now have ', $articles->countDocuments(), " rows\n";

    // php tag sorted by views descending, page 2 with 2 per page; excluding _id saves one remote call
    $page = $articles->find(['tag' => 'php'], [
        'projection' => ['_id' => 0, 'title' => 1, 'views' => 1],
        'sort' => ['views' => -1],
        'skip' => 2,
        'limit' => 2,
    ])->toArray();
    echo "5. Page 2:\n";
    foreach ($page as $row) {
        echo '   ', $row['title'], ' ', $row['views'], "\n";
    }

    // The whole aggregation pipeline array is sent at once, computed on the server, and returned in one transfer
    $stats = $articles->aggregate([
        ['$group' => ['_id' => '$tag', 'total' => ['$sum' => '$views'], 'count' => ['$sum' => 1]]],
        ['$sort' => ['total' => -1]],
    ])->toArray();
    echo "6. Aggregation:\n";
    foreach ($stats as $row) {
        echo '   ', $row['_id'], ' total=', $row['total'], ' count=', $row['count'], "\n";
    }

    // Exceptions thrown on the server are uniformly wrapped as Swoole\RemoteObject\Exception
    try {
        $articles->insertOne(['_id' => 'dup']);
        $articles->insertOne(['_id' => 'dup']);
    } catch (Exception $e) {
        echo '7. Caught ', $e->getRemoteClass(), ' code=', $e->getRemoteCode(), "\n";
    }

    echo '8. Deleted ', $articles->deleteMany([])->getDeletedCount(), " rows\n";
});
```

**Run**:

```shell
php demo.php
```

Expected output:

```text
1. Inserted 5 rows
2. Index views_-1
3. Found Coroutine Basics views=120
4. Now have 6 rows
5. Page 2:
   Coroutine Basics 121
   Timers 45
6. Aggregation:
   php total=1066 count=5
   iot total=80 count=1
7. Caught MongoDB\Driver\Exception\BulkWriteException code=11000
8. Deleted 7 rows
```

> [!NOTE]
> The first run takes a few extra seconds: Swoole has to spin up the long-running server process automatically, and if `mongodb/mongodb` is not installed it first runs `composer require` once. Subsequent runs no longer have this overhead.

> [!TIP]
> Replacing `new Swoole\MongoDB\Client(...)` with `new MongoDB\Client(...)` works exactly the same, provided Composer's autoloader has not loaded the native `MongoDB\Client` first; see [How It Works](#how-it-works) for why.

## How It Works

The whole process has three steps:

- **Register the class alias**: once [`SWOOLE_HOOK_MONGODB`](#swoole-hook-mongodb) is enabled, Swoole registers `MongoDB\Client` as an alias of `Swoole\MongoDB\Client`, so `new MongoDB\Client(...)` in existing code becomes the coroutine version without changing a single line.
- **Forward calls**: the proxy class does not connect to MongoDB itself; it serializes method calls, property reads/writes, array access, and iteration and sends them to the remote object server.
- **Execute in a separate process**: the server holds the real `\MongoDB\Client`; blocking driver calls happen there, and results are serialized back.

The server starts automatically on first use and stays resident; no manual deployment is needed. To take over yourself, see [Custom Server](#custom-server).

> [!WARNING]
> `SWOOLE_HOOK_ALL` **does not include** `SWOOLE_HOOK_MONGODB`; it must be OR-ed in explicitly: `SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB`.

> [!NOTE]
> The alias is only registered while the `MongoDB\Client` class **has not been loaded yet**. If you `require vendor/autoload.php` first and the project has `mongodb/mongodb` installed, `new MongoDB\Client(...)` still gives you the native blocking client; in that case you must explicitly write `new Swoole\MongoDB\Client(...)`.

## Installing Dependencies

```shell
pecl install mongodb
composer require mongodb/mongodb
```

Installing the `mongodb` extension on the current PHP is enough; the auto-started server process uses `PHP_BINARY`.

> [!NOTE]
> It is fine if the `mongodb/mongodb` library is not installed: on the server's first startup, Swoole automatically runs `composer require mongodb/mongodb` in the server's working directory. This requires `composer` to be in `PATH` with network access; otherwise install it yourself first.

## SWOOLE_HOOK_MONGODB

The hook flag that coroutineizes the `MongoDB` client; its value is `1 << 22`.

```php
Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);
```

Once enabled, `MongoDB\Client` becomes an alias of [`Client`](#client). You can also skip the alias and instantiate `Swoole\MongoDB\Client` directly; the two are fully equivalent.

> [!NOTE]
> This flag only registers the class alias and triggers dependency installation on the server; it does not hook any function of the `mongodb` extension. Using low-level classes such as `MongoDB\Driver\Manager` directly is still blocking.

## Client

`Swoole\MongoDB\Client` is the coroutine proxy of `MongoDB\Client`. It only declares [`__construct`](#construct); all other calls are forwarded by `Swoole\RemoteObject\ProxyTrait` to the real object on the remote side, so the native `MongoDB\Client` API (`selectDatabase`, `selectCollection`, `listDatabases`, selecting a database via `__get`, etc.) works as usual.

### __construct

Creates a MongoDB coroutine client and, at the same time, creates the corresponding `\MongoDB\Client` object on the server.

```php
public function __construct(?string $uri = self::DEFAULT_URI, array $uriOptions = [], array $driverOptions = [])
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$uri` | Connection string, in exactly the same format as the native `MongoDB\Client` | `'mongodb://127.0.0.1/'` (`Client::DEFAULT_URI`) |
| `$uriOptions` | Connection string options; override query parameters of the same name in `$uri` | `[]` |
| `$driverOptions` | Driver options, such as `typeMap`; see [Call Forwarding](#call-forwarding) | `[]` |

> [!NOTE]
> Construction itself makes a remote call, so `new` must happen inside a coroutine. A failed construction throws [`Swoole\RemoteObject\Exception`](#exceptions).

### Call Forwarding

Every kind of operation on a proxy object is one inter-process round trip:

| Code | What actually happens |
|:---|:---|
| `$client->selectCollection('demo', 'users')` | Forwards the method call; the returned `Collection` is also a remote proxy |
| `$client->demo` | Forwards the property read, equivalent to `selectDatabase('demo')` |
| `$collection->insertOne([...])` | The argument array is serialized and sent; the returned `InsertOneResult` is a remote proxy |
| `$document['name']` | Forwards the array access, one round trip |
| `foreach ($cursor as $document)` | `rewind`, `valid`, `current`, `key`, and `next` are each one round trip |
| `count($cursor)` | Forwards the `count` call, one round trip |

**Return value rules**: scalars and arrays returned by the server are transferred back locally by value; returned objects (including objects nested inside arrays) are not transferred back — they are registered on the server and wrapped as new remote proxies.

> [!TIP]
> When reading data in bulk, set `typeMap` to `array` so documents come back as plain arrays in one transfer, without creating hundreds or thousands of remote proxies; see the [Complete Example](#complete-example) for the syntax.

> [!WARNING]
> Iterating large result sets is expensive: every step of `foreach` is one round trip, and reading each field is another. Prefer `find(...)->toArray()` combined with `typeMap` so the server transfers the whole array back at once.

### Object Lifecycle

- When a local proxy object is destroyed, the remote object is released along with it; release requests are batched (16 at a time) or sent by a timer after a `100ms` delay, not executed synchronously right away.
- When a client connection closes, the server releases all objects created on that connection.
- Holding a proxy object long-term keeps the remote object and connection from ever being released; manual release is not needed, but do not stash proxies in a global container that spans requests.

## RemoteObject Client

`Swoole\RemoteObject\Client` is the transport layer behind the proxies. You never need to touch it when using `MongoDB\Client` directly; it is only needed to construct BSON objects, call remote functions, or connect to a server you deployed yourself.

### create

Creates an object on the server and returns its local proxy.

```php
public function create(string $class, mixed ...$args): RemoteObject
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$class` | Name of the class to instantiate on the server | Required |
| `...$args` | Arguments passed to that class's constructor | None |

**Return value**: returns a `Swoole\RemoteObject` proxy object; subsequent calls on it are forwarded to that instance on the server. See [Constructing BSON Objects](#constructing-bson-objects) for usage.

### call

Calls a global function on the server.

```php
public function call(string $fn, mixed ...$args): mixed
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$fn` | Function name | Required |
| `...$args` | Arguments passed to that function | None |

**Return value**: returns the function's execution result from the server; when the result is an object, it is likewise wrapped as a remote proxy. See [Remote Functions and Liveness Checks](#remote-functions-and-liveness-checks) for usage.

> [!NOTE]
> The function executes in the server process; both arguments and return values must be serializable, and closures cannot be passed across.

### ping

Checks whether the server is available.

```php
public function ping(): bool
```

No parameters.

**Return value**: returns `true` when the server responds normally, and `false` when the request fails or throws. See [Remote Functions and Liveness Checks](#remote-functions-and-liveness-checks) for usage.

## Custom Server

The default server is started automatically by Swoole: its working directory is `.swoole` under `HOME` (falling back to `sys_get_temp_dir()` when unavailable), it daemonizes and listens on the Unix Socket `remote-object-server.sock`, defaults to thread mode with `128` worker threads (falling back to `SWOOLE_BASE` with `8` when `SWOOLE_THREAD` is not supported), and leaves four files in the directory: `remote-object-server.php`, `.pid`, `.log`, and `.lock`.

Start the server yourself when you need a standalone deployment, a TCP listener, or authentication.

### Starting the Server

```php
<?php
use Swoole\RemoteObject\Server;

require __DIR__ . '/vendor/autoload.php';

$server = new Server(options: [
    'worker_num' => 2,
    'server_mode' => SWOOLE_THREAD, // Thread mode: ps aux shows only one process, more elegant than SWOOLE_BASE / SWOOLE_PROCESS
    'enable_coroutine' => false, // The server runs the synchronous blocking mongodb extension; no coroutine environment is needed
    'bootstrap' => __FILE__,
    'pid_file' => __DIR__ . '/server.pid',
]);

$server->start();
```

The `Server` constructor signature is `__construct(string $host = '127.0.0.1', int $port = self::DEFAULT_PORT, array $options = [])`, where `DEFAULT_PORT` is `9567`; when `$host` and `$port` are omitted it listens on TCP `9567`. Besides the keys above, `options` also accepts:

- `api_key`: authentication key; clients must carry the same `api_key`, otherwise the server replies `403`.
- `allowed_classes`, `allowed_functions`: allowlist arrays restricting which classes [`create`](#create) may instantiate and which functions [`call`](#call) may invoke; unrestricted when omitted.
- All other keys are passed through to `Swoole\Server::set` as-is, such as `log_file` and `dispatch_mode`.

> [!IMPORTANT]
> When `server_mode` is `SWOOLE_PROCESS`, `dispatch_mode` must be `SWOOLE_DISPATCH_FDMOD` and `dispatch_func` must not be set, otherwise the constructor throws immediately. Remote objects are bound to connections; a different dispatch mode would fail to find the object.

### Connecting to the Server

```php
<?php
use Swoole\RemoteObject\Client;
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_MONGODB);

run(function () {
    $client = new Client('127.0.0.1', 9567);
    $mongo = $client->create(MongoDB\Client::class, 'mongodb://127.0.0.1:27017');
    $collection = $mongo->myDatabase->users;

    $collection->insertOne([
        'name' => 'Zhang San',
        'email' => 'zhangsan@example.com',
        'age' => 25,
        'created_at' => $client->create(MongoDB\BSON\UTCDateTime::class, time() * 1000),
    ]);
    echo "inserted\n";
});
```

To connect over a Unix Socket, simply change the first argument to `'unix://' . $dir . '/remote-object-server.sock'`. When the server has an `api_key` set, pass `['api_key' => '...']` as the client's third argument.

> [!NOTE]
> You can also skip this code and use `mongodb_remote_object_client` from [Library Options](#library-options) to inject a `Client` you created into `Swoole\MongoDB\Client`, so business code keeps using `new MongoDB\Client(...)`.

## Library Options

Library options are the global configuration of the built-in library, read and written with the two functions below; they must be set **before** the first use of the MongoDB client.

### swoole_library_set_option

Sets a single library option.

```php
function swoole_library_set_option(string $key, mixed $value): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | Option name, see [Options Overview](#options-overview) | Required |
| `$value` | Option value | Required |

**Return value**: no return value.

**Example**

```php
<?php
use function Swoole\Coroutine\run;

// Must be set before the first use of the MongoDB client
swoole_library_set_option('default_remote_object_server_dir', '/data/swoole');
swoole_library_set_option('default_remote_object_server_verbose', true);

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $client = new Swoole\MongoDB\Client('mongodb://127.0.0.1:27017');
    echo 'count: ', $client->selectCollection('demo', 'users')->countDocuments(), "\n";
});
```

The directory is created recursively if it does not exist, but the parent path must be writable — the server needs to create the socket, pid, log, and lock files inside it and install Composer dependencies. With `verbose` enabled, the startup process is printed to standard output, which helps debug first-startup failures.

### swoole_library_set_options

Sets all library options at once.

```php
function swoole_library_set_options(array $options): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$options` | Mapping from option names to option values | Required |

**Return value**: no return value.

> [!WARNING]
> This **replaces entirely** rather than merges; options previously set with `swoole_library_set_option` are cleared.

The corresponding reader functions are `swoole_library_get_option(string $key): mixed` (gets one; returns `null` if it does not exist) and `swoole_library_get_options(): array` (gets all).

**Example**

```php
<?php
use function Swoole\Coroutine\run;

swoole_library_set_option('default_remote_object_server_verbose', true);

// Full replacement: the verbose set above is cleared
swoole_library_set_options([
    'default_remote_object_server_dir' => '/data/swoole',
    'default_remote_object_server_worker_num' => 32,
]);
var_dump(swoole_library_get_option('default_remote_object_server_verbose'));

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $client = new Swoole\MongoDB\Client('mongodb://127.0.0.1:27017');
    echo 'count: ', $client->selectCollection('demo', 'users')->countDocuments(), "\n";
});
```

`var_dump` outputs `NULL`, not `bool(false)`: an option that was replaced away "does not exist", reads back as `null`, and the server then applies the defaults from the [Options Overview](#options-overview).

### Options Overview

| Option | Description | Default |
|:---|:---|:---|
| `default_remote_object_server_dir` | Server working directory; the socket, pid, log, lock, and auto-installed Composer dependencies all live here | `.swoole` under `HOME`; `sys_get_temp_dir()` when `HOME` is unavailable |
| `default_remote_object_server_verbose` | Whether to print the server startup process to standard output | `false` |
| `default_remote_object_server_worker_num` | Number of server worker threads | `128`; `8` when `SWOOLE_THREAD` is not supported |
| `default_remote_object_server_options` | Specifies the server `options` array directly; when set, the defaults of the two items above are no longer applied | Empty |
| `mongodb_remote_object_client` | Specifies the `Swoole\RemoteObject\Client` instance used by `Swoole\MongoDB\Client` | `null`, uses the default server |

## Exceptions

Exceptions thrown on the server are not transferred back as-is; they are wrapped as `Swoole\RemoteObject\Exception` (which extends `RuntimeException`), with a `Server Error: ` prefix in the message. The original exception's class name and error code are retrieved with the two methods below.

### getRemoteClass

```php
public function getRemoteClass(): ?string
```

No parameters.

**Return value**: returns the class name of the exception caught on the server, such as `MongoDB\Driver\Exception\ConnectionTimeoutException`; returns `null` when the error originates from the server itself (such as an invalid request or a wrong api key).

### getRemoteCode

```php
public function getRemoteCode(): int|string|null
```

No parameters.

**Return value**: returns the original error code of the server-side exception, which may be an integer or a string; returns `null` when the error originates from the server itself.

> [!NOTE]
> `getCode()` equals the original code only when it is an integer; string codes (such as PDO's SQLSTATE) are set to `0`, so use `getRemoteClass()` and `getRemoteCode()` to determine the type of a remote error.

## Notes

- **The alias may not take effect**: if Composer's `mongodb/mongodb` is loaded before the hook is enabled, `MongoDB\Client` remains the native blocking class; see [How It Works](#how-it-works).
- **Must be inside a coroutine**: constructing or calling outside a coroutine triggers the fatal error `API must be called in the coroutine`.
- **Serial per instance**: remote calls of one `Client` are queued by a channel lock; in concurrent scenarios create one per coroutine, or use the pooled style in [Connection Pool and HTTP Service](#connection-pool-and-http-service).
- **Callbacks cannot be passed across**: remote methods that accept a `callable` (such as `MongoDB\Driver\Session::withTransaction()`) throw `Serialization of 'Closure' is not allowed` locally; see [Usage Examples](#usage-examples).
- **BSON objects are still proxies**: values like `_id` and `UTCDateTime` come back locally as remote proxies; `json_encode` gets no content from them — exclude them with `projection` or convert explicitly with `(string)` (one extra round trip).
- **Do not reference library class constants locally**: constants like `MongoDB\Collection::RETURN_DOCUMENT_AFTER` require `mongodb/mongodb` to be loaded locally, while the dependency may only be installed in the server's working directory; writing the value directly (such as `['returnDocument' => 2]`) is safer. `MongoDB\Client::class` is unaffected, since `::class` does not trigger autoloading.
- **The server is a long-running daemon**: changes to server code or dependencies do not take effect automatically; stop it using the process ID in the `.pid` file, and it will be relaunched on next use.
- **The first startup can be slow**: it has to run `composer require mongodb/mongodb` automatically and wait for the socket to become ready; subsequent calls no longer have this overhead.
- **Proxy objects cannot be passed between business processes**: after serialization, only the server can restore them into real objects; passed to another PHP business process, the corresponding client cannot be found, and further calls throw `This remote object is not bound to a client`.

## Usage Examples

See the [Complete Example](#complete-example) for the full workflow; the examples below are split by scenario. All examples assume MongoDB listens on `127.0.0.1:27017` and that the extension and library are installed per [Installing Dependencies](#installing-dependencies); each script can be saved as a standalone `.php` file and run.

> [!WARNING]
> Remote methods that accept callbacks cannot be used, typically `MongoDB\Driver\Session::withTransaction(callable $callback)`. Arguments must be `serialize()`-d and sent across processes, closures cannot be serialized, and `Serialization of 'Closure' is not allowed` is thrown locally. For transactions, use the explicit style in [Transactions](#transactions). Callbacks executed in a local coroutine are unaffected, such as `withConnection` in [Connection Pool and HTTP Service](#connection-pool-and-http-service).

### Listing Databases

```php
<?php
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $client = new MongoDB\Client('mongodb://127.0.0.1:27017');
    foreach ($client->listDatabases() as $database) {
        echo $database->getName(), ': ', $database->getSizeOnDisk(), " bytes\n";
    }
});
```

### CRUD Operations

```php
<?php
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    // typeMap returns documents as plain arrays, avoiding a remote call for every field access
    $client = new Swoole\MongoDB\Client(
        'mongodb://127.0.0.1:27017',
        [],
        ['typeMap' => ['root' => 'array', 'document' => 'array', 'field' => 'array']]
    );
    $collection = $client->selectCollection('demo', 'users');

    $insertResult = $collection->insertOne([
        'name' => 'Zhang San',
        'email' => 'zhangsan@example.com',
        'age' => 25,
    ]);
    echo 'inserted: ', $insertResult->getInsertedId(), "\n";

    $document = $collection->findOne(['name' => 'Zhang San']);
    echo 'email: ', $document['email'], "\n";

    $updateResult = $collection->updateOne(['name' => 'Zhang San'], ['$set' => ['age' => 26]]);
    echo 'modified: ', $updateResult->getModifiedCount(), "\n";

    echo 'count: ', $collection->countDocuments(['name' => 'Zhang San']), "\n";

    foreach ($collection->find(['age' => ['$gte' => 18]])->toArray() as $row) {
        echo $row['name'], ' ', $row['age'], "\n";
    }

    $deleteResult = $collection->deleteOne(['name' => 'Zhang San']);
    echo 'deleted: ', $deleteResult->getDeletedCount(), "\n";
});
```

### Transactions

The session returned by `startSession()` is a remote proxy; when it is placed in an options array and passed back, the server restores it into the same real session object, so a transaction can persist across multiple calls.

```php
<?php
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $client = new Swoole\MongoDB\Client(
        'mongodb://127.0.0.1:27017',
        [],
        ['typeMap' => ['root' => 'array', 'document' => 'array', 'field' => 'array']]
    );
    $accounts = $client->selectCollection('demo', 'accounts');
    $accounts->deleteMany([]);
    $accounts->insertMany([
        ['name' => 'a', 'balance' => 100],
        ['name' => 'b', 'balance' => 0],
    ]);

    $session = $client->startSession();
    $session->startTransaction();
    try {
        $accounts->updateOne(['name' => 'a'], ['$inc' => ['balance' => -30]], ['session' => $session]);
        $accounts->updateOne(['name' => 'b'], ['$inc' => ['balance' => 30]], ['session' => $session]);
        $session->commitTransaction();
        echo "committed\n";
    } catch (Throwable $e) {
        $session->abortTransaction();
        echo 'aborted: ', $e->getMessage(), "\n";
    }

    foreach ($accounts->find([], ['sort' => ['name' => 1]])->toArray() as $row) {
        echo $row['name'], ' ', $row['balance'], "\n";
    }
});
```

Output:

```text
committed
a 70
b 30
```

> [!IMPORTANT]
> Transactions require MongoDB to be a replica set or sharded cluster; a standalone `mongod` does not support them and `startTransaction()` throws immediately. For local verification, start with `mongod --replSet rs0` and run `rs.initiate()` once.

> [!WARNING]
> Do not switch to `$session->withTransaction(function () { ... })`; closures cannot be passed across — see the note at the top of [Usage Examples](#usage-examples) for why.

### Constructing BSON Objects

Value objects like `MongoDB\BSON\UTCDateTime` are constructed on the server with [`create`](#create), then passed as arguments to collection methods.

```php
<?php
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $remote = swoole_get_default_remote_object_client();
    $mongo = $remote->create(MongoDB\Client::class, 'mongodb://127.0.0.1:27017');
    $collection = $mongo->selectCollection('demo', 'events');

    $collection->insertOne([
        'name' => 'login',
        'created_at' => $remote->create(MongoDB\BSON\UTCDateTime::class, time() * 1000),
    ]);
    echo "inserted\n";
});
```

> [!NOTE]
> `swoole_get_default_remote_object_client()` returns a [`Swoole\RemoteObject\Client`](#remoteobject-client) connected to the default server; every call returns a new instance.

### Coroutine Concurrency

A single `Client` instance has an internal channel lock, so its remote calls are **serial**: multiple coroutines sharing one instance will not error, but they queue up. For true concurrency, each coroutine creates its own client.

```php
<?php
use Swoole\Coroutine\WaitGroup;
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;
use function Swoole\Coroutine\defer;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $wg = new WaitGroup();
    $counts = [];
    foreach (['users', 'orders', 'logs'] as $name) {
        $wg->add();
        go(function () use ($wg, $name, &$counts) {
            defer(fn () => $wg->done());
            $client = new Swoole\MongoDB\Client('mongodb://127.0.0.1:27017');
            $counts[$name] = $client->selectCollection('demo', $name)->countDocuments();
        });
    }
    $wg->wait();
    foreach ($counts as $name => $count) {
        echo $name, ': ', $count, "\n";
    }
});
```

The [WaitGroup](/en/coroutine/waitGroup.html) waits until all three coroutines have finished writing before printing.

### Connection Pool and HTTP Service

Each coroutine needs its own client for concurrency, but creating a new connection per request is too expensive. Pool the clients with the [general-purpose connection pool](/en/pool/common.html): each `Swoole\MongoDB\Client` in the pool has its own connection to the server, is exclusive while borrowed, and requests run truly concurrently.

```php
<?php
use Swoole\ConnectionPool;
use Swoole\Coroutine\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $pool = new ConnectionPool(function () {
        return new Swoole\MongoDB\Client(
            'mongodb://127.0.0.1:27017',
            [],
            ['typeMap' => ['root' => 'array', 'document' => 'array', 'field' => 'array']]
        );
    }, 16);

    // Seed one document first for easy verification
    $pool->withConnection(function ($client) {
        $users = $client->selectCollection('demo', 'users');
        $users->deleteMany([]);
        $users->insertOne(['name' => 'Zhang San', 'email' => 'zhangsan@example.com', 'age' => 25]);
    });

    $server = new Server('127.0.0.1', 9501, false);
    $server->handle('/', function (Request $request, Response $response) use ($pool) {
        $name = $request->get['name'] ?? 'Zhang San';
        // The callback runs in a local coroutine and is not serialized; the connection is returned automatically on normal return or exception
        $user = $pool->withConnection(function ($client) use ($name) {
            return $client->selectCollection('demo', 'users')
                ->findOne(['name' => $name], ['projection' => ['_id' => 0]]);
        });
        $response->header('Content-Type', 'application/json; charset=utf-8');
        $response->end(json_encode($user ?? [], JSON_UNESCAPED_UNICODE));
    });
    $server->start();
});
```

Verify from another terminal:

```shell
curl 'http://127.0.0.1:9501/?name=Zhang%20San'
```

It returns `{"name":"Zhang San","email":"zhangsan@example.com","age":25}`; when nothing matches, it returns `{}`.

> [!NOTE]
> The pool capacity is the upper limit of MongoDB calls that can execute simultaneously; excess requests queue inside `withConnection`. Do not borrow a second connection from the same pool inside the callback; when nesting is needed, set a timeout for it — see the rules in [`withConnection`](/en/pool/common.html#withconnection).

> [!TIP]
> Here `projection` must exclude `_id`, otherwise the `ObjectId` in the document becomes a remote proxy and `json_encode` only yields `{}`. When you really need to output the id, write `(string) $document['_id']`, which costs one extra round trip.

### Remote Functions and Liveness Checks

Bypass MongoDB and use the transport layer directly to execute functions in the server process.

```php
<?php
use function Swoole\Coroutine\run;

Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL | SWOOLE_HOOK_MONGODB);

run(function () {
    $remote = swoole_get_default_remote_object_client();
    var_dump($remote->ping());
    echo 'local pid: ', getmypid(), "\n";
    echo 'remote pid: ', $remote->call('getmypid'), "\n";
    echo 'server os: ', $remote->call('php_uname', 's'), "\n";
});
```

`ping()` outputs `bool(true)`, and the two process IDs differ — the most direct evidence that "the call happens in another process"; `server os` is the system name of the machine hosting the server (such as `Linux`).

> [!WARNING]
> The auto-started default server sets no allowlist, so [`call`](#call) can invoke any global function on the server. When exposing it externally or deploying it yourself, tighten it with `allowed_functions` and `allowed_classes` from [Custom Server](#custom-server), and configure an `api_key`.