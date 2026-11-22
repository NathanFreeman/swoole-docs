# Swoole\Server\Packet

`Swoole\Server\Packet` 是 `Swoole` 服務器在**面向對象事件模式**下傳遞的 `UDP` 數據包對象。把 [event_object](/zh-hant/server/setting.html#event-object) 設置爲 `true` 之後，[packet](/zh-hant/server/events.html#packet) 事件的第二個參數不再是 `$data` 與 `$clientInfo` 兩個分散的參數，而是這一個封裝好的對象，數據內容和來源地址都能直接從屬性上讀到。

## 屬性

### server_socket

服務端文件描述符 `fd`，該屬性是一個 `int` 類型的整數。

```php
public int $server_socket
```

### server_port

服務端監聽端口 `server_port`，該屬性是一個 `int` 類型的整數。

```php
public int $server_port
```

### dispatch_time

該請求數據的到達時間，該屬性是一個 `double` 類型。

```php
public float $dispatch_time
```

### address

客戶端地址 `address`，該屬性是一個 `string` 類型的字符串。

```php
public string $address
```

### port

客戶端端口 `port`，該屬性是一個 `int` 類型的整數。

```php
public int $port
```

### data

客戶端傳遞的數據 `data`，該屬性是一個 `string` 類型的字符串。

```php
public string $data
```

> [!IMPORTANT]
> [UDP 服務器](/zh-hant/server/tcp_udp.html) 必須設置 `packet` 事件。`Packet` 的各屬性與關閉 `event_object` 時 `$clientInfo` 數組的字段一一對應，見 [packet](/zh-hant/server/events.html#packet) 事件中的 `$clientInfo` 說明。

## 示例

```php
<?php
use Swoole\Server;
use Swoole\Server\Packet;

$server = new Server('127.0.0.1', 9502, SWOOLE_PROCESS, SWOOLE_SOCK_UDP);
// 開啓面向對象事件模式
$server->set([
    'event_object' => true,
]);

$server->on('packet', function (Server $server, Packet $packet) {
    printf("%s:%d -> %s\n", $packet->address, $packet->port, $packet->data);
    // 使用 sendto 將數據回傳給客戶端
    $server->sendto($packet->address, $packet->port, 'Hello Swoole', $packet->server_socket);
});

$server->start();
```
