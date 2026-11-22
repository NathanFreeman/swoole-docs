# Properties

[`Swoole\Http\Server`](/en/server/http.html), [`Swoole\Websocket\Server`](/en/server/websocket.html), and [`Swoole\Redis\Server`](/en/server/redis.html) all inherit from the [`Swoole\Server`](/en/server/tcp_udp.html) class. Therefore, these subclasses not only share the following properties, but also fully inherit all public methods of the parent class (such as `set`, [`close`](/en/server/methods.html#close), etc.).

> [!TIP]
> All of the following properties are essentially read-only snapshots. Modifying a property value does not affect the running state of the service. For example, changing the process count configuration after the service has started does not actually add or remove processes.

## Runtime Configuration

### setting

All parameters configured via the [Swoole\Server->set()](/en/server/methods.html#set) method are ultimately stored in the `Swoole\Server->$setting` property. This property is an array (`array`), allowing developers to access and read the current runtime configuration at any time within callback functions.

```php
public array $setting
```

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->set([  'worker_num' => 4  ]);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  foreach($server->setting as $setting) {
    echo "Setting: " . $setting . PHP_EOL;
  }
});

$server->start();
```

## Connections and Listening

### connections

This is an array iterator composed of connection file descriptors (fd). You can use `foreach` to iterate over all of the server's current connections. This property provides the same functionality as [Swoole\Server->getClientList()](/en/server/methods.html#getclientlist), but is friendlier to use.

```php
public Iterator $connections
```

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  foreach($server->connections as $fd) {  // Iterate over the current connections
    echo "Current file descriptor: " . $fd . PHP_EOL;
  }
});

$server->start();
```

> [!TIP]
> The `$connections` property is an iterator object, not a PHP array, so it cannot be accessed with `var_dump` or array indexes; it can only be traversed with `foreach`.

> [!TIP]
> Only in `SWOOLE_PROCESS` mode does this property hold the connections of all `worker` processes; in other modes, each `worker` process holds this property independently, without interfering with one another.

> [!TIP]
> Since `Swoole 5.0+`, the default working mode has changed from `SWOOLE_PROCESS` to `SWOOLE_BASE`.

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  foreach($server->connections as $fd) {  // In SWOOLE_PROCESS mode, $server->connections holds the connections (fd) of all `worker` processes; other processes can access each other's connections (fd).
    var_dump($fd);
  }
});
```

### host

Returns the `host` of the host address the current server listens on. This property is a string of type `string`.

```php
public string $host
```

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "Listening address: " . $server->host . PHP_EOL;
});

$server->start();
```

### port

Returns the `port` the current server listens on. This property is an integer of type `int`.

```php
public int $port
```

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "Listening port: " . $server->port . PHP_EOL;
});

$server->start();
```

### type

Returns the `Socket` type of the current server. This property is an integer of type `int`.

```php
public int $type
```

**Example**

```php
<?php
use Swoole\Server;

// Example 1: TCP service
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_TCP);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "Server type: " . $server->type . PHP_EOL;
});

$server->start();

// Example 2: UDP service
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_UDP);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "Server type: " . $server->type . PHP_EOL;
});

$server->start();
```

This property returns one of the following constant values:

- [`SWOOLE_SOCK_TCP`](/en/client/tcp_udp.html#construct): TCP IPv4 Socket
- `SWOOLE_SOCK_TCP6`: TCP IPv6 Socket
- `SWOOLE_SOCK_UDP`: UDP IPv4 Socket
- `SWOOLE_SOCK_UDP6`: UDP IPv6 Socket
- `SWOOLE_SOCK_UNIX_DGRAM` (also written as `SWOOLE_UNIX_DGRAM`): Unix Socket Dgram
- `SWOOLE_SOCK_UNIX_STREAM` (also written as `SWOOLE_UNIX_STREAM`): Unix Socket Stream

### ssl

Returns whether the current server has `ssl` enabled. This property is of type `bool`.

```php
public bool $ssl
```

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

// Example: HTTP service
$server = new Server('127.0.0.1', 443, SWOOLE_BASE, SWOOLE_TCP | SWOOLE_SSL);
$server->on('request', function(Request $request, Response $response) use ($server) {
  echo "Whether ssl encryption is enabled: " . $server->ssl . PHP_EOL;
});

$server->start();
```

### ports

If the server listens on multiple ports via [Swoole\Server->listen()](/en/server/methods.html#listen), you can iterate over `Swoole\Server::$ports` to obtain all [`Swoole\Server\Port`](/en/server/class/port.html) objects.

Among them, `Swoole\Server::$ports[0]` is the main server port set by the constructor.

```php
public array $ports
```

**Example**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501); // Main server port
$port = $server->listen('127.0.0.1', 9502);

$server->on('receive', function ($server, $fd, $reactor_id, $data) {
  foreach($server->ports as $port) {
    echo "Listening port: " . $port->port . PHP_EOL;
  }
});
$server->start();
```

## Processes and Threads

### mode

Returns the process mode `mode` of the current server. This property is an integer of type `int`.

```php
public int $mode
```

**Example**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

// Example: HTTP service
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) use ($server) {
  echo "Server mode: " . $server->mode . PHP_EOL;
});

$server->start();
```

> [!TIP]
> This property returns one of the following values: [`SWOOLE_BASE`](/en/server/process_thread.html#swoole-base) — single-process mode, [`SWOOLE_PROCESS`](/en/server/process_thread.html#swoole-process) — multi-process mode, [`SWOOLE_THREAD`](/en/server/process_thread.html#swoole-thread) — multi-thread mode.

### master_pid

Returns the `PID` of the `master` process.

```php
public int $master_pid
```

**Example**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501);
$server->on('start', function (Server $server){
  echo "Master process id: " . $server->master_pid . PHP_EOL;
});

$server->on('receive', function ($server, $fd, $reactor_id, $data) {
});

$server->start();
```

> [!TIP]
> The `master` process only exists in `SWOOLE_PROCESS` mode; this property is invalid in other modes.

### manager_pid

Returns the `PID` of the current `manager` process. This property is an integer of type `int`.

```php
public int $manager_pid
```

**Example**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501);
$server->on('start', function (Server $server) {
  echo "Manager process id: " . $server->manager_pid . PHP_EOL;
});

$server->on('receive', function ($server, $fd, $reactor_id, $data) {

});
$server->start();
```

> [!TIP]
> It can only be obtained after `Start/WorkerStart`.

### worker_id

Gets the ID of the current `worker` process or `task` process, starting from 0. This property is an integer of type `int`.

```php
public int $worker_id
```

**Example**

```php
<?php
$server = new Swoole\Server('127.0.0.1', 9501);
$server->set([
    'worker_num' => 8,
    'task_worker_num' => 4,
]);

$server->on('WorkerStart', function ($server, int $workerId) {
    if ($server->taskworker) {
        echo "task workerId: {$workerId}\n";
        echo "task worker_id: {$server->worker_id}\n";
    } else {
        echo "workerId: {$workerId}\n";
        echo "worker_id: {$server->worker_id}\n";
    }
});

$server->on('Receive', function ($server, $fd, $reactor_id, $data) {
});

$server->on('Task', function ($serv, $task_id, $reactor_id, $data) {
});

$server->start();
```

> [!TIP]
> - This property has the same meaning as the `$workerId` parameter in the [`onWorkerStart`](/en/server/events.html#workerstart) callback.
> - The value of `worker_id` remains unchanged after a `worker` process or `task` process restarts.
> - If [`worker_num`](/en/server/setting.html#worker-num) is set to 4, the `worker` process IDs range over `[0, worker_num - 1]`, i.e. `[0, 3]`.
> - If `worker_num` is 4 and [`task_worker_num`](/en/server/setting.html#task-worker-num) is 8, the `task` process IDs range over `[worker_num, worker_num + task_worker_num - 1]`, i.e. `[4, 11]`.

### taskworker

Whether the current process is a `Task` process. `true` means the current process is a `Task` worker process, and `false` means the current process is another kind of process. This property is of type `bool`.

```php
public bool $taskworker
```

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->set(['task_worker_num' => 2]);

$server->on('task', function(Server $server, int $taskId, int $workerId, mixed $data) {
  var_dump($server->taskworker); // Outputs true in the task process
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  var_dump($server->taskworker); // Outputs false in the worker process
});

$server->start();
```

### worker_pid

Gets the `PID` of the current `worker` process. This property is an integer of type `int`.

```php
public int $worker_pid
```

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "Worker process PID: " . $server->worker_pid . PHP_EOL;
});

$server->start();
```

> [!TIP]
> In `SWOOLE_BASE` and `SWOOLE_PROCESS` modes, this property's value is the same as the return value of `posix_getpid()`.

**Example**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  var_dump($server->worker_pid == posix_getpid());
});

$server->start();
```

> [!TIP]
> In `SWOOLE_THREAD` mode, this property's value is the same as the return value of [`Swoole\Thread::getId()`](/en/thread/create.html#getid).

**Example**

```php
<?php
use Swoole\Server;
use Swoole\Thread;

$server = new Server('127.0.0.1', 9501, SWOOLE_THREAD);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  var_dump($server->worker_pid == Thread::getId());
});

$server->start();
```