# Swoole\WebSocket\CloseFrame

`Swoole\WebSocket\CloseFrame` 是 `Swoole` 中用於表示和管理 `WebSocket` 連接 `關閉幀` 的一個特殊類。它在原有普通 [Swoole\WebSocket\Frame](/zh-hant/server/class/frame.html) 類的基礎上，增加了處理連接關閉時所需的“狀態碼”和“原因”信息，讓開發者可以優雅地處理或發起連接關閉流程。

> [!WARNING]
> 該類較少使用，請使用下面的方法實現優雅關閉 `WebSocket` 連接。
>
> - 如果是 `WebSocket` 異步服務端，請用 [disconnect](/zh-hant/server/methods.html#disconnect) 來關閉連接。
> - 如果是 `WebSocket` 協程服務端，請用 [disconnect](/zh-hant/server/class/response.html#disconnect) 來關閉連接。

## 屬性

### opcode

操作碼，對於關閉幀，其值固定爲 `SWOOLE_WEBSOCKET_OPCODE_CLOSE`

```php
public int $opcode = SWOOLE_WEBSOCKET_OPCODE_CLOSE
```

### code

核心屬性，一個整數，表示連接關閉的狀態碼。

```php
public int $code = SWOOLE_WEBSOCKET_CLOSE_NORMAL
```

**支持的狀態碼**

| 狀態碼常量 | 中文說明 |
|:---|:---|
| SWOOLE_WEBSOCKET_CLOSE_NORMAL             | **正常關閉** - 連接已完成工作，正常結束                   |
| SWOOLE_WEBSOCKET_CLOSE_GOING_AWAY         | **正在離開** - 端點離開（如瀏覽器跳轉或關閉頁面）              |
| SWOOLE_WEBSOCKET_CLOSE_PROTOCOL_ERROR     | **協議錯誤** - 端點收到不符合 WebSocket 協議的數據        |
| SWOOLE_WEBSOCKET_CLOSE_DATA_ERROR         | **數據類型錯誤** - 收到無法處理的數據類型（如端點只接收文本卻收到二進制）  |
| SWOOLE_WEBSOCKET_CLOSE_STATUS_ERROR       | **狀態碼無效** - 預期收到狀態碼但未收到（實際不發送此碼，用於應用）     |
| SWOOLE_WEBSOCKET_CLOSE_ABNORMAL           | **異常關閉** - 連接非預期斷開（如沒收到關閉幀就斷開，不主動發送）      |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_ERROR      | **消息格式錯誤** - 收到不符合規範的消息（如 UTF-8 編碼錯誤）     |
| SWOOLE_WEBSOCKET_CLOSE_POLICY_ERROR       | **違反策略** - 消息違反服務器策略（通用拒絕原因）              |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_TOO_BIG    | **消息過大** - 消息長度超出端點願意處理的範圍                |
| SWOOLE_WEBSOCKET_CLOSE_EXTENSION_MISSING  | **缺少擴展** - 客戶端期望服務器協商特定擴展，但服務器未提供（客戶端專用）  |
| SWOOLE_WEBSOCKET_CLOSE_SERVER_ERROR       | **服務器內部錯誤** - 服務器遇到異常情況無法完成請求             |
| SWOOLE_WEBSOCKET_CLOSE_TRY_AGAIN_LATER    | **稍後重試** - 服務器臨時過載或維護中，建議稍後再連             |
| SWOOLE_WEBSOCKET_CLOSE_BAD_GATEWAY        | **網關錯誤** - 網關或代理收到無效的上游響應   |
| SWOOLE_WEBSOCKET_CLOSE_TLS                | **TLS 握手失敗** - TLS 握手未完成就關閉（不主動發送）        |

### reason

核心屬性，一個字符串，提供了連接關閉的文本原因（UTF-8 編碼，不超過 125 字節）。

```php
public string $reason = ''
```

## 示例

```php
<?php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;
use Swoole\WebSocket\CloseFrame;

$server = new Server('127.0.0.1', 9501);
$server->on('message', function(Server $server, Frame $frame) {
    $closeFrame = new CloseFrame();
    $closeFrame->opcode = SWOOLE_WEBSOCKET_OPCODE_CLOSE;
    $closeFrame->code = SWOOLE_WEBSOCKET_CLOSE_NORMAL;
    $server->push($frame->fd, $closeFrame);
    $server->close($frame->fd);
});

$server->start();
```