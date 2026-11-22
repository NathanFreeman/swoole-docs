# 多端口监听

`Swoole` 支持单服务多端口监听，每个端口可独立配置协议（如 HTTP、TCP、WebSocket）与 SSL/TLS 加密，实现协议隔离与安全通信，无需启动多个服务进程。

## 监听新端口

`Swoole` 通过 [listen](/zh/server/methods.html#listen) 方法监听多个端口。该方法返回 [Swoole\Server\Port](/zh/server/class/port.html) 对象。这意味着你可以同时处理 HTTP、TCP、UDP 等不同协议，实现高效的端口复用。

**示例**

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9501);

// 监听 9502 端口，纯 TCP 协议
$port1 = $server->listen("127.0.0.1", 9502, SWOOLE_SOCK_TCP);

// 监听 9503 端口，纯 TCP 协议
$port2 = $server->listen("127.0.0.1", 9503, SWOOLE_SOCK_TCP);

// 监听 9504 端口，纯 TCP 协议
$port3 = $server->listen("127.0.0.1", 9504, SWOOLE_SOCK_TCP);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {

});

$server->start();
```

## 协议配置和事件回调

- 当你通过 [listen](/zh/server/methods.html#listen) 添加一个新端口时，它就像一个“克隆体”，默认会继承主端口的协议配置（如 `HTTP`、`WebSocket`）和事件回调。假设主端口配置为 `HTTP` 服务时，新监听的端口若未显式配置，将直接继承主端口的 `HTTP` 协议设置，自动以 HTTP 服务模式运行。

- 如果你想让新端口处理不同的协议（例如主端口是 `HTTP`，新端口是 `TCP`），你必须显式地调用 [on](/zh/server/class/port.html#on) 和 [set](/zh/server/class/port.html#set) 来修改协议配置，并重新绑定事件。

**示例一：TCP 端口配置覆盖，主端口 9501 是 TCP，子端口 9502 也是 TCP，但处理逻辑和包长规则不同。**

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9501);

// 1. 主端口配置：假设用于处理某种定长包
$server->set([
    'open_length_check' => true,
    'package_length_type' => 'C',
    'package_length_offset' => 100, // 假设第100字节是包长度的值
    'package_max_length' => 1000,  // 发送到9501端口的数据一定不会超过1000字节
]);

// 主端口接收事件
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    echo "9501 端口收到数据\n";
});

// 2. 监听子端口 9502
$port = $server->listen("127.0.0.1", 9502, SWOOLE_SOCK_TCP);

// 【关键】必须重写配置，否则 9502 也会使用上面的 package_length_type=C，package_length_offset=100和package_max_length=1000
$port->set([
    'open_length_check' => true,
    'package_length_type' => 'N',
    'package_length_offset' => 200, // 假设第200字节是包长度的值
    'package_max_length' => 800000, // 发送到9502端口的数据一定不会超过800000字节
]);

// 【关键】必须为子端口单独绑定事件，否则还是触发主端口的receive事件
$port->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    echo "9502 端口收到数据，使用不同的解析规则\n";
});

$server->start();
```

**示例二：主端口 9501 是 HTTP 服务，想加一个 9502 端口专门做 TCP 透传。**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501);

// 主端口 HTTP 逻辑
$server->on('request', function(Request $request, Response $response) {
    $response->end("Hello HTTP");
});

// 监听子端口 9502
$port = $server->listen('127.0.0.1', 9502, SWOOLE_SOCK_TCP);

// 【关键步骤 1】重置协议配置
// 如果不写这一步，9502 端口收到的数据会被当成 HTTP 请求解析，导致失败
$port->set([
    'open_http_protocol' => false, // 关闭 HTTP 协议
    // 这里可以添加 TCP 相关的配置，如 open_length_check 等
]);

// 【关键步骤 2】在 $port 对象上绑定 receive 事件
// 注意：不能写在 $server->on('receive') 里，因为主服务器是 HTTP 模式，不支持 receive
$port->on('receive', function($server, $fd, $reactorId, $data) {
    $server->send($fd, "TCP Port 9502 received: $data");
});

$server->start();
```

## 混合监听不同协议的限制

> [!TIP]
> [`Swoole\Http\Server`](/zh/server/http.html) 是通过继承 [`Swoole\Server`](/zh/server/tcp_udp.html) 实现的，[`Swoole\WebSocket\Server`](/zh/server/websocket.html) 是通过继承 `Swoole\Http\Server` 实现的。因此，如果你创建了一个普通的 `TCP` 服务器，无法通过 [listen](/zh/server/methods.html#listen) 方法给它添加 `HTTP` 或 `WebSocket` 子端口。

```php
// HTTP 服务器的 request 事件
function (Swoole\Http\Request $request, Swoole\Http\Response $response)

// WebSocket 服务器的 message 事件
function (Swoole\WebSocket\Server $server, Swoole\WebSocket\Frame $frame)
```

从上述两个函数签名可以看出，如果通过 `Swoole\Server` 在主服务器之外的新端口监听 `WebSocket` 协议，当触发 [message 事件](/zh/server/events.html#message) 时，回调函数期望接收一个 `Swoole\WebSocket\Server` 类型的对象。然而，此时的主服务器类型为 `Swoole\Server`，实际传入的却是 `Swoole\Server` 对象，导致参数类型不匹配而报错。

虽然当前 [request 事件](/zh/server/events.html#request) 不需要传入 `$server` 参数，但考虑到未来 API 的扩展性，后续版本可能会为 `Swoole\Http\Server` 引入专属方法，届时同样会出现类似的类型不一致问题。

因此，**禁止**由父类（`Swoole\Server`）在新端口监听一个子类服务器（如 `Swoole\WebSocket\Server` 或 `Swoole\Http\Server`），推荐改为由子类在新端口监听父类服务器，以确保回调参数类型始终正确。

**错误示例**

```php
<?php
use Swoole\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\WebSocket\Server as WebsocketServer;
use Swoole\WebSocket\Frame;


// 创建一个 TCP 服务器
$server = new Server('127.0.0.1', 9501);  // 主端口监听TCP
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "Hello TCP!!!";
});

// 尝试在子端口 9502 监听 HTTP 协议 —— 无效
$port1 = $server->listen("127.0.0.1", 9502, SWOOLE_SOCK_TCP);
$port1->set([
  'open_http_protocol' => true,
  'package_max_length' => 800000,
]);
$port1->on('request', function(Request $request, Response $response) {
  echo "Hello HTTP!!!";
});

// 尝试在子端口 9503 监听 Websocket 协议 —— 无效
$port2 = $server->listen("127.0.0.1", 9503, SWOOLE_SOCK_TCP);
$port2->set([
  'open_websocket_protocol' => true,
  'package_max_length' => 800000,
]);
$port2->on('message', function (WebsocketServer $server,  Frame $frame) {
  echo "Hello Websocket!!!";
});

$server->start();
```

**正确做法**

- 场景：你的主要功能是 `HTTP/WebSocket`，但还想提供一个简单的 TCP 管理接口。
- 解决方案：先创建 `HTTP 或 WebSocket` 服务器，再通过 [listen](/zh/server/methods.html#listen) 添加 `TCP` 子端口。

```php
<?php
use Swoole\Server as TcpServer;
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

// 先启动一个 HTTP 服务器
$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $response->header("Content-Type", "text/html; charset=utf-8");
  $response->end("<h1>Hello Swoole. #".rand(1000, 9999)."</h1>");
});

// 监听 TCP 服务器
$port = $http->listen('127.0.0.1', 9502, SWOOLE_TCP);
// 重置从 HTTP 服务器继承过来的协议配置
$port->set(['open_http_protocol' => false]); 
// 重新设置事件监听
$port->on('receive', function(TcpServer $server, int $fd, int $reactorId, string $data) {

});

$http->start();
```

| 主服务器类型 | 能否添加 HTTP 子端口 | 能否添加 WebSocket 子端口 | 能否添加 TCP 子端口 |
|------------|-------------------|-------------------------|-------------------|
| TCP        | ❌ 不行 | ❌ 不行 | ✅ 可以 |
| HTTP       | ✅ 可以 | ❌ 不行 | ✅ 可以 |
| WebSocket  | ✅ 可以 | ✅ 可以 | ✅ 可以 |



