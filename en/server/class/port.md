# Swoole\Server\Port

If you have already read [Multi-Port Listening](/en/server/port.html), you will find that `Swoole\Server\Port` is the core class that implements mixed protocols on multiple ports of a single machine in a `Swoole` server. It lets you add multiple extra listening ports to an async server's main service, and independently configure protocol parsing rules and event callbacks for each port.

You cannot `new` this object directly; instead, it is created through the main server's [listen](/en/server/methods.html#listen) method.

## Methods

### on

Binds dedicated callbacks for an extra port. This way, the same [worker](/en/server/process_thread.html) process executes different business code when handling connections on different ports.

```php
public function on(string $event_name, callable $callback): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$event_name` | Event name | Required |
| `$callback` | Sets the event callback | Required |

| Events supported by this method | Description |
| :--- | :--- |
| [connect](/en/server/events.html#connect) | Triggered when a client connection is established |
| [close](/en/server/events.html#close) | Triggered when a client connection is closed |
| [disconnect](/en/server/events.html#disconnect) | Triggered when a WebSocket connection is disconnected |
| [receive](/en/server/events.html#receive) | Triggered when a TCP data stream is received |
| [packet](/en/server/events.html#packet) | Triggered when a UDP packet is received |
| [message](/en/server/events.html#message) | Triggered when a WebSocket message is received |
| [request](/en/server/events.html#request) | Triggered when an HTTP request is received |
| [handshake](/en/server/events.html#handshake) | Triggered during the WebSocket handshake |
| [beforeHandshakeResponse](/en/server/events.html#beforehandshakeresponse) | Triggered before sending the WebSocket handshake response |
| [open](/en/server/events.html#open) | Triggered when the connection opens after a successful WebSocket handshake |

### set

Configures different communication protocols for the main port and extra ports. For example, the main port handles `WebSocket` while an extra port handles `TCP` stream processing.

```php
public function set(array $settings): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$settings` | Sets the server's runtime configuration | Required |

| Configuration options supported by this method | Description |
|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| [backlog](/en/server/setting.html#backlog)                                     | Controls the maximum length of the TCP accept queue. |
| [socket_buffer_size](/en/server/setting.html#socket-buffer-size)               | Controls the size of the buffer used by the server to send data to clients |
| [heartbeat_idle_time](/en/server/setting.html#heartbeat-idle-time)             | The maximum allowed idle time of a client TCP connection, in seconds. If a client connection sends no data to the server within heartbeat_idle_time seconds, the connection is forcibly closed. |
| [buffer_high_watermark](/en/server/setting.html#buffer-high-watermark)         | Sets the high watermark of the server-side and client-side buffers. It does not directly limit memory size, but acts as a warning threshold. Unit: bytes |
| [buffer_low_watermark](/en/server/setting.html#buffer-low-watermark)           | Sets the low watermark of the server-side and client-side buffers. It does not directly limit memory size, but acts as a warning threshold. Unit: bytes |
| [max_idle_time](/en/server/setting.html#max-idle-time)                         | Specifies the maximum idle time of a TCP connection. If no read or write occurs on the connection within max_idle_time, the underlying layer actively closes it |
| [open_tcp_nodelay](/en/server/setting.html#open-tcp-nodelay)                   | Disables the Nagle algorithm so small packets are sent immediately instead of waiting to be merged. |
| [tcp_defer_accept](/en/server/setting.html#tcp-defer-accept)                   | The tcp_defer_accept parameter controls whether the server defers allocating socket and application-layer resources when a new TCP connection is established |
| [open_tcp_keepalive](/en/server/setting.html#open-tcp-keepalive)               | Enables the TCP KeepAlive mechanism, letting the OS kernel automatically detect whether connections are still valid and clean up dead ones. |
| [tcp_keepidle](/en/server/setting.html#tcp-keepidle)                           | How long a TCP connection must be idle before the kernel sends the first KeepAlive probe to check whether the connection is still alive. |
| [tcp_keepinterval](/en/server/setting.html#tcp-keepinterval)                   | The interval between TCP KeepAlive probes. It determines how often probes are resent after the first probe receives no response. |
| [tcp_keepcount](/en/server/setting.html#tcp-keepcount)                         | The maximum number of retries before closing the connection after TCP KeepAlive probes fail. It determines how many attempts the system is willing to make before receiving a probe response. |
| [tcp_user_timeout](/en/server/setting.html#tcp-user-timeout)                   | After the sender transmits data, if the peer's ACK is not received in time, TCP retransmits using exponential backoff. Once the cumulative retransmission time exceeds the tcp_user_timeout value, the connection is closed. |
| [tcp_fastopen](/en/server/setting.html#tcp-fastopen)                           | Enables the TCP Fast Open feature, which allows application data to be carried during the three-way handshake, saving one RTT (round-trip time) of latency. |
| [open_eof_check](/en/server/setting.html#open-eof-check)                       | This option checks data sent by the client: the underlying layer stops receiving only when the end of the packet matches the specified delimiter (such as `\r\n`); otherwise, data keeps being appended until the buffer limit is exceeded or reception times out. |
| [open_eof_split](/en/server/setting.html#open-eof-split)                       | The underlying layer scans the data stream byte by byte, automatically splitting and delivering a complete packet each time the specified delimiter (such as `\r\n`) is encountered |
| [package_eof](/en/server/setting.html#package-eof)                             | Sets the packet delimiter. |
| [open_length_check](/en/server/setting.html#open-length-check)                 | Enables packet length checking for protocol parsing. |
| [package_length_type](/en/server/setting.html#package-length-type)             | Specifies the type of the length field (e.g., 'N' for a 4-byte unsigned long). Same as PHP's pack function. |
| [package_length_offset](/en/server/setting.html#package-length-offset)         | The core parameter for locating the length field. It tells the server: "the length field value is stored at this byte offset in the packet". |
| [package_body_offset](/en/server/setting.html#package-body-offset-package-body-start)             | The offset locating the start of the packet body. Tells the server at which byte of the packet the actual business data (body) begins. |
| [package_length_func](/en/server/setting.html#package-length-func)             | Defines a custom PHP function to tell Swoole how long a complete packet is. This function receives the partially received data (stored in a buffer), and you implement your core logic inside it: parse and return the length of the entire packet. |
| [package_max_length](/en/server/setting.html#package-max-length)               | Sets the maximum receivable packet size, in bytes. |
| [open_http_protocol](/en/server/setting.html#open-http-protocol)               | Enables the HTTP protocol |
| [open_websocket_protocol](/en/server/setting.html#open-websocket-protocol)     | Enables the WebSocket protocol |
| [open_http2_protocol](/en/server/setting.html#open-http2-protocol)             | Enables the HTTP2 protocol |
| [open_mqtt_protocol](/en/server/setting.html#open-mqtt-protocol)               | Enables the MQTT protocol |
| [open_redis_protocol](/en/server/setting.html#open-redis-protocol)             | Enables the Redis protocol |
| [ssl_compress](/en/server/setting.html#ssl-compress)                           | Sets whether to enable SSL/TLS compression |
| [ssl_protocols](/en/server/setting.html#ssl-protocols)                         | Sets the protocols used for OpenSSL tunnel encryption |
| [ssl_verify_peer](/en/server/setting.html#ssl-verify-peer)                     | Server SSL setting to verify the peer certificate |
| [ssl_allow_self_signed](/en/server/setting.html#ssl-allow-self-signed)         | Allows self-signed certificates |
| [ssl_client_cert_file](/en/server/setting.html#ssl-client-cert-file)           | Root certificate, used to verify client certificates |
| [ssl_cafile](/en/server/setting.html#ssl-cafile)                               | The CA certificate used to verify the remote certificate. The value of this option is the full path and filename of the CA certificate on the local filesystem. |
| [ssl_capath](/en/server/setting.html#ssl-capath)                               | If ssl_cafile is not set, or the file it points to does not exist, suitable certificates are searched in the directory specified by ssl_capath. This directory must be a hashed certificate directory. |
| [ssl_verify_depth](/en/server/setting.html#ssl-verify-depth)                   | If the certificate chain is deeper than the value set by this option, verification is terminated. |
| [ssl_prefer_server_ciphers](/en/server/setting.html#ssl-prefer-server-ciphers) | Determines who chooses the cipher suite when the client (browser) and server establish an encrypted connection. |
| [ssl_ciphers](/en/server/setting.html#ssl-ciphers)                             | Sets the OpenSSL cipher list. Default: `EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH` |
| [ssl_ecdh_curve](/en/server/setting.html#ssl-ecdh-curve)                       | Specifically controls the elliptic curve used during ECDH key exchange. |
| [ssl_dhparam](/en/server/setting.html#ssl-dhparam)                             | Specifies strong parameters for Diffie-Hellman (DH) key exchange. When the server uses legacy DHE cipher suites, this directive tells the server which "large prime file" to use to generate ephemeral session keys, ensuring security. |
| [ssl_sni_certs](/en/server/setting.html#ssl-sni-certs)                         | Sets SNI (Server Name Identification) certificates. |

### getCallback

Gets the callback for a given event name.

```php
public function getCallback(string $event_name): \Closure|string|null|array
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$event_name` | Event callback name | Required |

## Examples

```php
<?php
use Swoole\Server;

$server = new Server('127.0.0.1', 9501);

// 1. Main port configuration: assume it handles some fixed-length packets
$server->set([
    'open_length_check' => true,
    'package_length_type' => 'C',
    'package_length_offset' => 100, // Assume byte 100 holds the packet length value
    'package_max_length' => 1000,  // Data sent to port 9501 will never exceed 1000 bytes
]);

// Main port receive event
$server->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    echo "Port 9501 received data\n";
});

// 2. Listen on sub-port 9502
$port = $server->listen("127.0.0.1", 9502, SWOOLE_SOCK_TCP);

// [Key] The configuration must be overridden; otherwise 9502 would also use package_length_type=C, package_length_offset=100 and package_max_length=1000 above
$port->set([
    'open_length_check' => true,
    'package_length_type' => 'N',
    'package_length_offset' => 200, // Assume byte 200 holds the packet length value
    'package_max_length' => 800000, // Data sent to port 9502 will never exceed 800000 bytes
]);

// [Key] Events must be bound separately for the sub-port; otherwise the main port's receive event would still be triggered
$port->on('receive', function(Server $server, int $fd, int $reactorId, string $data) {
    echo "Port 9502 received data, using different parsing rules\n";
});

$server->start();
```