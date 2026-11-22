# TCP/UDP 服務器

你可以通過實例化 `Swoole\Server` 對象來創建 TCP 或 UDP 服務器。`Swoole\Server` 是所有異步風格服務器的基類，後續章節介紹的 [`Swoole\Http\Server`](/zh-hant/server/http.html)、[`Swoole\WebSocket\Server`](/zh-hant/server/websocket.html)、[`Swoole\Redis\Server`](/zh-hant/server/redis.html) 等類都繼承自它。

## 示例

### 示例1：創建一個簡單的 TCP 服務器

在服務器上監聽 `127.0.0.1` 的 `9501` 端口，實現一個基本的 TCP 服務器：

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9501);

$server->on('receive', function (Server $server, int $fd, int $reactorId, string $data) {
    $server->send($fd, 'Hello World');
});

$server->start();
```

**測試服務器**

打開另一個終端，使用 `telnet` 連接服務器：

```bash
telnet 127.0.0.1 9501
```

連接成功後，輸入任意字符並回車，服務器將返回響應內容：

```
Hello World
```

### 示例2：創建一個簡單的 UDP 服務器

在服務器上監聽 `127.0.0.1` 的 `9502` 端口，實現一個基本的 UDP 服務器：

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9502, SWOOLE_BASE, SWOOLE_SOCK_UDP);

$server->on('packet', function (Server $server, mixed $data, array $clientInfo) {
    $server->sendto($clientInfo['address'], $clientInfo['port'], "Hello World");
});

$server->start();
```

**測試服務器**

打開另一個終端，使用 `nc` 連接服務器：

```bash
echo "Hello" | nc -u 127.0.0.1 9502
```

命令發送數據後，服務器將返回響應內容：

```
Hello World
```
