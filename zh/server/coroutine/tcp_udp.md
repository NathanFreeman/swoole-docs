# TCP/UDP 协程服务器

- `Swoole\Coroutine\Server` 是 `Swoole` 基于协程实现的轻量级高性能服务器。它最大的特点是：**允许开发者以同步顺序的代码风格，获得非阻塞 I/O 的高并发性能**。底层通过协程的自动挂起与恢复，在等待 I/O 时让出 CPU，从而在**单进程内即可支撑海量连接**。
- 与 [Swoole\Server](/zh/server/tcp_udp.html) 的核心区别在于编程模型：`Swoole\Coroutine\Server` 让开发者用同步顺序书写的代码实现非阻塞逻辑，底层自动处理 IO 等待时的协程挂起与恢复，而 `Swoole\Server` 需要显式注册回调函数来处理 IO 结果。
- 由于 `Swoole\Coroutine\Server` 是单进程的，无法充分利用多核 `CPU`。如需在多核环境下部署，建议配合 **[`Swoole\Process\Pool`](/zh/process/pool.html)** 实现多进程管理。

## 方法

### __construct

创建一个 TCP 协程服务器。

```php
public function __construct(string $host, int $port = 0, bool $ssl = false, bool $reuse_port = false)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 监听的地址 | 必填 |
| `$port` | 监听的端口，如果为 `0` 将由操作系统随机分配一个端口 | `0` |
| `$ssl` | 是否开启 SSL 加密，可填 `true` | `false` |
| `$reuse_port` | 是否开启端口重用，可填 `true` | `false` |

### set

设置 TCP 协程服务器运行配置。

```php
public function set(array $setting): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$setting` | 服务器运行配置 | 必填 |

### handle

设置连接处理函数。

```php
public function handle(callable $callback): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$callback` | 服务器接收到连接时的核心处理函数。该回调用于处理服务器请求 | 必填 |

**回调函数签名**

```php
function (Swoole\Coroutine\Server\Connection $connection)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$connection` | 客户端连接的对象，详细请查看 [这里](/zh/server/class/connection.html) | 必填 |

> [!IMPORTANT]
> 你必须在启动服务器之前设置这个函数。当连接建立成功后，回调函数被调用来处理请求时，服务器已经为你创建好了一个协程，无需自己再手动创建。

### start

启动 TCP 协程服务器。

```php
public function start(): bool
```

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示失败。

### shutdown

关闭 TCP 协程服务器。

```php
public function shutdown(): bool
```

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示失败。

## 示例

```php
<?php
use Swoole\Process;
use Swoole\Coroutine;
use Swoole\Coroutine\Server;
use Swoole\Coroutine\Server\Connection;

//多进程管理模块
$pool = new Process\Pool(2);
//让每个OnWorkerStart回调都自动创建一个协程
$pool->set(['enable_coroutine' => true]);
$pool->on('workerStart', function ($pool, $id) {
    //每个进程都监听9501端口，此时reuse_port必须设置为true
    $server = new Server('127.0.0.1', 9501, false, true);

    //收到15信号关闭服务
    Process::signal(SIGTERM, function () use ($server) {
        $server->shutdown();
    });

    //接收到新的连接请求 并自动创建一个协程
    $server->handle(function (Connection $conn) {
        while (true) {
            //接收数据
            $data = $conn->recv(1);

            if ($data === '' || $data === false) {
                $errCode = swoole_last_error();
                $errMsg = socket_strerror($errCode);
                echo "errCode: {$errCode}, errMsg: {$errMsg}\n";
                $conn->close();
                break;
            }

            //发送数据
            $conn->send('hello');

            Coroutine::sleep(1);
        }
    });

    //开始监听端口
    $server->start();
});
$pool->start();
```
