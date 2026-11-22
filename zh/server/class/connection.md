# Swoole\Coroutine\Server\Connection

当 [TCP/UDP 协程服务器](/zh/server/coroutine/tcp_udp.html) 接收请求并触发回调函数时，会传入一个 `Swoole\Coroutine\Server\Connection` 对象。您可以通过该对象来处理当前请求并获取其相关信息。

## 方法

### recv

接收数据，如果设置了协议处理，将每次返回完整的包。

```php
public function recv(float $timeout = 0): string|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 设置超时时间，单位为秒，支持浮点型，如 `1.5` 表示 `1s`+`500ms` | `0` |

**返回值**：接收成功返回一个完整协议数据包；接收失败返回 `false`，并设置 `errCode` 属性；接收超时，错误码为 `ETIMEDOUT`。

### send

发送数据。

```php
public function send(string $data): int|false
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$data` | 要发送的数据内容，可以为文本或二进制数据 | 必填 |

**返回值**：`send` 会保证数据全部发送成功，但是 `send` 期间对端有可能将连接断开，此时可能发送成功了部分数据，返回值会返回这个成功数据的长度，应用层代码需要对比返回值与 `strlen($data)` 是否相等来判断是否发送完成，根据业务需求是否需要续传。发送失败返回 `false`。

### close

关闭连接

```php
public function close(): bool
```

### exportSocket

得到当前连接的 [`Socket`](/zh/client/socket.html) 对象。可调用更多底层的方法。

```php
public function exportSocket(): Swoole\Coroutine\Socket
```