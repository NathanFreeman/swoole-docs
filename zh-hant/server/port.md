# 多端口監聽

`Swoole` 支持單服務多端口監聽，每個端口可獨立配置協議（如 HTTP、TCP、WebSocket）與 SSL/TLS 加密，實現協議隔離與安全通信，無需啓動多個服務進程。

## 監聽新端口

`Swoole` 通過 [listen](/zh-hant/server/methods.html#listen) 方法監聽多個端口。該方法返回 [Swoole\Server\Port](/zh-hant/server/class/port.html) 對象。這意味着你可以同時處理 HTTP、TCP、UDP 等不同協議，實現高效的端口複用。

**示例**

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9501);

// 監聽 9502 端口，純 TCP 協議
$port1 = $server->listen("127.0.0.1", 9502, SWOOLE_SOCK_TCP);

// 監聽 9503 端口，純 TCP 協議
$port2 = $server->listen("127.0.0.1", 9503, SWOOLE_SOCK_TCP);

// 監聽 9504 端口，純 TCP 協議
$port3 = $server->listen("127.0.0.1", 9504, SWOOLE_SOCK_TCP);

$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {

});

$server->start();
```

## 協議配置和事件回調

- 當你通過 [listen](/zh-hant/server/methods.html#listen) 添加一個新端口時，它就像一個“克隆體”，默認會繼承主端口的協議配置（如 `HTTP`、`WebSocket`）和事件回調。假設主端口配置爲 `HTTP` 服務時，新監聽的端口若未顯式配置，將直接繼承主端口的 `HTTP` 協議設置，自動以 HTTP 服務模式運行。

- 如果你想讓新端口處理不同的協議（例如主端口是 `HTTP`，新端口是 `TCP`），你必須顯式地調用 [on](/zh-hant/server/class/port.html#on) 和 [set](/zh-hant/server/class/port.html#set) 來修改協議配置，並重新綁定事件。

**示例一：TCP 端口配置覆蓋，主端口 9501 是 TCP，子端口 9502 也是 TCP，但處理邏輯和包長規則不同。**

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9501);

// 1. 主端口配置：假設用於處理某種定長包
$server->set([
    'open_length_check' => true,
    'package_length_type' => 'C',
    'package_length_offset' => 100, // 假設第100字節是包長度的值
    'package_max_length' => 1000,  // 發送到9501端口的數據一定不會超過1000字節
]);

// 主端口接收事件
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    echo "9501 端口收到數據\n";
});

// 2. 監聽子端口 9502
$port = $server->listen("127.0.0.1", 9502, SWOOLE_SOCK_TCP);

// 【關鍵】必須重寫配置，否則 9502 也會使用上面的 package_length_type=C，package_length_offset=100和package_max_length=1000
$port->set([
    'open_length_check' => true,
    'package_length_type' => 'N',
    'package_length_offset' => 200, // 假設第200字節是包長度的值
    'package_max_length' => 800000, // 發送到9502端口的數據一定不會超過800000字節
]);

// 【關鍵】必須爲子端口單獨綁定事件，否則還是觸發主端口的receive事件
$port->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    echo "9502 端口收到數據，使用不同的解析規則\n";
});

$server->start();
```

**示例二：主端口 9501 是 HTTP 服務，想加一個 9502 端口專門做 TCP 透傳。**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501);

// 主端口 HTTP 邏輯
$server->on('request', function(Request $request, Response $response) {
    $response->end("Hello HTTP");
});

// 監聽子端口 9502
$port = $server->listen('127.0.0.1', 9502, SWOOLE_SOCK_TCP);

// 【關鍵步驟 1】重置協議配置
// 如果不寫這一步，9502 端口收到的數據會被當成 HTTP 請求解析，導致失敗
$port->set([
    'open_http_protocol' => false, // 關閉 HTTP 協議
    // 這裏可以添加 TCP 相關的配置，如 open_length_check 等
]);

// 【關鍵步驟 2】在 $port 對象上綁定 receive 事件
// 注意：不能寫在 $server->on('receive') 裏，因爲主服務器是 HTTP 模式，不支持 receive
$port->on('receive', function($server, $fd, $reactorId, $data) {
    $server->send($fd, "TCP Port 9502 received: $data");
});

$server->start();
```

## 混合監聽不同協議的限制

> [!TIP]
> [`Swoole\Http\Server`](/zh-hant/server/http.html) 是通過繼承 [`Swoole\Server`](/zh-hant/server/tcp_udp.html) 實現的，[`Swoole\WebSocket\Server`](/zh-hant/server/websocket.html) 是通過繼承 `Swoole\Http\Server` 實現的。因此，如果你創建了一個普通的 `TCP` 服務器，無法通過 [listen](/zh-hant/server/methods.html#listen) 方法給它添加 `HTTP` 或 `WebSocket` 子端口。

```php
// HTTP 服務器的 request 事件
function (Swoole\Http\Request $request, Swoole\Http\Response $response)

// WebSocket 服務器的 message 事件
function (Swoole\WebSocket\Server $server, Swoole\WebSocket\Frame $frame)
```

從上述兩個函數簽名可以看出，如果通過 `Swoole\Server` 在主服務器之外的新端口監聽 `WebSocket` 協議，當觸發 [message 事件](/zh-hant/server/events.html#message) 時，回調函數期望接收一個 `Swoole\WebSocket\Server` 類型的對象。然而，此時的主服務器類型爲 `Swoole\Server`，實際傳入的卻是 `Swoole\Server` 對象，導致參數類型不匹配而報錯。

雖然當前 [request 事件](/zh-hant/server/events.html#request) 不需要傳入 `$server` 參數，但考慮到未來 API 的擴展性，後續版本可能會爲 `Swoole\Http\Server` 引入專屬方法，屆時同樣會出現類似的類型不一致問題。

因此，**禁止**由父類（`Swoole\Server`）在新端口監聽一個子類服務器（如 `Swoole\WebSocket\Server` 或 `Swoole\Http\Server`），推薦改爲由子類在新端口監聽父類服務器，以確保回調參數類型始終正確。

**錯誤示例**

```php
<?php
use Swoole\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\WebSocket\Server as WebsocketServer;
use Swoole\WebSocket\Frame;


// 創建一個 TCP 服務器
$server = new Server('127.0.0.1', 9501);  // 主端口監聽TCP
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
  echo "Hello TCP!!!";
});

// 嘗試在子端口 9502 監聽 HTTP 協議 —— 無效
$port1 = $server->listen("127.0.0.1", 9502, SWOOLE_SOCK_TCP);
$port1->set([
  'open_http_protocol' => true,
  'package_max_length' => 800000,
]);
$port1->on('request', function(Request $request, Response $response) {
  echo "Hello HTTP!!!";
});

// 嘗試在子端口 9503 監聽 Websocket 協議 —— 無效
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

**正確做法**

- 場景：你的主要功能是 `HTTP/WebSocket`，但還想提供一個簡單的 TCP 管理接口。
- 解決方案：先創建 `HTTP 或 WebSocket` 服務器，再通過 [listen](/zh-hant/server/methods.html#listen) 添加 `TCP` 子端口。

```php
<?php
use Swoole\Server as TcpServer;
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

// 先啓動一個 HTTP 服務器
$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
  $response->header("Content-Type", "text/html; charset=utf-8");
  $response->end("<h1>Hello Swoole. #".rand(1000, 9999)."</h1>");
});

// 監聽 TCP 服務器
$port = $http->listen('127.0.0.1', 9502, SWOOLE_TCP);
// 重置從 HTTP 服務器繼承過來的協議配置
$port->set(['open_http_protocol' => false]); 
// 重新設置事件監聽
$port->on('receive', function(TcpServer $server, int $fd, int $reactorId, string $data) {

});

$http->start();
```

| 主服務器類型 | 能否添加 HTTP 子端口 | 能否添加 WebSocket 子端口 | 能否添加 TCP 子端口 |
|------------|-------------------|-------------------------|-------------------|
| TCP        | ❌ 不行 | ❌ 不行 | ✅ 可以 |
| HTTP       | ✅ 可以 | ❌ 不行 | ✅ 可以 |
| WebSocket  | ✅ 可以 | ✅ 可以 | ✅ 可以 |



