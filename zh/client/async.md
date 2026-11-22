# 异步回调客户端

[Swoole\Client](/zh/client/sync.html) 支持同步阻塞和异步非阻塞两种模式。构造方法的第二个参数 `$async` 设置为 `true` 时，客户端以异步非阻塞模式运行，支持 `TCP/UDP/UnixSocket`。此模式下需通过事件回调处理数据，而非同步等待。

## 方法

### __construct

构造方法

```php
public function __construct(int $type, bool $async = false, string $id = '')
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$type` | 表示连接的类型【支持 `SWOOLE_SOCK_TCP`、`SWOOLE_SOCK_TCP6`、`SWOOLE_SOCK_UDP`、`SWOOLE_SOCK_UDP6`】 | 必填 |
| `$async` | 是否启用异步非阻塞模式，本页的用法需设置为 `true` | `false` |
| `$id` | 用于长连接的 `key`【默认使用 `IP:PORT` 作为 `key`。相同的 `key`，即使 new 两次也只用一个 TCP 连接】 | `IP:PORT` |

### on

注册事件回调函数。

```php
public function on(string $event, callable $callback): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$event` | 回调事件名称，大小写不敏感 | 必填 |
| `$callback` | 回调函数 | 必填 |

**返回值**：返回 `true` 表示操作成功，返回 `false` 表示操作失败。

**支持的事件**

| 事件名称          | 触发时机                          | 回调参数                                  |
|:--------------|:------------------------------|:--------------------------------------|
| `connect`     | 客户端成功连接到服务器时触发。               | `$cli` (客户端对象实例)。                     |
| `receive`     | 客户端接收到来自服务器的数据时触发。            | `$cli` (客户端对象实例), `$data` (接收到的数据内容)。 |
| `error`       | 客户端发生网络错误（如连接超时、连接被拒）时触发。     | `$cli` (客户端对象实例)。                     |
| `close`       | 客户端连接被关闭时触发。                  | `$cli` (客户端对象实例)。                     |
| `bufferFull`  | 输出缓冲区已满，达到高水位标记时触发（通常用于流量控制）。 | `$cli` (客户端对象实例)。                     |
| `bufferEmpty` | 输出缓冲区数据已全部发送，降至低水位标记时触发。      | `$cli` (客户端对象实例)。                     |

**示例**

```php
<?php
use Swoole\Client;

$client = new Client(SWOOLE_SOCK_TCP, true);

$client->on('connect', function(Client $client) {
});

$client->on('receive', function(Client $client, string $data) {
});

$client->on('error', function(Client $client) {
});

$client->on('close', function(Client $client) {
});

$client->on('bufferFull', function(Client $client) {
});

$client->on('bufferEmpty', function(Client $client) {
});
```

> [!WARNING]
> 重复调用 `on` 方法时会覆盖上一次的设定。
> 必须在 `connect` 方法执行之前调用

### connect

连接服务器。

```php
public function connect(string $host, int $port = 0, float $timeout = 0.5, int $flag = 0): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$host` | 服务器地址【支持自动异步解析域名，`$host` 可直接传入域名】 | 必填 |
| `$port` | 服务器端口 | `0` |
| `$timeout` | 设置超时时间；值单位：秒【支持浮点型，如 `1.5` 表示 `1s`+`500ms`】 | `0.5` |
| `$flag` | `UDP客户端` 设置 `$flag = 1` 时，连接会被“绑定”到 `connect` 方法中指定的 `$host` 和 `$port`。此后，它将只接收来自这个特定 IP 和端口的数据包，并丢弃所有其他来源的数据。这可以让你在 UDP 这种 `无连接` 协议上，模拟出一个类似“连接”的行为；`TCP客户端` 设置 `$flag = 1` 时，表示设置为非阻塞模式，之后此 `fd` 会变成异步 IO，`connect` 会立即返回。 | `0` |

**返回值**：成功返回 `true`。失败返回 `false`，请检查 [`errCode`](/zh/client/sync.html#errcode) 属性获取失败原因。

### enableSSL

动态开启 `SSL/TLS` 加密，一般用于 `startTLS` 客户端。在连接建立后先发送明文数据，然后再开启加密传输。

```php
public function enableSSL(?callable $callback): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$callback` | 回调函数 | 必填 |

**返回值**：成功返回 `true`。失败返回 `false`，请检查 `errCode` 属性获取失败原因。

> [!WARNING]
> 使用 `SWOOLE_SSL` 直接建立加密连接时，必须在 `connect` 方法执行之前调用；使用 `startTLS` 方式（连接建立后先发送明文数据）时，在 `connect` 之后调用。

### pause

暂时停止接收数据，调用后将从事件循环中移出，不再触发数据接收事件。

```php
public function pause(): bool
```

**返回值**：成功返回 `true`。失败返回 `false`。

### resume

恢复接收数据，调用后将加入事件循环。

```php
public function resume(): bool
```

**返回值**：成功返回 `true`。失败返回 `false`。

## 示例

```php
<?php
use Swoole\Client;
// 创建一个异步TCP客户端
$client = new Client(SWOOLE_SOCK_TCP, true);

// 注册事件回调函数
$client->on("connect", function(Client $cli) {
    echo "连接成功\n";
    $cli->send("Hello, Server!\n"); // 连接成功后发送数据
});

$client->on("receive", function(Client $cli, $data){
    echo "收到服务器数据: " . $data . "\n";
    // 收到数据后，可以在此处继续处理或关闭连接
    // $cli->close();
});

$client->on("error", function(Client $cli){
    // 可以通过 $cli->errCode 获取错误码，连接超时错误码为 ETIMEOUT
    echo "连接失败\n";
});

$client->on("close", function(Client $cli){
    echo "连接已关闭\n";
});

// 发起连接，第三个参数是超时时间（秒）
$client->connect('127.0.0.1', 9501, 0.5);
```
