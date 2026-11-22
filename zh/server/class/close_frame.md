# Swoole\WebSocket\CloseFrame

`Swoole\WebSocket\CloseFrame` 是 `Swoole` 中用于表示和管理 `WebSocket` 连接 `关闭帧` 的一个特殊类。它在原有普通 [Swoole\WebSocket\Frame](/zh/server/class/frame.html) 类的基础上，增加了处理连接关闭时所需的“状态码”和“原因”信息，让开发者可以优雅地处理或发起连接关闭流程。

> [!WARNING]
> 该类较少使用，请使用下面的方法实现优雅关闭 `WebSocket` 连接。
>
> - 如果是 `WebSocket` 异步服务端，请用 [disconnect](/zh/server/methods.html#disconnect) 来关闭连接。
> - 如果是 `WebSocket` 协程服务端，请用 [disconnect](/zh/server/class/response.html#disconnect) 来关闭连接。

## 属性

### opcode

操作码，对于关闭帧，其值固定为 `SWOOLE_WEBSOCKET_CLOSE_NORMAL`

```php
public int $opcode = SWOOLE_WEBSOCKET_CLOSE_NORMAL
```

### code

核心属性，一个整数，表示连接关闭的状态码。

```php
public int $code = SWOOLE_WEBSOCKET_CLOSE_NORMAL
```

**支持的状态码**

| 状态码常量 | 中文说明 |
|:---|:---|
| SWOOLE_WEBSOCKET_CLOSE_NORMAL             | **正常关闭** - 连接已完成工作，正常结束                   |
| SWOOLE_WEBSOCKET_CLOSE_GOING_AWAY         | **正在离开** - 端点离开（如浏览器跳转或关闭页面）              |
| SWOOLE_WEBSOCKET_CLOSE_PROTOCOL_ERROR     | **协议错误** - 端点收到不符合 WebSocket 协议的数据        |
| SWOOLE_WEBSOCKET_CLOSE_DATA_ERROR         | **数据类型错误** - 收到无法处理的数据类型（如端点只接收文本却收到二进制）  |
| SWOOLE_WEBSOCKET_CLOSE_STATUS_ERROR       | **状态码无效** - 预期收到状态码但未收到（实际不发送此码，用于应用）     |
| SWOOLE_WEBSOCKET_CLOSE_ABNORMAL           | **异常关闭** - 连接非预期断开（如没收到关闭帧就断开，不主动发送）      |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_ERROR      | **消息格式错误** - 收到不符合规范的消息（如 UTF-8 编码错误）     |
| SWOOLE_WEBSOCKET_CLOSE_POLICY_ERROR       | **违反策略** - 消息违反服务器策略（通用拒绝原因）              |
| SWOOLE_WEBSOCKET_CLOSE_MESSAGE_TOO_BIG    | **消息过大** - 消息长度超出端点愿意处理的范围                |
| SWOOLE_WEBSOCKET_CLOSE_EXTENSION_MISSING  | **缺少扩展** - 客户端期望服务器协商特定扩展，但服务器未提供（客户端专用）  |
| SWOOLE_WEBSOCKET_CLOSE_SERVER_ERROR       | **服务器内部错误** - 服务器遇到异常情况无法完成请求             |
| SWOOLE_WEBSOCKET_CLOSE_TRY_AGAIN_LATER    | **稍后重试** - 服务器临时过载或维护中，建议稍后再连             |
| SWOOLE_WEBSOCKET_CLOSE_BAD_GATEWAY        | **网关错误** - 网关或代理收到无效的上游响应   |
| SWOOLE_WEBSOCKET_CLOSE_TLS                | **TLS 握手失败** - TLS 握手未完成就关闭（不主动发送）        |

### reason

核心属性，一个字符串，提供了连接关闭的文本原因（UTF-8 编码，不超过 125 字节）。

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
```