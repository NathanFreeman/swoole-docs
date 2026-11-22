# HTTP2 Coroutine Client

`Swoole\Coroutine\Http2\Client` is a high-performance, coroutine-driven `HTTP/2` client provided by the `Swoole` extension. It lets you connect to `HTTP/2` servers in `PHP` through coroutines, in a non-blocking, synchronous coding style.

## Properties

### errCode

The error code of the last operation. It is 0 on success and a specific error code on failure.

```php
public int $errCode = 0;
```

### errMsg

The error message of the last operation.

```php
public string $errMsg = '';
```

### sock

The `Socket` file descriptor. The value is `-1` when not connected, and the actual `socket fd` after a successful connection.

```php
public int $sock = -1;
```

### type

The client type identifier.

```php
public int $type = 0;
```

### setting

A read-only array of client configuration options set via the [set](/en/client/http2.html#set) method. It is `null` when no configuration has been set.

```php
public ?array $setting = null;
```

### socket

The `Socket` resource object. Allows direct manipulation of the underlying `socket` resource.

```php
public ?\Socket $socket = null;
```

### connected

The connection state. `true` means currently connected to the server; `false` means not connected.

```php
public bool $connected = false;
```

### host

The host address of the remote server. The IP address or domain name set in the constructor.

```php
public ?string $host = null;
```

### port

The port number of the remote server. The port set in the constructor.

```php
public int $port = 0;
```

### ssl

The `SSL/TLS` encryption flag. `true` means an `SSL` connection is enabled; `false` means it is not.

```php
public bool $ssl = false;
```

### serverLastStreamId

The last `Stream ID` used by the server. Used to track the identifier of the last stream initiated by the server on the `HTTP/2` connection; useful when handling server push or checking connection state.

```php
public int $serverLastStreamId = 0;
```

## Methods

### __construct

The constructor.

```php
public function __construct(string $host, int $port = 80, bool $open_ssl = false)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | The IP address of the target host [if `$host` is a domain name, a `DNS` lookup is performed under the hood] | Required |
| `$port` | The target port [`Http` usually uses port `80`, `Https` usually uses port `443`] | `80` |
| `$open_ssl` | Whether to enable `TLS/SSL` tunnel encryption [must be set to `true` for `https` sites]; other values: `true` | `false` |

### set

Sets client parameters, such as timeouts and concurrent stream limits.

```php
public function set(array $settings): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$settings` | Client configuration | Required |

**Return value**: Returns `true` on success and `false` on failure.

**Supported configuration options**

| Option                     | Description                                                                                  | Example                                                                   |
|:------------------------|:--------------------------------------------------------------------------------------|:----------------------------------------------------------------------|
| `timeout`               | **Global timeout** (seconds), uniformly controlling connect, read, and write timeouts. Has lower priority than `connect_timeout`, `read_timeout`, and `write_timeout`. | `0.5`                                                                 |
| `connect_timeout`       | **Connect timeout** (seconds), controlling only the timeout of the TCP handshake phase.                                                       | `1.0`                                                                 |
| `read_timeout`          | **Read timeout** (seconds), controlling only the timeout of `recv()` waiting for data.                                                  | `0.5`                                                                 |
| `write_timeout`         | **Write timeout** (seconds), controlling only the timeout of `send()` sending data.                                                  | `0.5`                                                                 |
| `bind_address`          | In multi-NIC environments, forces binding to a local IP address. Must be used together with `bind_port`.                                              | `'192.168.1.100'`                                                     |
| `bind_port`             | Forces binding to a local port number. Must be used together with `bind_address`.                                                     | `9501`                                                                |
| [`socket_buffer_size`](/en/server/setting.html#socket-buffer-size)    | Total send buffer size (bytes).                                                                         | `1024 * 1024 * 2`                                                     |
| [`open_tcp_nodelay`](/en/server/setting.html#open-tcp-nodelay)      | Disables the Nagle algorithm so small packets are sent immediately without waiting to be merged.                                                           | `true`                                                                |
| `socks5_host`           | SOCKS5 proxy server IP or domain name.                                                                  | `'192.168.1.1'`                                                       |
| `socks5_port`           | SOCKS5 proxy server port.                                                                       | `1080`                                                                |
| `socks5_username`       | SOCKS5 proxy authentication username (optional).                                                                   | `'admin'`                                                             |
| `socks5_password`       | SOCKS5 proxy authentication password (optional).                                                                    | `'123456'`                                                            |
| `http_proxy_host`       | HTTP proxy server IP or domain name.                                                                    | `'192.168.1.1'`                                                       |
| `http_proxy_port`       | HTTP proxy server port.                                                                         | `8080`                                                                |
| `http_proxy_username`   | HTTP proxy authentication username (optional).                                                                     | `'admin'`                                                             |
| `http_proxy_password`   | HTTP proxy authentication password (optional).                                                                      | `'123456'`                                                            |
| `open_ssl`              | Enables SSL/TLS encryption (equivalent to using the `SWOOLE_SSL` flag in the constructor).                                           | `true`                                                                |
| [`open_http2_protocol`](/en/server/setting.html#open-http2-protocol)   | Enables HTTP/2 protocol support (must be used on top of SSL).                                                          | `true`                                                                |
| [`open_eof_check`](/en/server/setting.html#open-eof-check)        | Enables EOF boundary checking; stops receiving only when the end of a packet matches the delimiter.                                                       | `true`                                                                |
| [`open_eof_split`](/en/server/setting.html#open-eof-split)        | Enables automatic EOF splitting; scans byte by byte and splits complete packets by the delimiter.                                                        | `true`                                                                |
| [`package_eof`](/en/server/setting.html#package-eof)           | Specifies the EOF delimiter.                                                                           | `"\r\n"`                                                              |
| `open_fastcgi_protocol` | Enables FastCGI protocol parsing.                                                                      | `true`                                                                |
| [`open_mqtt_protocol`](/en/server/setting.html#open-mqtt-protocol)    | Enables MQTT protocol parsing.                                                                         | `true`                                                                |
| [`open_length_check`](/en/server/setting.html#open-length-check)     | Enables length-based protocol parsing.                                                                           | `true`                                                                |
| [`package_length_type`](/en/server/setting.html#package-length-type)   | The length field type, consistent with the `pack()` function; e.g. `'N'` means a 4-byte unsigned long.                                         | `'N'`                                                                 |
| [`package_length_offset`](/en/server/setting.html#package-length-offset) | The starting offset of the length field within the packet (bytes).                                                                  | `0`                                                                   |
| [`package_body_offset`](/en/server/setting.html#package-body-offset-package-body-start)   | The starting offset of the package body within the packet (bytes).                                                                  | `4`                                                                   |
| [`package_length_func`](/en/server/setting.html#package-length-func)   | A custom length-parsing function that returns the length of a complete packet.                                                                 | `function($data) { return 4 + unpack('N', substr($data, 0, 4))[1]; }` |
| [`package_max_length`](/en/server/setting.html#package-max-length)    | The maximum receivable packet size (bytes).                                                                       | `8192`                                                                |
| [`ssl_protocols`](/en/server/setting.html#ssl-protocols)         | The allowed SSL/TLS protocol versions.                                                                     | `SWOOLE_SSLv23_METHOD`                                                |
| [`ssl_compress`](/en/server/setting.html#ssl-compress)          | Whether to enable SSL/TLS compression.                                                                      | `false`                                                               |
| [`ssl_cert_file`](/en/server/setting.html#ssl-cert-file-ssl-key-file)         | The client certificate file path (used for mutual authentication).                                                                   | `'/etc/ssl/client.crt'`                                               |
| [`ssl_key_file`](/en/server/setting.html#ssl-cert-file-ssl-key-file)          | The client private key file path (used for mutual authentication).                                                                   | `'/etc/ssl/client.key'`                                               |
| `ssl_passphrase`        | The private key file password (if encrypted).                                                                         | `'pass123'`                                                           |
| `ssl_host_name`         | The SNI domain name, used so the server returns the correct SSL certificate.                                                             | `'www.example.com'`                                                   |
| [`ssl_verify_peer`](/en/server/setting.html#ssl-verify-peer)       | Whether to verify the peer certificate.                                                                             | `true`                                                                |
| [`ssl_allow_self_signed`](/en/server/setting.html#ssl-allow-self-signed) | Whether to allow self-signed certificates.                                                                            | `true`                                                                |
| [`ssl_cafile`](/en/server/setting.html#ssl-cafile)            | The CA certificate file path, used to verify the peer certificate signature.                                                                 | `'/etc/ssl/ca.crt'`                                                   |
| [`ssl_capath`](/en/server/setting.html#ssl-capath)            | The CA certificate directory path (must be a hash directory), used when `ssl_cafile` is not set or is invalid.                                             | `'/etc/ssl/certs'`                                                    |
| [`ssl_verify_depth`](/en/server/setting.html#ssl-verify-depth)      | The maximum depth for certificate chain verification; verification terminates beyond it.                                                                   | `5`                                                                   |
| [`ssl_ciphers`](/en/server/setting.html#ssl-ciphers)           | Sets the OpenSSL cipher suite.                                                                    | `'ECDHE-RSA-AES128-GCM-SHA256'`                                       |
| [`ssl_ecdh_curve`](/en/server/setting.html#ssl-ecdh-curve)        | Controls the elliptic curve used for ECDH key exchange.                                                                 | `'secp256r1'`                                                         |
| `ssl_grease`            | Enables the TLS GREASE (anti-ossification) extension to improve compatibility with non-standard servers; only applies to Google's `BoringSSL`.                                 | `true`                                                                |

### connect

Connects to the target server.

```php
public function connect(): bool
```

**Return value**: Returns `true` on a successful connection; returns `false` on failure — check the `errCode` property for the error code.

### stats

Gets stream statistics.

```php
public function stats(string $key = ''): array|int
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The specified key | `''` |

**Return value**: Returns a specific value if `$key` is given, otherwise returns an array.

### isStreamExist

Checks whether the specified stream exists.

```php
public function isStreamExist(int $streamId): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$streamId` | The specified stream id. | Required |

**Return value**: Returns `true` if the stream exists, `false` if it does not.

### send

Sends a request to the server; an `Http2` `stream` is automatically created under the hood. Multiple requests can be initiated simultaneously.

```php
public function send(\Swoole\Coroutine\Http2\Request $request): int|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$request` | The [Swoole\Coroutine\Http2\Request](/en/client/request.html) object to send | Required |

**Return value**: On success, returns the stream number, an auto-incrementing odd number starting from `1`; on failure, returns `false`.

### write

Sends additional data frames to the server. It can be called multiple times to write data frames to the same `stream`.

```php
public function write(int $streamId, mixed $data, bool $end = false): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$streamId` | The stream number, returned by the `send` method | Required |
| `$data` | The content of the data frame; can be a string or an array | Required |
| `$end` | Whether to close the stream; other values: `true` | `false` |

**Return value**: Returns `true` on success and `false` on failure.

> [!WARNING]
> To send data frames in segments with `write`, you must set [`$request->pipeline`](/en/client/request.html#pipeline) to `true` when calling `send`.
> After a data frame with `end` set to `true` is sent, the stream is closed and `write` can no longer be called to send data to this `stream`.

### recv

Receives a response.

```php
public function recv(float $timeout = 0): \Swoole\Coroutine\Http2\Response|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Sets the timeout; unit: seconds [floating point supported, e.g. `1.5` means `1s`+`500ms`] | `0` |

**Return value**: On success, returns a [Swoole\Coroutine\Http2\Response](/en/client/response.html) object.

### read

Basically the same as `recv()`, except that for `pipeline`-type responses, `read` can read in multiple passes, receiving partial content each time to save memory or receive pushed messages as soon as possible, whereas `recv` always concatenates all frames into one complete response before returning.

```php
public function read(float $timeout = 0): \Swoole\Coroutine\Http2\Response|false
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Sets the timeout; see the client timeout rules; unit: seconds [floating point supported, e.g. `1.5` means `1s`+`500ms`] | `0` |

**Return value**: On success, returns a [Swoole\Coroutine\Http2\Response](/en/client/response.html) object.

### ping

Used to measure the minimum round-trip time from the sender and to determine whether an idle connection is still valid.

```php
public function ping(): bool
```

**Return value**: Returns `true` on success and `false` on failure.

### goaway

Sends a `GOAWAY` frame to the server, notifying it that the connection is about to close and allowing existing requests to be handled gracefully.

```php
public function goaway(int $error_code = SWOOLE_HTTP2_ERROR_NO_ERROR, string $debug_data = ''): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$error_code` | The `HTTP/2` error code explaining why the connection is being closed | `SWOOLE_HTTP2_ERROR_NO_ERROR` |
| `$debug_data` | Optional debug data, included in the `GOAWAY` packet being sent | `''` |

**Return value**: Returns `true` if sent successfully, `false` if sending fails.

| Constant                                    | Description                                  |
|:---------------------------------------|:--------------------------------------|
| SWOOLE_HTTP2_ERROR_NO_ERROR            | No error (typically used to close the connection gracefully)                     |
| SWOOLE_HTTP2_ERROR_PROTOCOL_ERROR      | Protocol error (an unspecified protocol error was detected)                   |
| SWOOLE_HTTP2_ERROR_INTERNAL_ERROR      | Internal error (the endpoint encountered an unexpected internal error)                     |
| SWOOLE_HTTP2_ERROR_FLOW_CONTROL_ERROR  | Flow control error (the peer violated the flow control protocol)                   |
| SWOOLE_HTTP2_ERROR_SETTINGS_TIMEOUT    | Settings timeout (a SETTINGS frame was sent but no response was received in time)          |
| SWOOLE_HTTP2_ERROR_STREAM_CLOSED       | Stream closed (a frame was received after the stream was half-closed)                    |
| SWOOLE_HTTP2_ERROR_FRAME_SIZE_ERROR    | Frame size error (the received frame has an invalid size or exceeds the maximum size)               |
| SWOOLE_HTTP2_ERROR_REFUSED_STREAM      | Refused stream (the stream was refused before any application processing was performed)               |
| SWOOLE_HTTP2_ERROR_CANCEL              | Cancel (indicates the specified stream is no longer needed)                        |
| SWOOLE_HTTP2_ERROR_COMPRESSION_ERROR   | Compression error (the header compression context for the connection cannot be maintained)                 |
| SWOOLE_HTTP2_ERROR_CONNECT_ERROR       | Connect error (the connection established for a CONNECT request was reset or abnormally closed)            |
| SWOOLE_HTTP2_ERROR_ENHANCE_YOUR_CALM   | Enhance your calm (the remote peer is exhibiting behavior that may generate excessive load)          |
| SWOOLE_HTTP2_ERROR_INADEQUATE_SECURITY | Inadequate security (the underlying transport has properties that do not meet minimum security requirements)             |
| SWOOLE_HTTP2_ERROR_HTTP_1_1_REQUIRED   | HTTP/1.1 required (the use of HTTP/1.1 instead of HTTP/2 is required) |

### close

Closes the connection.

```php
public function close(): bool
```

**Return value**: Returns `true` on success and `false` on failure.

## Examples

```php
<?php
use Swoole\Coroutine\Http2\Request;
use Swoole\Coroutine\Http2\Client;
use function Swoole\Coroutine\run;

run(function () {
    $domain = 'www.zhihu.com';
    $cli = new Client($domain, 443, true);
    $cli->set([
        'timeout' => -1,
        'ssl_host_name' => $domain
    ]);
    $cli->connect();
    $req = new Request();
    $req->method = 'POST';
    $req->path = '/api/v4/answers/300000000/voters';
    $req->headers = [
        'host' => $domain,
        'user-agent' => 'Chrome/49.0.2587.3',
        'accept' => 'text/html,application/xhtml+xml,application/xml',
        'accept-encoding' => 'gzip'
    ];
    $req->data = '{"type":"up"}';
    $cli->send($req);
    $response = $cli->recv();
    var_dump(assert(json_decode($response->data)->error->code === 10002));
    $cli->close();
});
```