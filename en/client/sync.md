# Synchronous Blocking Client

`Swoole` provides `Swoole\Client`, a wrapper for `TCP/UDP/Unix Socket` clients that you can use simply via `new Swoole\Client()`.

Compared with the traditional PHP `streams` family of functions, `Client` offers the following notable advantages:

- **More flexible timeout control**: `stream` functions have a long default timeout; if the peer responds slowly, requests may block for a long time. `Client`
  supports finer-grained timeout settings, making it easier to control at the business level.
- **Breaks the 8192-byte buffer limit**: `stream`'s `fread` has a default buffer of only 8192 bytes and cannot efficiently handle large UDP packets; `Client`
  has no such limit and can send and receive large packets smoothly.
- **Supports [`waitall`](#recv) to read a complete packet at once**: when the packet length is known, `Client` can read the complete data in one go via `waitall`, without looping over `fread` like `stream`
  does, simplifying code and improving efficiency.
- **Supports UDP Connect**: `Client` supports UDP connection binding, which effectively avoids the common "packet mixing" problem in UDP communication and improves data accuracy.
- **Pure C implementation, better performance**: `Client` is a pure C extension optimized for Socket handling, with simple and efficient internal logic; `stream` functions are more complex with more layers, and their performance overhead is relatively higher.
- **Supports concurrent management of multiple clients**: together with the `swoole_client_select` function, you can easily achieve concurrent control over multiple `Client` instances, making it easy to build high-concurrency network clients.

In summary, `Swoole\Client` outperforms traditional `streams` in ease of use, performance, packet handling, and concurrency management, and is especially suitable for network communication scenarios with high requirements for stability and performance.

## Properties

### errCode

The error code of the most recent operation.

```php
public int $errCode = 0;
```

### sock

The file descriptor of the current connection.

```php
public int $sock = 0;
```

### reuse

Whether the current connection is reused.

```php
public bool $reuse = false;
```

### reuseCount

The number of times the current connection has been reused.

```php
public int $reuseCount = 0;
```

### type

The current connection type.

```php
public int $type = 0;
```

### id

The `key` specified when enabling persistent connections in the constructor.

```php
public string $id = '';
```

### setting

The current client runtime configuration.

```php
public ?array $setting;
```

## Methods

### __construct

Creates a `Swoole\Client` object.

```php
public function __construct(int $type, bool $async = false, string $id = '')
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$type` | The connection type [supports `SWOOLE_SOCK_TCP`, `SWOOLE_SOCK_TCP6`, `SWOOLE_SOCK_UDP`, `SWOOLE_SOCK_UDP6`]. | Required |
| `$async` | Synchronous blocking mode; can only be set to `false`. | `false` |
| `$id` | The `key` for persistent connections [by default `IP:PORT` is used as the `key`. With the same `key`, even if you new it twice, only one TCP connection is used] | `IP:PORT` |

**Persistent connection**

- Adding the `SWOOLE_KEEP` flag enables persistent connections. In this case, the created `TCP` connection is not closed when the `PHP` request ends or when the [close](/en/client/sync.html#close) method is called; instead it is kept for reuse. When [connect](/en/client/sync.html#connect) is called again, the previously established connection is reused first.
- By default, persistent connections are stored and reused with `IP:PORT` as the key. You can also manually specify a custom key via the `3`rd parameter.

```php
<?php
use Swoole\Client;
$client = new Client(SWOOLE_SOCK_TCP | SWOOLE_KEEP); // Enable persistent connection
```

> [!WARNING]
> Using this `Swoole\Client` in a coroutine environment degrades it to a synchronous blocking environment.

### set

Sets the client runtime configuration.

```php
public function set(array $settings): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$settings` | Client runtime configuration | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Supported options**

| Option                     | Description                           | Example value                                                                   |
|:------------------------|:-----------------------------|:----------------------------------------------------------------------|
| [`open_eof_check`](/en/server/setting.html#open-eof-check)        | Enable EOF boundary checking; stop receiving only when the packet ends with the delimiter | `true`                                                                |
| [`open_eof_split`](/en/server/setting.html#open-eof-split)        | Enable automatic EOF splitting; scan byte by byte and split packets by the delimiter  | `true`                                                                |
| [`package_eof`](/en/server/setting.html#package-eof)           | Specify the EOF delimiter                   | `"\r\n"`                                                              |
| [`open_length_check`](/en/server/setting.html#open-length-check)     | Enable length-checking protocol parsing                   | `true`                                                                |
| [`package_length_type`](/en/server/setting.html#package-length-type)   | Length field type, consistent with the `pack` function         | `'N'` (4-byte unsigned long integer)                                                      |
| [`package_length_offset`](/en/server/setting.html#package-length-offset) | Starting offset of the length field in the packet (bytes)          | `0`                                                                   |
| [`package_body_offset`](/en/server/setting.html#package-body-offset-package-body-start)   | Starting offset of the packet body in the packet (bytes)          | `4`                                                                   |
| [`package_length_func`](/en/server/setting.html#package-length-func)   | Custom length parsing function that returns the complete packet length          | `function($data) { return 4 + unpack('N', substr($data, 0, 4))[1]; }` |
| [`package_max_length`](/en/server/setting.html#package-max-length)    | Maximum receivable packet size (bytes)               | `8192`                                                                |
| [`open_mqtt_protocol`](/en/server/setting.html#open-mqtt-protocol)    | Enable MQTT protocol parsing                 | `true`                                                                |
| [`socket_buffer_size`](/en/server/setting.html#socket-buffer-size)    | Total send buffer size (bytes)                 | `1024 * 1024 * 2`                                                     |
| [`buffer_high_watermark`](/en/server/setting.html#buffer-high-watermark) | High watermark threshold (bytes)                   | `1024 * 1024`                                                         |
| [`buffer_low_watermark`](/en/server/setting.html#buffer-low-watermark)  | Low watermark threshold (bytes)                   | `512 * 1024`                                                          |
| `bind_address`          | Local IP address to forcibly bind in multi-NIC environments          | `'192.168.1.100'`                                                     |
| `bind_port`             | Local port number to forcibly bind                   | `9501`                                                                |
| [`open_tcp_nodelay`](/en/server/setting.html#open-tcp-nodelay)      | Disable the Nagle algorithm; send small packets immediately         | `true`                                                                |
| `socks5_host`           | SOCKS5 proxy IP or domain name             | `'192.168.1.1'`                                                       |
| `socks5_port`           | SOCKS5 proxy port                  | `1080`                                                                |
| `socks5_username`       | SOCKS5 proxy authentication username               | `'admin'`                                                             |
| `socks5_password`       | SOCKS5 proxy authentication password                | `'123456'`                                                            |
| `http_proxy_host`       | HTTP proxy IP or domain name               | `'192.168.1.1'`                                                       |
| `http_proxy_port`       | HTTP proxy port                    | `8080`                                                                |
| `http_proxy_username`   | HTTP proxy authentication username                 | `'admin'`                                                             |
| `http_proxy_password`   | HTTP proxy authentication password                  | `'123456'`                                                            |
| [`ssl_protocols`](/en/server/setting.html#ssl-protocols)         | Allowed SSL/TLS protocol versions             | `SWOOLE_SSLv23_METHOD`                                                |
| [`ssl_compress`](/en/server/setting.html#ssl-compress)          | Whether to enable SSL/TLS compression              | `false`                                                               |
| [`ssl_cert_file`](/en/server/setting.html#ssl-cert-file-ssl-key-file)         | Client certificate file path (mutual authentication)              | `'/etc/ssl/client.crt'`                                               |
| [`ssl_key_file`](/en/server/setting.html#ssl-cert-file-ssl-key-file)          | Client private key file path (mutual authentication)              | `'/etc/ssl/client.key'`                                               |
| `ssl_passphrase`        | Private key file password (if encrypted)                 | `'pass123'`                                                           |
| `ssl_host_name`         | SNI domain name, used so the server returns the correct certificate           | `'www.example.com'`                                                   |
| [`ssl_verify_peer`](/en/server/setting.html#ssl-verify-peer)       | Whether to verify the peer certificate                     | `true`                                                                |
| [`ssl_allow_self_signed`](/en/server/setting.html#ssl-allow-self-signed) | Whether to allow self-signed certificates                    | `true`                                                                |
| [`ssl_cafile`](/en/server/setting.html#ssl-cafile)            | CA certificate file path                    | `'/etc/ssl/ca.crt'`                                                   |
| [`ssl_capath`](/en/server/setting.html#ssl-capath)            | CA certificate directory path (must be a hash directory)            | `'/etc/ssl/certs'`                                                    |
| [`ssl_verify_depth`](/en/server/setting.html#ssl-verify-depth)      | Maximum depth for certificate chain verification                   | `5`                                                                   |

> [!TIP]
> Must be called before the [connect function](/en/client/sync.html#connect) is executed.

### connect

Connects to the server.

```php
public function connect(string $host, int $port = 0, float $timeout = 0.5, int $flag = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | Server address [supports automatic async domain name resolution; `$host` can be a domain name directly] | Required |
| `$port` | Server port | `0` |
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s` + `500ms`] | `0.5` |
| `$flag` | For a `UDP client`, setting `$flag = 1` "binds" the connection to the `$host` and `$port` specified in the `connect` method. From then on it only receives packets from this specific IP and port and discards data from all other sources. This lets you simulate "connection"-like behavior on UDP, a `connectionless` protocol; for a `TCP client`, setting `$flag = 1` enables non-blocking mode, after which this `fd` becomes async IO and `connect` returns immediately. If `$flag` is set to `1`, you must use [swoole_client_select](/en/client/sync.html#swoole-client-select) before `send/recv` to check readability/writability. | `0` |

**Return value**: Returns `true` on success. Returns `false` on failure — check the `errCode` property for the failure reason.

**Notes**

- If `$flag` is `0`, the `connect` method blocks until the connection succeeds and returns `true`. At that point you can send data to or receive data from the server.
- If you want to reconnect once after a failed `connect`, you must first call [close](/en/client/sync.html#close) to close the old `socket`; otherwise an `EINPROGRESS` error is returned, because the current `socket` is still connecting to the server and the client does not know whether the connection succeeded, so `connect` cannot be executed again. Calling `close` closes the current `socket`, and the underlying layer creates a new `socket` for the connection.

### recv

Receives data from the server.

```php
public function recv(int $size = 65536, int $flag = 0): string|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$size` | Maximum length of the receive buffer [do not set this parameter too large, or it will consume a lot of memory] | `65536` |
| `$flag` | Flags controlling receive behavior; can be combined. | `0` |

**Return value**: Returns a string when data is received successfully; returns an empty string when the connection is closed; returns `false` on failure and sets the `$client->errCode` property.

**Optional constants supported by the $flag parameter**

| Constant                            | Description                                                                             |
|-------------------------------|--------------------------------------------------------------------------------|
| `Swoole\Client::MSG_WAITALL`  | Wait for all data. recv blocks until the received data reaches the number of bytes specified by the $size parameter. Note: the numeric value of this constant differs across documents; use the constant name directly. |
| `Swoole\Client::MSG_DONTWAIT` | Non-blocking mode. If no data is currently readable, recv returns immediately instead of blocking.                                           |
| `Swoole\Client::MSG_PEEK`     | Peek at data. View the data without removing it from the receive buffer. Calling recv again still reads the same data.                                  |
| `Swoole\Client::MSG_OOB`      | Receive out-of-band data. Used to handle TCP urgent data.                                                            |

### send

Sends data to the remote server. The connection must be established before data can be sent to the peer.

```php
public function send(string $data, int $flag = 0): false|int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | Content to send [supports binary data] | Required |

**Return value**: On success, returns the length of the data sent; returns `false` on failure and sets the `errCode` property.

**Notes**

- If [connect](/en/client/sync.html#connect) has not been executed, calling `send` triggers a warning.
- There is no length limit on the data sent; too much data fills the buffer, and the program blocks waiting for writability.

### sendfile

Sends a file to the server. This function is implemented on top of the `sendfile` operating system call.

```php
public function sendfile(string $filename, int $offset = 0, int $length = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$filename` | Path of the file to send | Required |
| `$offset` | Offset of the uploaded file [you can start transferring data from the middle of the file. This feature can be used to support resumable transfers.] | `0` |
| `$length` | Size of the data to send [defaults to the size of the entire file] | `0` |

**Return value**: Returns `true` on success; returns `false` if the given file does not exist.

> [!WARNING]
> `sendfile` blocks until the entire file has been sent or a fatal error occurs.

### sendto

Sends a `UDP` packet to any `IP:PORT` host; only supports the `SWOOLE_SOCK_UDP/SWOOLE_SOCK_UDP6` types.

```php
public function sendto(string $ip, int $port, string $data): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$ip` | The target host's `IP` address; supports `IPv4/IPv6` | Required |
| `$port` | The target host's port | Required |
| `$data` | The data content to send [must not exceed `64K`] | Required |

**Return value**: Returns `true` on success, otherwise `false`.

### enableSSL

Dynamically enables SSL tunnel encryption.

```php
public function enableSSL(): bool
```

**Return value**: Returns `true` on success, otherwise `false`.

> [!IMPORTANT]
> This function can only be used if `swoole` was compiled with `--enable-openssl`. However, `Swoole 6.2.0` supports `openssl` by default.

### getPeerCert

Gets the server's certificate information.

```php
public function getPeerCert(): string|bool
```

**Return value**: On success, returns an `X509` certificate string; returns `false` on failure.

> [!IMPORTANT]
> This function can only be used if `swoole` was compiled with `--enable-openssl`. However, `Swoole 6.2.0` supports `openssl` by default.

### verifyPeerCert

Verifies the server's certificate.

```php
public function verifyPeerCert(): bool
```

**Return value**: Returns `true` if verification succeeds, otherwise `false`.

> [!IMPORTANT]
> This function can only be used if `swoole` was compiled with `--enable-openssl`. However, `Swoole 6.2.0` supports `openssl` by default.

### isConnected

Returns the client's connection status.

```php
public function isConnected(): bool
```

**Return value**: Returns `true` if currently connected to the server, `false` if not connected.

### getsockname

Used to get the local host:port of the client socket.

```php
public function getsockname(): array|false
```

**Return value**: Returns an array on success, otherwise `false`.

**The return value structure is as follows**

| Parameter  | Type     | Description      |
|------|--------|---------|
| host | string | Client IP address |
| port | int    | Client port number  |

### getpeername

Gets the IP address and port of the peer `socket`.

```php
public function getpeername(): array|false
```

**Return value**: Returns an array on success, otherwise `false`.

**The return structure is as follows**

| Parameter  | Type     | Description      |
|------|--------|---------|
| host | string | Client IP address |
| port | int    | Client port number  |

### close

Closes the connection.

```php
public function close(bool $force = false): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$force` | Forcibly close the connection; can be used to close a persistent connection created with the `SWOOLE_KEEP` flag. | `false` |

**Return value**: Returns `true` on success, otherwise `false`.

**Notes**

- After enabling `SWOOLE_KEEP` persistent connections, the first parameter of close must be set to `true` to forcibly destroy the persistent connection.
- Do not call `connect` again after a connection has been `close`d. The correct approach is to destroy the current `Swoole\Client`, create a new `Swoole\Client`, and initiate a new connection.

### shutdown

Shuts down the client.

```php
public function shutdown(int $how): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$how` | Sets how to shut down the client | Required |

**Return value**: Returns `true` on success, otherwise `false`.

**Supported modes:**

| Type                         | Description     |
|----------------------------|--------|
| `Swoole\Client::SHUT_RDWR` | Close both read and write   |
| `Swoole\Client::SHUT_RD`   | Close read operations only |
| `Swoole\Client::SHUT_WR`   | Close write operations only |

### getSocket

Gets the underlying `socket` handle; the returned object is a `sockets` resource handle.

```php
public function getSocket(): \Socket|false
```

**Return value**: Returns a `Socket` object on success, otherwise `false`.

> [!IMPORTANT]
> This method depends on the `php sockets` extension, and the [--enable-sockets](/en/start/install.html#build-options) option must be enabled at compile time.

### swoole_client_select

Used to monitor status changes of one or more connections simultaneously in a synchronous blocking Swoole client, such as whether data is readable, whether writing is possible, or whether an error has occurred.

```php
function swoole_client_select(?array &$read, ?array &$write, ?array &$except, ?float $timeout = 0.5): false|int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `&$read` | Array of client objects to monitor for readability. After the function returns, this array is modified to keep only the clients that are actually readable. | Required |
| `&$write` | Array of client objects to monitor for writability. After the function returns, this array is modified to keep only the clients that are actually writable. | Required |
| `&$except` | Array of client objects to monitor for errors. After the function returns, this array is modified to keep only the clients on which errors occurred. | Required |
| `$timeout` | Timeout, in seconds. | `0.5` |

**Return value**: On success, returns the number of events and modifies the `&$read`, `&$write`, and `&$except` arrays; returning `0` means no `IO` became available within the specified time and the `select` call timed out; returns `false` on failure.

**Example**

```php
<?php

use Swoole\Client;

$clients = array();

for($i=0; $i< 20; $i++) {
    $client = new Client(SWOOLE_SOCK_TCP, SWOOLE_SOCK_SYNC); // Synchronous blocking
    $ret = $client->connect('127.0.0.1', 9501, 0.5, 0);
    if(!$ret) {
        echo "Connect Server fail.errCode=".$client->errCode;
    } else {
        $client->send("HELLO WORLD\n");
        $clients[$client->sock] = $client;
    }
}

while (!empty($clients)) {
    $write = $error = array();
    $read = array_values($clients);
    $n = swoole_client_select($read, $write, $error, 0.6);
    if ($n > 0) {
        foreach ($read as $index => $c) {
            echo "Recv #{$c->sock}: " . $c->recv() . "\n";
            unset($clients[$c->sock]);
        }
    }
}
```

## Examples

```php
<?php
use Swoole\Client;
$client = new Client(SWOOLE_SOCK_TCP);
if (!$client->connect('127.0.0.1', 9501, -1)) {
    exit("connect failed. Error: {$client->errCode}\n");
}
$client->send("hello world\n");
echo $client->recv();
$client->close();
```