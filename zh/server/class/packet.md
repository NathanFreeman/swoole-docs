# Swoole\Server\Packet

`Swoole\Server\Packet` 是 `Swoole` 服务器在**面向对象事件模式**下传递的 `UDP` 数据包对象。把 [event_object](/zh/server/setting.html#event-object) 设置为 `true` 之后，[packet](/zh/server/events.html#packet) 事件的第二个参数不再是 `$data` 与 `$clientInfo` 两个分散的参数，而是这一个封装好的对象，数据内容和来源地址都能直接从属性上读到。

## 属性

### server_socket

服务端文件描述符 `fd`，该属性是一个 `int` 类型的整数。

```php
public int $server_socket
```

### server_port

服务端监听端口 `server_port`，该属性是一个 `int` 类型的整数。

```php
public int $server_port
```

### dispatch_time

该请求数据的到达时间，该属性是一个 `double` 类型。

```php
public float $dispatch_time
```

### address

客户端地址 `address`，该属性是一个 `string` 类型的字符串。

```php
public string $address
```

### port

客户端端口 `port`，该属性是一个 `int` 类型的整数。

```php
public int $port
```

### data

客户端传递的数据 `data`，该属性是一个 `string` 类型的字符串。

```php
public string $data
```

> [!IMPORTANT]
> [UDP 服务器](/zh/server/tcp_udp.html) 必须设置 `packet` 事件。`Packet` 的各属性与关闭 `event_object` 时 `$clientInfo` 数组的字段一一对应，见 [packet](/zh/server/events.html#packet) 事件中的 `$clientInfo` 说明。

## 示例

```php
<?php
use Swoole\Server;
use Swoole\Server\Packet;

$server = new Server('127.0.0.1', 9502, SWOOLE_PROCESS, SWOOLE_SOCK_UDP);
// 开启面向对象事件模式
$server->set([
    'event_object' => true,
]);

$server->on('packet', function (Server $server, Packet $packet) {
    printf("%s:%d -> %s\n", $packet->address, $packet->port, $packet->data);
    // 使用 sendto 将数据回传给客户端
    $server->sendto($packet->address, $packet->port, 'Hello Swoole', $packet->server_socket);
});

$server->start();
```
