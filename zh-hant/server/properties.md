# 屬性

[`Swoole\Http\Server`](/zh-hant/server/http.html)、[`Swoole\Websocket\Server`](/zh-hant/server/websocket.html) 以及 [`Swoole\Redis\Server`](/zh-hant/server/redis.html) 均繼承自 [`Swoole\Server`](/zh-hant/server/tcp_udp.html) 類。因此，這些子類不僅共享以下屬性，同時也完全繼承了父類的所有公共方法（如 `set`、[`close`](/zh-hant/server/methods.html#close) 等）。

> [!TIP]
> 以下所有屬性本質上是隻讀快照。修改屬性值不會影響服務的運行狀態。例如，服務啓動後修改其中的進程數配置，並不會實際增加或減少進程。

## 運行時配置

### setting

通過 [Swoole\Server->set()](/zh-hant/server/methods.html#set) 方法配置的所有參數，最終都會被保存在 `Swoole\Server->$setting` 屬性中。該屬性是一個數組（`array`），允許開發者在回調函數中隨時訪問和讀取當前的運行時配置。

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

## 連接與監聽

### connections

這是一個由連接的文件描述符（fd）組成的數組迭代器。你可以使用 `foreach` 遍歷服務器當前所有的連接。此屬性的功能與 [Swoole\Server->getClientList()](/zh-hant/server/methods.html#getclientlist) 是一致的，但是更加友好。

```php
public Iterator $connections
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  foreach($server->connections as $fd) {  // 遍歷當前連接
    echo "當前文件描述符：" . $fd . PHP_EOL;
  }
});

$server->start();
```

> [!TIP]
> `$connections` 屬性是一個迭代器對象，不是 PHP 數組，所以不能用 `var_dump` 或者數組下標來訪問，只能通過 `foreach` 進行遍歷操作。

> [!TIP]
> 只有在 `SWOOLE_PROCESS` 模式下，該屬性會保存所有 `worker` 進程的連接；在其他模式下，該屬性爲每個 `worker` 進程獨立持有，互不干擾。

> [!TIP]
> 自 `Swoole 5.0+` 起，默認運行模式已由 `SWOOLE_PROCESS` 調整爲 `SWOOLE_BASE`。

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  foreach($server->connections as $fd) {  // SWOOLE_PROCESS模式下，$server->connections保存了所有`worker`進程的連接（fd），其他進程可以訪問彼此的連接（fd）。
    var_dump($fd);
  }
});
```

### host

返回當前服務器監聽的主機地址的 `host`，該屬性是一個 `string` 類型的字符串。

```php
public string $host
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "監聽地址：" . $server->host . PHP_EOL;
});

$server->start();
```

### port

返回當前服務器監聽的端口的 `port`，該屬性是一個 `int` 類型的整數。

```php
public int $port
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "監聽端口：" . $server->port . PHP_EOL;
});

$server->start();
```

### type

返回當前服務器的 `Socket` 類型，該屬性是一個 `int` 類型的整數。

```php
public int $type
```

**示例**

```php
<?php
use Swoole\Server;

// 示例一：TCP 服務
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_TCP);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "服務器類型：" . $server->type . PHP_EOL;
});

$server->start();
```

```php
<?php
use Swoole\Server;

// 示例二：UDP 服務
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE, SWOOLE_UDP);
$server->on('packet', function(Server $server, string $data, array $clientInfo) {
  echo "服務器類型：" . $server->type . PHP_EOL;
});

$server->start();
```

該屬性會返回以下常量值之一：

- [`SWOOLE_SOCK_TCP`](/zh-hant/client/tcp_udp.html#construct)：TCP IPv4 Socket
- `SWOOLE_SOCK_TCP6`：TCP IPv6 Socket
- `SWOOLE_SOCK_UDP`：UDP IPv4 Socket
- `SWOOLE_SOCK_UDP6`：UDP IPv6 Socket
- `SWOOLE_SOCK_UNIX_DGRAM`（亦寫作 `SWOOLE_UNIX_DGRAM`）：Unix Socket Dgram
- `SWOOLE_SOCK_UNIX_STREAM`（亦寫作 `SWOOLE_UNIX_STREAM`）：Unix Socket Stream

### ssl

返回當前服務器是否啓動 `ssl`，該屬性是一個 `bool` 類型。

```php
public bool $ssl
```

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

// 示例：HTTP 服務
$server = new Server('127.0.0.1', 443, SWOOLE_BASE, SWOOLE_TCP | SWOOLE_SSL);
$server->on('request', function(Request $request, Response $response) use ($server) {
  echo "是否開啓ssl加密：" . $server->ssl . PHP_EOL;
});

$server->start();
```

### ports

如果服務器通過 [Swoole\Server->listen()](/zh-hant/server/methods.html#listen) 監聽了多個端口，可以遍歷 `Swoole\Server::$ports` 得到所有 [`Swoole\Server\Port`](/zh-hant/server/class/port.html) 對象。

其中 `Swoole\Server::$ports[0]` 爲構造方法所設置的主服務器端口。

```php
public array $ports
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501); // 主服務器端口
$port = $server->listen('127.0.0.1', 9502);

$server->on('receive', function ($server, $fd, $reactor_id, $data) {
  foreach($server->ports as $port) {
    echo "監聽端口爲：" . $port->port . PHP_EOL;
  }
});
$server->start();
```

## 進程與線程

### mode

返回當前服務器的進程模式 `mode`，該屬性是一個 `int` 類型的整數。

```php
public int $mode
```

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

// 示例：HTTP 服務
$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) use ($server) {
  echo "服務器模式：" . $server->mode . PHP_EOL;
});

$server->start();
```

> [!TIP]
> 該屬性返回以下值之一：[`SWOOLE_BASE`](/zh-hant/server/process_thread.html#swoole-base) — 多進程模式（無 master 進程），[`SWOOLE_PROCESS`](/zh-hant/server/process_thread.html#swoole-process) — 多進程模式，[`SWOOLE_THREAD`](/zh-hant/server/process_thread.html#swoole-thread) — 多線程模式。

### master_pid

返回 `master` 進程的 `PID`。

```php
public int $master_pid
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501);
$server->on('start', function (Server $server){
  echo "master進程id爲：" . $server->master_pid . PHP_EOL;
});

$server->on('receive', function ($server, $fd, $reactor_id, $data) {
});

$server->start();
```

> [!TIP]
> `master` 進程僅存在於 `SWOOLE_PROCESS` 模式下，其他模式下該屬性無效。

### manager_pid

返回當前 `manager` 進程的 `PID`，該屬性是一個 `int` 類型的整數。

```php
public int $manager_pid
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server("127.0.0.1", 9501);
$server->on('start', function (Server $server) {
  echo "manager進程id爲：" . $server->manager_pid . PHP_EOL;
});

$server->on('receive', function ($server, $fd, $reactor_id, $data) {

});
$server->start();
```

> [!TIP]
> 只能在 `Start/WorkerStart` 之後獲取到。

### worker_id

得到當前 `worker` 進程或者 `task` 進程的編號，編號從 0 開始，該屬性是一個 `int` 類型的整數。

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
> - 該屬性與 [`onWorkerStart`](/zh-hant/server/events.html#workerstart) 回調中的 `$workerId` 參數含義相同。
> - `worker` 進程和 `task` 進程重啓後 `worker_id` 的值是不變的。
> - 若 [`worker_num`](/zh-hant/server/setting.html#worker-num) 設爲 4，則 `worker` 進程編號範圍爲 `[0, worker_num - 1]`，即 `[0, 3]`。
> - 若 `worker_num` 爲 4，[`task_worker_num`](/zh-hant/server/setting.html#task-worker-num) 爲 8，則 `task` 進程的編號範圍爲 `[worker_num, worker_num + task_worker_num - 1]`，即 `[4, 11]`。

### taskworker

當前進程是否是 `Task` 進程，`true` 表示當前的進程是 `Task` 工作進程，`false` 表示當前的進程是其他進程，該屬性是一個 `bool` 類型。

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
  var_dump($server->taskworker); // task進程輸出true
});

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  var_dump($server->taskworker); // worker進程輸出false
});

$server->start();
```

### worker_pid

得到當前 `worker` 進程的 `PID`，該屬性是一個 `int` 類型的整數。

```php
public int $worker_pid
```

**示例**

```php
<?php
use Swoole\Server;
$server = new Server('127.0.0.1', 9501);
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "worker進程PID爲：" . $server->worker_pid . PHP_EOL;
});

$server->start();
```

> [!TIP]
> `SWOOLE_BASE` 和 `SWOOLE_PROCESS` 模式下，該屬性的值與 `posix_getpid()` 的返回值相同。

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
> `SWOOLE_THREAD` 模式下，該屬性的值與 [`Swoole\Thread::getId()`](/zh-hant/thread/create.html#getid) 的返回值相同。

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

