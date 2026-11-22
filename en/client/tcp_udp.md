# TCP/UDP Client

`Swoole\Coroutine\Client` is a coroutineized wrapper around the underlying `Socket`, designed to provide a unified client programming interface for the `TCP`, `UDP`, and `Unix Socket` protocols. To use it, simply create a `Swoole\Coroutine\Client` object and start building network requests.

## Methods

### __construct

Constructor

```php
public function __construct(int $type)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$type` | The connection type. | Required |

**Supported types**

| Constant                        | Protocol family         | Transport protocol    | Socket type           | Communication scope         | Key characteristics and use cases                                                        |
|:--------------------------|:------------|:--------|:----------------|:-------------|:-----------------------------------------------------------------|
| **`SWOOLE_SOCK_TCP`**     | IPv4        | TCP     | Stream (SOCK_STREAM) | Across networks (LAN/Internet) | **Most commonly used**. Connection-oriented, reliable, ordered. Suitable for the vast majority of network services such as HTTP, HTTPS, MySQL, and Redis.         |
| **`SWOOLE_SOCK_TCP6`**    | IPv6        | TCP     | Stream (SOCK_STREAM) | Across networks (IPv6 networks) | Same functionality as TCP, but uses IPv6 addresses. Suitable for modern network environments that require IPv6 support.                     |
| **`SWOOLE_SOCK_UDP`**     | IPv4        | UDP     | Datagram (SOCK_DGRAM) | Across networks (LAN/Internet) | Connectionless and unreliable, but fast. Suitable for DNS queries, audio/video streaming, real-time games, IoT devices, and similar scenarios.                       |
| **`SWOOLE_SOCK_UDP6`**    | IPv6        | UDP     | Datagram (SOCK_DGRAM) | Across networks (IPv6 networks) | Same functionality as UDP, but uses IPv6 addresses.                                          |
| **`SWOOLE_UNIX_STREAM`**  | Unix Domain | Local inter-process communication | Stream (SOCK_STREAM) | **Local machine only**     | Connection-oriented, reliable local IPC. Extremely fast, bypassing the network stack. Commonly used for communication between high-performance services on the same machine (e.g. Nginx and PHP-FPM). |
| **`SWOOLE_UNIX_DGRAM`**   | Unix Domain | Local inter-process communication | Datagram (SOCK_DGRAM) | **Local machine only**     | Connectionless local IPC. Equally fast; suitable for quick data exchange on the local machine where reliability requirements are low.                           |

> [!TIP]
> `SWOOLE_UNIX_STREAM` / `SWOOLE_UNIX_DGRAM` and [`SWOOLE_SOCK_UNIX_STREAM` / `SWOOLE_SOCK_UNIX_DGRAM`](/en/server/properties.html#type) are two spellings of the same set of constants; their values are identical and they can be used interchangeably.

### set

Sets client parameters.

```php
public function set(array $settings): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$settings` | Client configuration | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Supported options**

| Option                     | Description                                                                                  | Example value                                                                   |
|:------------------------|:--------------------------------------------------------------------------------------|:----------------------------------------------------------------------|
| `timeout`               | **Global timeout** (seconds), uniformly controlling connect, read, and write timeouts. Lower priority than `connect_timeout`, `read_timeout`, and `write_timeout`. | `0.5`                                                                 |
| `connect_timeout`       | **Connect timeout** (seconds), separately controlling the timeout of the TCP handshake phase.                                                       | `1.0`                                                                 |
| `read_timeout`          | **Read timeout** (seconds), separately controlling how long `recv()` waits for data.                                                  | `0.5`                                                                 |
| `write_timeout`         | **Write timeout** (seconds), separately controlling the timeout of `send()` when sending data.                                                  | `0.5`                                                                 |
| `bind_address`          | In multi-NIC environments, forcibly bind a local IP address. Must be used together with `bind_port`.                                              | `'192.168.1.100'`                                                     |
| `bind_port`             | Forcibly bind a local port number. Must be used together with `bind_address`.                                                     | `9501`                                                                |
| [`socket_buffer_size`](/en/server/setting.html#socket-buffer-size)    | Total send buffer size (bytes).                                                                         | `1024 * 1024 * 2`                                                     |
| [`open_tcp_nodelay`](/en/server/setting.html#open-tcp-nodelay)      | Disable the Nagle algorithm; small packets are sent immediately without waiting to be merged.                                                           | `true`                                                                |
| `socks5_host`           | SOCKS5 proxy server IP or domain name.                                                                  | `'192.168.1.1'`                                                       |
| `socks5_port`           | SOCKS5 proxy server port.                                                                       | `1080`                                                                |
| `socks5_username`       | SOCKS5 proxy authentication username (optional).                                                                   | `'admin'`                                                             |
| `socks5_password`       | SOCKS5 proxy authentication password (optional).                                                                    | `'123456'`                                                            |
| `http_proxy_host`       | HTTP proxy server IP or domain name.                                                                    | `'192.168.1.1'`                                                       |
| `http_proxy_port`       | HTTP proxy server port.                                                                         | `8080`                                                                |
| `http_proxy_username`   | HTTP proxy authentication username (optional).                                                                     | `'admin'`                                                             |
| `http_proxy_password`   | HTTP proxy authentication password (optional).                                                                      | `'123456'`                                                            |
| `open_ssl`              | Enable SSL/TLS encryption (equivalent to using the `SWOOLE_SSL` flag in the constructor).                                           | `true`                                                                |
| [`open_http2_protocol`](/en/server/setting.html#open-http2-protocol)   | Enable HTTP/2 protocol support (must be used on top of SSL).                                                          | `true`                                                                |
| [`open_eof_check`](/en/server/setting.html#open-eof-check)        | Enable EOF boundary checking; stop receiving only when the packet ends with the delimiter.                                                       | `true`                                                                |
| [`open_eof_split`](/en/server/setting.html#open-eof-split)        | Enable automatic EOF splitting; scan byte by byte and split complete packets by the delimiter.                                                        | `true`                                                                |
| [`package_eof`](/en/server/setting.html#package-eof)           | Specify the EOF delimiter.                                                                           | `"\r\n"`                                                              |
| `open_fastcgi_protocol` | Enable FastCGI protocol parsing.                                                                      | `true`                                                                |
| [`open_mqtt_protocol`](/en/server/setting.html#open-mqtt-protocol)    | Enable MQTT protocol parsing.                                                                         | `true`                                                                |
| [`open_length_check`](/en/server/setting.html#open-length-check)     | Enable length-checking protocol parsing.                                                                           | `true`                                                                |
| [`package_length_type`](/en/server/setting.html#package-length-type)   | Length field type, consistent with the `pack()` function, e.g. `'N'` for a 4-byte unsigned long integer.                                         | `'N'`                                                                 |
| [`package_length_offset`](/en/server/setting.html#package-length-offset) | Starting offset of the length field in the packet (bytes).                                                                  | `0`                                                                   |
| [`package_body_offset`](/en/server/setting.html#package-body-offset-package-body-start)   | Starting offset of the packet body in the packet (bytes).                                                                  | `4`                                                                   |
| [`package_length_func`](/en/server/setting.html#package-length-func)   | Custom length parsing function that returns the length of a complete packet.                                                                 | `function($data) { return 4 + unpack('N', substr($data, 0, 4))[1]; }` |
| [`package_max_length`](/en/server/setting.html#package-max-length)    | Maximum receivable packet size (bytes).                                                                       | `8192`                                                                |
| [`ssl_protocols`](/en/server/setting.html#ssl-protocols)         | Allowed SSL/TLS protocol versions.                                                                     | `SWOOLE_SSLv23_METHOD`                                                |
| [`ssl_compress`](/en/server/setting.html#ssl-compress)          | Whether to enable SSL/TLS compression.                                                                      | `false`                                                               |
| [`ssl_cert_file`](/en/server/setting.html#ssl-cert-file-ssl-key-file)         | Client certificate file path (used for mutual authentication).                                                                   | `'/etc/ssl/client.crt'`                                               |
| [`ssl_key_file`](/en/server/setting.html#ssl-cert-file-ssl-key-file)          | Client private key file path (used for mutual authentication).                                                                   | `'/etc/ssl/client.key'`                                               |
| `ssl_passphrase`        | Private key file password (if encrypted).                                                                         | `'pass123'`                                                           |
| `ssl_host_name`         | SNI domain name, used so the server returns the correct SSL certificate.                                                             | `'www.example.com'`                                                   |
| [`ssl_verify_peer`](/en/server/setting.html#ssl-verify-peer)       | Whether to verify the peer certificate.                                                                             | `true`                                                                |
| [`ssl_allow_self_signed`](/en/server/setting.html#ssl-allow-self-signed) | Whether to allow self-signed certificates.                                                                            | `true`                                                                |
| [`ssl_cafile`](/en/server/setting.html#ssl-cafile)            | CA certificate file path, used to verify the peer certificate's signature.                                                                 | `'/etc/ssl/ca.crt'`                                                   |
| [`ssl_capath`](/en/server/setting.html#ssl-capath)            | CA certificate directory path (must be a hash directory), used when `ssl_cafile` is unset or invalid.                                             | `'/etc/ssl/certs'`                                                    |
| [`ssl_verify_depth`](/en/server/setting.html#ssl-verify-depth)      | Maximum depth for certificate chain verification; verification stops beyond this depth.                                                                   | `5`                                                                   |
| [`ssl_ciphers`](/en/server/setting.html#ssl-ciphers)           | Set the OpenSSL cipher suite.                                                                    | `'ECDHE-RSA-AES128-GCM-SHA256'`                                       |
| [`ssl_ecdh_curve`](/en/server/setting.html#ssl-ecdh-curve)        | Controls the elliptic curve used for ECDH key exchange.                                                                 | `'secp256r1'`                                                         |
| `ssl_grease`            | Enable the TLS GREASE (anti-ossification) extension to improve compatibility with non-standard servers; only applies to Google's `BoringSSL`.                                 | `true`                                                                |

### connect

Connects to the server.

```php
public function connect(string $host, int $port = 0, float $timeout = 0.5, int $flag = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | Server address [supports automatic async domain name resolution; `$host` can be a domain name directly] | Required |
| `$port` | Server port | `0` |
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | `0.5` |
| `$flag` | For a `UDP client`, setting `$flag = 1` "binds" the connection to the `$host` and `$port` specified in the `connect` method. From then on it only receives packets from this specific IP and port and discards data from all other sources. This lets you simulate "connection"-like behavior on UDP, a `connectionless` protocol.<br>For a `TCP client`, setting `$flag = 1` enables non-blocking mode, after which this `fd` becomes async IO and `connect` returns immediately. If `$flag` is set to `1`, you must use [swoole_client_select](/en/client/sync.html#swoole-client-select) before `send/recv` to check readability/writability. | `0` |

**Return value**: Returns `true` on success. Returns `false` on failure — check the `errCode` property for the failure reason.

### recv

Receives data from the server.

```php
public function recv(float $timeout = 0): string|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Sets the timeout; unit: seconds [supports floating point, e.g. `1.5` means `1s`+`500ms`] | `0` |

**Return value**: Returns a string on success; returns an empty string if the connection has been closed; returning `false` means the operation failed — check `$client->errCode`.

### peek

Reads data from the kernel receive buffer without removing it from the buffer.

```php
public function peek(int $length = 65535): string|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$length` | Length of the data to fetch | `65535` |

**Return value**: Returns a string on success; if the connection has been closed, `peek` returns an empty string; returns `false` when the buffer is empty — check `$client->errCode`.

> [!WARNING]
> The `peek` method is non-blocking and returns immediately.
> You can think of it as a "sneak peek" or "preview" that lets you check what is in the buffer without consuming the data.

### send

Sends data.

```php
public function send(string $data, float $timeout = 0): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The data to send; must be a string, supports binary data | Required |
| `$timeout` | Timeout. | `0` |

**Return value**: On success, returns the number of bytes written to the `Socket` buffer; the underlying layer sends out as much of the data as possible. If the returned byte count differs from the length of the passed `$data`, the `Socket` may have been closed by the peer, and the next call to `send` or `recv` will return the corresponding error code. Returns false on failure; use `$client->errCode` to get the failure reason.

### sendfile

Sends a file on the client directly to the connected `TCP` server.

```php
public function sendfile(string $filename, int $offset = 0, int $length = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$filename` | Path of the file to send | Required |
| `$offset` | Offset of the uploaded file [you can start transferring data from the middle of the file. This feature can be used to support resumable transfers.] | `0` |
| `$length` | Size of the data to send [defaults to the size of the entire file] | `0` |

**Return value**: Returns `true` on success; returns `false` if the given file does not exist.

### sendto

A method designed specifically for the `UDP` protocol, used to send data to a specified `IP` and `port`.

```php
public function sendto(string $address, int $port, string $data): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$address` | Target address. | Required |
| `$port` | Target port. | Required |
| `$data` | The data to send. | Required |

**Return value**: Returns `true` on success. Returns `false` on failure; use `$client->errCode` to get the error code.

### recvfrom

A method prepared specifically for the `UDP` protocol, used to receive data and "incidentally" obtain the sender's address information.

```php
public function recvfrom(int $length, mixed &$address, mixed &$port = 0): false|string
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$length` | Length of the data to receive | Required |
| `&$address` | A reference parameter; after the call it is set to the sender's IP address. | Required |
| `&$port` | Also a reference parameter; after the call it is set to the sender's port. | `0` |

**Return value**: Returns the received data string on success. Returns an empty string if the server closed the connection. Returns `false` if an error occurs (such as a timeout); in that case use `$client->errCode` to get the specific error code.

### enableSSL

Dynamically enables SSL tunnel encryption.

```php
public function enableSSL(): bool
```

**Return value**: Returns `true` on success, otherwise `false`.

> [!IMPORTANT]
> This function can only be used if `swoole` was compiled with [--enable-openssl](/en/start/install.html#build-options). However, `Swoole 6.2.0` supports `openssl` by default.

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
public function verifyPeerCert(bool $allow_self_signed = false): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$allow_self_signed` | Whether to allow self-signed certificates; other values: `true` | `false`, self-signed certificates not allowed |

**Return value**: Returns `true` on success; returns `false` on failure.

> [!IMPORTANT]
> This function can only be used if `swoole` was compiled with `--enable-openssl`. However, `Swoole 6.2.0` supports `openssl` by default.

### exportSocket

Exports the current connection as a [`Swoole\Coroutine\Socket`](/en/client/socket.html) object, allowing lower-level methods to be called.

```php
public function exportSocket(): Swoole\Coroutine\Socket
```

**Return value**: Returns the `Coroutine\Socket` object of the current connection.

### isConnected

Returns the client's connection status.

```php
public function isConnected(): bool
```

**Return value**: Returns `true` if currently connected to the server, `false` if not connected.

### getsockname

Used to get the local IP address and port.

```php
public function getsockname(): false|array
```

**Return value**: On success, returns an array containing `address` and `port`; on failure, returns `false` and sets the `errCode` property.

### getpeername

Used to get the IP address and port of the connection's peer (i.e. the remote end).

```php
public function getpeername(): false|array
```

**Return value**: On success, returns an array containing `address` and `port`; on failure, returns `false` and sets the `errCode` property.

### close

Closes the client.

```php
public function close(): bool
```

**Return value**: Returns `true` on success, otherwise `false`.