# HTTP 协程服务器

- `Swoole\Coroutine\Http\Server` 是 `Swoole` 基于协程实现的轻量级高性能 `HTTP` 服务器。它最大的特点是：**允许开发者以同步顺序的代码风格，获得非阻塞 I/O 的高并发性能**。底层通过协程的自动挂起与恢复，在等待 I/O 时让出 CPU，从而在**单进程内即可支撑海量连接**。

## 方法

### __construct

创建一个 `HTTP` 协程服务器。

```php
public function __construct(string $host, int $port = 0, bool $ssl = false, bool $reuse_port = false)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 监听的 IP 地址 | 必填 |
| `$port` | 监听端口，取值 `0~65535` | `0`（随机监听一个空闲端口） |
| `$ssl` | 是否启用 `SSL/TLS` 隧道加密，可填 `true` | `false` |
| `$reuse_port` | 是否启用端口复用特性，开启后多个服务可以共用一个端口，可填 `true` | `false` |

### set

设置 `HTTP` 协程服务器运行配置。

```php
public function set(array $settings): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$settings` | `HTTP` 协程服务器运行配置 | 必填 |

**返回值**：执行成功返回 `true`，操作失败返回 `false`。

### handle

注册回调函数以处理参数 `$pattern` 所指示路径下的 HTTP 请求。

```php
public function handle(string $pattern, callable $callback): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$pattern` | 设置 `URL` 路径【如 `/index.html`，注意这里不能传入 `http://domain`】 | 必填 |
| `$callback` | 回调函数 | 必填 |

**`$callback` 函数签名**

```php
function (Swoole\Http\Request $request, Swoole\Http\Response $response)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$request` | `HTTP` 请求对象，保存了 `HTTP` 客户端请求的相关信息，包括 `GET`、`POST`、`COOKIE`、`Header` 等 | 必填 |
| `$response` | `HTTP` 响应对象，通过调用此对象的函数，实现 `HTTP` 响应发送 | 必填 |

> [!WARNING]
> - 必须要在 [start](/zh/server/coroutine/http.html#start) 执行前，设置好回调函数。
> - 服务器建立连接后，会自动创建协程执行 `$callback` 处理 `HTTP` 请求。
> - 如果是长链接 `KeepAlive`，子协程会循环继续接受新的请求，而不退出。否则会停止接受请求，并且退出和关闭连接。
> - `$pattern` 设置相同路径时，新的设置会覆盖旧的设置。未设置 `/` 根路径处理函数并且请求的路径没有找到任何匹配的 `$pattern`，Swoole 将返回 `404` 错误。
> - `$pattern` 使用字符串匹配的方法，不支持通配符和正则，不区分大小写，匹配算法是前缀匹配，例如：url 是 `/test111` 会匹配到 `/test` 这个规则，匹配到即跳出匹配忽略后面的配置；推荐设置 `/` 根路径处理函数。

### start

启动 `HTTP` 协程服务器。

```php
public function start(): bool
```

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

### shutdown

关闭 `HTTP` 协程服务器。

```php
public function shutdown(): void
```

## 示例

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Process;
use Swoole\Process\Pool;
use function Swoole\Coroutine\run;

$pool = new Pool(5);
$pool->set(['enable_coroutine' => true]); // 必须开启协程
$pool->on('workerStart', function (Pool $pool, $workerId) {
    // $reuse_port 必须设置成true，否则无法实现多进程监听同一个端口
    $server = new Server('127.0.0.1', 9502, false, true);
    $server->handle('/', function (Request $request, Response $response) {
        $response->end("<h1>Index</h1>");
    });
    $server->handle('/test', function (Request $request, Response $response) {
        $response->end("<h1>Test</h1>");
    });
    $server->handle('/stop', function (Request $request, Response $response) use ($server) {
        $response->end("<h1>Stop</h1>");
        $server->shutdown(); // 协程服务器退出后，子进程也会退出，会被主进程重新拉起
    });
    $server->start();
});

$pool->start();
```

## 注意

- `Swoole\Coroutine\Http\Server` 默认是**单进程**运行，无法充分利用多核 CPU。如需在多核环境下部署，建议配合 [`Swoole\Process\Pool`](/zh/process/pool.html) 实现多进程管理。
- `Swoole\Coroutine\Http\Server` 自带对 `HTTP2` 的支持，不需要像 [HTTP2 服务器](/zh/server/http.html) 那样手动指定 [open_http2_protocol](/zh/server/setting.html#open-http2-protocol)。