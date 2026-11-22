# WebSocket 服務器

我們可以通過實例化 `Swoole\WebSocket\Server` 來創建一個 WebSocket 服務器。

`Swoole\WebSocket\Server`、`Swoole\WebSocket\Frame` 和 `Swoole\WebSocket\CloseFrame` 三者共同構成了完整的 WebSocket 服務器體系。

其中，[Frame 對象](/zh-hant/server/class/frame.html)用於封裝客戶端發送的數據幀，而 [CloseFrame 對象](/zh-hant/server/class/close_frame.html)則代表關閉幀，用於處理連接關閉的邏輯。以下是一個簡單示例，展示了它們的基本用法。

> [!NOTE]
> `Swoole\WebSocket\Server` 是 [`Swoole\Http\Server`](/zh-hant/server/http.html) 的子類。

## 示例

### 示例1：創建一個簡單的 WebSocket 服務器

在服務器上監聽 `127.0.0.1` 的 `9501` 端口，實現一個基本的 WebSocket 服務器：

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
  $response = new Frame();
  $response->data = $frame->data;
  $response->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
  $response->finish = true;
  
  $server->push($frame->fd, $response);
});

$server->start();
```

**測試服務器**

打開另一個終端，使用 `uwsc` 發送 WebSocket 請求：

```bash
uwsc ws://127.0.0.1:9501/
```

輸入 Hello Swoole，回車後我們會看到終端會輸出：

```
Server message: 'Hello Swoole'
```

### 示例2：創建一個簡單的 WebSocket 服務器，發送連續幀

在服務器上監聽 `127.0.0.1` 的 `9501` 端口，向客戶端發送連續幀：

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
  $response = new Frame();
  
  for ($i = 0; $i < 100; $i++) {
    $response->data = base64_encode(random_bytes(200));
    if ($i == 0) {
      $response->opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT;
    } else {
      $response->opcode = SWOOLE_WEBSOCKET_OPCODE_CONTINUATION;
    }
    
    $response->finish = $i == 99;
    $server->push($frame->fd, $response);
  }
});

$server->start();
```

**測試服務器**

打開另一個終端，使用 `uwsc` 發送 WebSocket 請求：

```bash
uwsc ws://127.0.0.1:9501/
```

隨便輸入一些信息，回車後我們會看到終端會輸出：

```
Server message: 大量的隨機信息
```

### 示例3：使用 WebSocket 服務器監聽 HTTP 請求

在服務器上監聽 `127.0.0.1:9501` 啓動 WebSocket 服務時，由於 `Swoole\WebSocket\Server` 繼承自 `Swoole\Http\Server`，因此該服務能夠同時處理 WebSocket 連接和普通 HTTP 請求。

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
  $server->push($frame->fd, $frame->data);
});

$server->on('request', function(Request $request, Response $response) {
  $response->end("<h1>Hello World</h1>");
});

$server->start();
```

**測試服務器**

打開另一個終端，使用 `curl` 發送 HTTP 請求：

```bash
curl http://127.0.0.1:9501/
```

我們會看到終端會輸出：

```
<h1>Hello World</h1>
```
