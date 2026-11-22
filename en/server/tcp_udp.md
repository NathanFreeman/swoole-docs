# TCP/UDP Server

You can create a TCP or UDP server by instantiating a `Swoole\Server` object. `Swoole\Server` is the base class of all async-style servers; the [`Swoole\Http\Server`](/en/server/http.html), [`Swoole\WebSocket\Server`](/en/server/websocket.html), and [`Swoole\Redis\Server`](/en/server/redis.html) classes introduced in later chapters all inherit from it.

## Examples

### Example 1: Creating a Simple TCP Server

Listen on port `9501` of `127.0.0.1` on the server to implement a basic TCP server:

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9501);

$server->on('receive', function (Server $server, int $fd, int $reactorId, string $data) {
    $server->send($fd, 'Hello World');
});

$server->start();
```

**Testing the server**

Open another terminal and connect to the server using `telnet`:

```bash
telnet 127.0.0.1 9501
```

After connecting successfully, type any characters and press Enter; the server returns a response:

```
Hello World
```

### Example 2: Creating a Simple UDP Server

Listen on port `9502` of `127.0.0.1` on the server to implement a basic UDP server:

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9502, SWOOLE_BASE, SWOOLE_SOCK_UDP);

$server->on('packet', function (Server $server, mixed $data, array $clientInfo) {
    $server->sendto($clientInfo['address'], $clientInfo['port'], "Hello World");
});

$server->start();
```

**Testing the server**

Open another terminal and connect to the server using `nc`:

```bash
echo "Hello" | nc -u 127.0.0.1 9502
```

After the command sends the data, the server returns a response:

```
Hello World
```