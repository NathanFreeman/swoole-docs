# 属性

[`Swoole\Http\Server`](/zh/server/http.html)、[`Swoole\Websocket\Server`](/zh/server/websocket.html) 以及 [`Swoole\Redis\Server`](/zh/server/redis.html) 均继承自 [`Swoole\Server`](/zh/server/tcp_udp.html) 类。因此，这些子类不仅共享以下属性，同时也完全继承了父类的所有公共方法（如 `set`、[`close`](/zh/server/methods.html#close) 等）。

> [!TIP]
> 以下所有属性本质上是只读快照。修改属性值不会影响服务的运行状态。例如，服务启动后修改其中的进程数配置，并不会实际增加或减少进程。

## 运行时配置

### setting

通过 [Swoole\Server->set()](/zh/server/methods.html#set) 方法配置的所有参数，最终都会被保存在 `Swoole\Server->$setting` 属性中。该属性是一个数组（`array`），允许开发者在回调函数中随时访问和读取当前的运行时配置。

```php
public array $setting
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->set([  'worker_num' => 4  ]);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  foreach($server->setting as $setting) {
    echo "配置：" . $setting . PHP_EOL;
  }
});

$server->start();
```

## 连接与监听

### connections

这是一个由连接的文件描述符（fd）组成的数组迭代器。你可以使用 `foreach` 遍历服务器当前所有的连接。此属性的功能与 [Swoole\Server->getClientList()](/zh/server/methods.html#getclientlist) 是一致的，但是更加友好。

```php
public Iterator $connections
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  foreach($server->connections as $fd) {  // 遍历当前连接
    echo "当前文件描述符：" . $fd . PHP_EOL;
  }
});

$server->start();
```

> [!TIP]
> `$connections` 属性是一个迭代器对象，不是 PHP 数组，所以不能用 `var_dump` 或者数组下标来访问，只能通过 `foreach` 进行遍历操作。

> [!TIP]
> 只有在 `SWOOLE_PROCESS` 模式下，该属性会保存所有 `worker` 进程的连接；在其他模式下，该属性为每个 `worker` 进程独立持有，互不干扰。

> [!TIP]
> 自 `Swoole 5.0+` 起，默认运行模式已由 `SWOOLE_PROCESS` 调整为 `SWOOLE_BASE`。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  foreach($server->connections as $fd) {  // SWOOLE_PROCESS模式下，$server->connections保存了所有`worker`进程的连接（fd），其他进程可以访问彼此的连接（fd）。
    var_dump($fd);
  }
});
```

### host

返回当前服务器监听的主机地址的 `host`，该属性是一个 `string` 类型的字符串。

```php
public string $host
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "监听地址：" . $server->host . PHP_EOL;
});

$server->start();
```

### port

返回当前服务器监听的端口的 `port`，该属性是一个 `int` 类型的整数。

```php
public int $port
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "监听端口：" . $server->port . PHP_EOL;
});

$server->start();
```

### type

返回当前服务器的 `Socket` 类型，该属性是一个 `int` 类型的整数。

```php
public int $type
```

**示例**

```php
<?php
use Swoole\Server;

// 示例一：TCP 服务
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_TCP);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "服务器类型：" . $server->type . PHP_EOL;
});

$server->start();
```

```php
<?php
use Swoole\Server;

// 示例二：UDP 服务
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_UDP);
$server->on('packet', function(Server $server, string $data, array $clientInfo) {
  echo "服务器类型：" . $server->type . PHP_EOL;
});

$server->start();
```

该属性会返回以下常量值之一：

- [`SWOOLE_SOCK_TCP`](/zh/client/tcp_udp.html#construct)：TCP IPv4 Socket
- `SWOOLE_SOCK_TCP6`：TCP IPv6 Socket
- `SWOOLE_SOCK_UDP`：UDP IPv4 Socket
- `SWOOLE_SOCK_UDP6`：UDP IPv6 Socket
- `SWOOLE_SOCK_UNIX_DGRAM`（亦写作 `SWOOLE_UNIX_DGRAM`）：Unix Socket Dgram
- `SWOOLE_SOCK_UNIX_STREAM`（亦写作 `SWOOLE_UNIX_STREAM`）：Unix Socket Stream

### ssl

返回当前服务器是否启动 `ssl`，该属性是一个 `bool` 类型。

```php
public bool $ssl
```

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

// 示例：HTTP 服务
$server = new Server('127.0.0.1', 443, SWOOLE_BASE, SWOOLE_TCP | SWOOLE_SSL);
$server->on('request', function(Request $request, Response $response) use ($server) {
  echo "是否开启ssl加密：" . $server->ssl . PHP_EOL;
});

$server->start();
```

### ports

如果服务器通过 [Swoole\Server->listen()](/zh/server/methods.html#listen) 监听了多个端口，可以遍历 `Swoole\Server::$ports` 得到所有 [`Swoole\Server\Port`](/zh/server/class/port.html) 对象。

其中 `Swoole\Server::$ports[0]` 为构造方法所设置的主服务器端口。

```php
public array $ports
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501); // 主服务器端口
$port = $server->listen('127.0.0.1', 9502);

$server->on('receive', function ($server, $fd, $reactor_id, $data) {
  foreach($server->ports as $port) {
    echo "监听端口为：" . $port->port . PHP_EOL;
  }
});
$server->start();
```

## 进程与线程

### mode

返回当前服务器的进程模式 `mode`，该属性是一个 `int` 类型的整数。

```php
public int $mode
```

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

// 示例：HTTP 服务
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) use ($server) {
  echo "服务器模式：" . $server->mode . PHP_EOL;
});

$server->start();
```

> [!TIP]
> 该属性返回以下值之一：[`SWOOLE_BASE`](/zh/server/process_thread.html#swoole-base) — 多进程模式（无 master 进程），[`SWOOLE_PROCESS`](/zh/server/process_thread.html#swoole-process) — 多进程模式，[`SWOOLE_THREAD`](/zh/server/process_thread.html#swoole-thread) — 多线程模式。

### master_pid

返回 `master` 进程的 `PID`。

```php
public int $master_pid
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501);
$server->on('start', function (Server $server){
  echo "master进程id为：" . $server->master_pid . PHP_EOL;
});

$server->on('receive', function ($server, $fd, $reactor_id, $data) {
});

$server->start();
```

> [!TIP]
> `master` 进程仅存在于 `SWOOLE_PROCESS` 模式下，其他模式下该属性无效。

### manager_pid

返回当前 `manager` 进程的 `PID`，该属性是一个 `int` 类型的整数。

```php
public int $manager_pid
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501);
$server->on('start', function (Server $server) {
  echo "manager进程id为：" . $server->manager_pid . PHP_EOL;
});

$server->on('receive', function ($server, $fd, $reactor_id, $data) {

});
$server->start();
```

> [!TIP]
> 只能在 `Start/WorkerStart` 之后获取到。

### worker_id

得到当前 `worker` 进程或者 `task` 进程的编号，编号从 0 开始，该属性是一个 `int` 类型的整数。

```php
public int $worker_id
```

**示例**

```php
<?php
$server = new Swoole\Server('127.0.0.1', 9501);
$server->set([
    'worker_num' => 8,
    'task_worker_num' => 4,
]);

$server->on('WorkerStart', function ($server, int $workerId) {
    if ($server->taskworker) {
        echo "task workerId：{$workerId}\n";
        echo "task worker_id：{$server->worker_id}\n";
    } else {
        echo "workerId：{$workerId}\n";
        echo "worker_id：{$server->worker_id}\n";
    }
});

$server->on('Receive', function ($server, $fd, $reactor_id, $data) {
});

$server->on('Task', function ($serv, $task_id, $reactor_id, $data) {
});

$server->start();
```

> [!TIP]
> - 该属性与 [`onWorkerStart`](/zh/server/events.html#workerstart) 回调中的 `$workerId` 参数含义相同。
> - `worker` 进程和 `task` 进程重启后 `worker_id` 的值是不变的。
> - 若 [`worker_num`](/zh/server/setting.html#worker-num) 设为 4，则 `worker` 进程编号范围为 `[0, worker_num - 1]`，即 `[0, 3]`。
> - 若 `worker_num` 为 4，[`task_worker_num`](/zh/server/setting.html#task-worker-num) 为 8，则 `task` 进程的编号范围为 `[worker_num, worker_num + task_worker_num - 1]`，即 `[4, 11]`。

### taskworker

当前进程是否是 `Task` 进程，`true` 表示当前的进程是 `Task` 工作进程，`false` 表示当前的进程是其他进程，该属性是一个 `bool` 类型。

```php
public bool $taskworker
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->set(['task_worker_num' => 2]);

$server->on('task', function(Server $server, int $taskId, int $workerId, mixed $data) {
  var_dump($server->taskworker); // task进程输出true
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  var_dump($server->taskworker); // worker进程输出false
});

$server->start();
```

### worker_pid

得到当前 `worker` 进程的 `PID`，该属性是一个 `int` 类型的整数。

```php
public int $worker_pid
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "worker进程PID为：" . $server->worker_pid . PHP_EOL;
});

$server->start();
```

> [!TIP]
> `SWOOLE_BASE` 和 `SWOOLE_PROCESS` 模式下，该属性的值与 `posix_getpid()` 的返回值相同。

**示例**

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
> `SWOOLE_THREAD` 模式下，该属性的值与 [`Swoole\Thread::getId()`](/zh/thread/create.html#getid) 的返回值相同。

**示例**

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

