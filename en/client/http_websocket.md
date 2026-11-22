# HTTP Coroutine Client

- `Swoole\Coroutine\Http\Client` is the coroutine version of the `HTTP/HTTPS` client provided by `Swoole`, used to make `HTTP` and `WebSocket` requests in a coroutine environment
- Only `gzip` message compression is supported (requires the `zlib` library).

## Properties

### socket

The [`Swoole\Coroutine\Socket`](/en/client/socket.html) object corresponding to the current connection `fd`, allowing lower-level operations.

```php
public Swoole\Coroutine\Socket $socket;
```

### errCode

The error code of the most recent operation.

```php
public int $errCode = 0;
```

### errMsg

The error message of the most recent operation.

```php
public string $errMsg = '';
```

### connected

Whether the client is currently connected to the server.

```php
public bool $connected = false;
```

### host

The server address.

```php
public string $host;
```

### port

The server port.

```php
public int $port;
```

### ssl

Whether an `ssl` connection is enabled.

```php
public bool $ssl;
```

### setting

The connection settings of the current client.

```php
public array $setting;
```

### requestMethod

The request method of the current `HTTP` client.

```php
public string $requestMethod;
```

### requestHeaders

The request headers of the current `HTTP` client.

```php
public array $requestHeaders;
```

### requestBody

The request body of the current `HTTP` client.

```php
public array $requestBody;
```

### uploadFiles

The files to upload for the current `HTTP` client.

```php
public array $uploadFiles;
```

### downloadFile

The file downloaded from the server.

```php
public array $downloadFile;
```

### downloadOffset

The offset of the file downloaded from the server.

```php
public int $downloadOffset;
```

### statusCode

The status code of the current request.

```php
public int $statusCode;
```

### headers

The response headers from the `HTTP` server.

```php
public array headers;
```

### set_cookie_headers

The raw response `cookie` headers from the `HTTP` server.

```php
public array $set_cookie_headers;
```

**Example**

```php
["set_cookie_headers"]=>
  array(4) {
    [0]=>
    string(129) "BAIDUID=CE62AAD88DC35A8ED32959FE69170AD6:FG=1; expires=Thu, 31-Dec-37 23:55:55 GMT; max-age=2147483647; path=/; domain=.baidu.com"
    [1]=>
    string(125) "BIDUPSID=CE62AAD88DC35A8ED32959FE69170AD6; expires=Thu, 31-Dec-37 23:55:55 GMT; max-age=2147483647; path=/; domain=.baidu.com"
    [2]=>
    string(99) "PSTM=1779953245; expires=Thu, 31-Dec-37 23:55:55 GMT; max-age=2147483647; path=/; domain=.baidu.com"
    [3]=>
    string(150) "BAIDUID=CE62AAD88DC35A8EC30AC4C975C8B357:FG=1; max-age=31536000; expires=Fri, 28-May-27 07:27:25 GMT; domain=.baidu.com; path=/; version=1; comment=bd"
```

### cookies

The response `cookie` values from the `HTTP` server.

```php
public array $cookies;
```

**Example**

```php
["cookies"]=>
  array(3) {
    ["BAIDUID"]=>
    string(37) "CE62AAD88DC35A8EC30AC4C975C8B357:FG=1"
    ["BIDUPSID"]=>
    string(32) "CE62AAD88DC35A8ED32959FE69170AD6"
    ["PSTM"]=>
    string(10) "1779953245"
  }
```

> [!TIP]
> The difference from `set_cookie_headers` is that `set_cookie_headers` does not convert the `cookie` into a key-value array.

### body

The body content of the `HTTP` response.

```php
public string $body = '';
```

## Methods

### __construct

Constructor. Creates an `HTTP`/`WebSocket` client.

```php
public function __construct(string $host, int $port = 0, bool $ssl = false)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$host` | Target server host address [can be an IP or a domain name; domain resolution is performed automatically by the underlying layer. For a local UNIXSocket, use a format like `unix://tmp/your_file.sock`. For a domain name, do not include the `http://` or `https://` scheme prefix] | Required |
| `$port` | Target server port | `0` |
| `$ssl` | Whether to enable `SSL/TLS` tunnel encryption. If the target server uses https, the `$ssl` parameter must be set to `true` | `false` |

### set

Sets the runtime configuration of the `HTTP`/`WebSocket` client.

```php
public function set(array $settings): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$settings` | Runtime configuration of the `HTTP`/`WebSocket` client | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Supported settings**

| Option | Description | Example |
|:---|:---|:---|
| `max_retries` | Sets the maximum number of retries when a connection fails. | `3` |
| `defer` | Enables defer mode. After a request is sent, the response is not awaited immediately; the coroutine can handle other tasks and later retrieve the result via `recv()`, improving concurrency. | `true` |
| `lowercase_header` | Converts all HTTP response header names to lowercase. | `true` |
| `keep_alive` | Enables HTTP persistent connections, reusing the same TCP connection for multiple requests to improve efficiency. | `true` |
| [`http_compression`](/en/server/setting.html#http-compression) | Enables HTTP request compression (such as gzip) to reduce the amount of transferred data. | `true` |
| `body_decompression` | When enabled, automatically decompresses compressed response bodies returned by the server (such as gzip content). | `true` |
| `write_func` | Callback for a custom data-sending function. | `function($client, $data) { /* ... */ }` |
| [`websocket_subprotocol`](/en/server/setting.html#websocket-subprotocol) | Sets the subprotocol to use during the WebSocket handshake. | `'chat'` |
| `websocket_mask` | Sets whether to apply a mask to WebSocket frame data. Per the RFC, data sent by the client must be masked; defaults to `true`. | `true` |
| [`websocket_compression`](/en/server/setting.html#websocket-compression) | Enables WebSocket message compression. Requires server support and depends on the `zlib` library. | `true` |
| [`open_websocket_ping_frame`](/en/server/setting.html#open-websocket-ping-frame) | When enabled, Ping frames from the server are no longer answered with Pong automatically by the underlying layer; instead they are returned via `recv()` for the user to handle (in Swoole 6.1+, the underlying layer handles control frames automatically by default). | `true` |
| [`open_websocket_pong_frame`](/en/server/setting.html#open-websocket-pong-frame) | When enabled, Pong frames from the server are no longer handled automatically by the underlying layer; instead they are returned via `recv()` for the user to handle (in Swoole 6.1+, the underlying layer handles control frames automatically by default). | `true` |
| `timeout` | **Global timeout** (seconds), uniformly controlling the connect, read, and write timeouts. Lower priority than `connect_timeout`, `read_timeout`, and `write_timeout`. | `0.5` |
| `connect_timeout` | **Connect timeout** (seconds), separately controlling the timeout of the TCP handshake phase. | `1.0` |
| `read_timeout` | **Read timeout** (seconds), separately controlling the timeout while waiting for data. | `0.5` |
| `write_timeout` | **Write timeout** (seconds), separately controlling the timeout while sending data. | `0.5` |
| `bind_address` | In multi-NIC environments, forces binding to a local IP address. Must be used together with `bind_port`. | `'192.168.1.100'` |
| `bind_port` | Forces binding to a local port number. Must be used together with `bind_address`. | `9501` |
| [`socket_buffer_size`](/en/server/setting.html#socket-buffer-size) | Total size of the send buffer (bytes). | `1024 * 1024 * 2` |
| [`open_tcp_nodelay`](/en/server/setting.html#open-tcp-nodelay) | Disables the Nagle algorithm so small packets are sent immediately without waiting to be merged. | `true` |
| `socks5_host` | IP or domain name of the SOCKS5 proxy server. | `'192.168.1.1'` |
| `socks5_port` | Port of the SOCKS5 proxy server. | `1080` |
| `socks5_username` | SOCKS5 proxy authentication username (optional). | `'admin'` |
| `socks5_password` | SOCKS5 proxy authentication password (optional). | `'123456'` |
| `http_proxy_host` | IP or domain name of the HTTP proxy server. | `'192.168.1.1'` |
| `http_proxy_port` | Port of the HTTP proxy server. | `8080` |
| `http_proxy_username` | HTTP proxy authentication username (optional). | `'admin'` |
| `http_proxy_password` | HTTP proxy authentication password (optional). | `'123456'` |
| [`open_http2_protocol`](/en/server/setting.html#open-http2-protocol) | Enables HTTP/2 protocol support (must be used over SSL). | `true` |
| [`open_eof_check`](/en/server/setting.html#open-eof-check) | Enables EOF boundary checking; receiving stops only when the end of a packet matches the delimiter. | `true` |
| [`open_eof_split`](/en/server/setting.html#open-eof-split) | Enables automatic EOF splitting, scanning byte by byte and splitting complete packets by the delimiter. | `true` |
| [`package_eof`](/en/server/setting.html#package-eof) | Specifies the EOF delimiter. | `"\r\n"` |
| `open_fastcgi_protocol` | Enables FastCGI protocol parsing. | `true` |
| [`open_mqtt_protocol`](/en/server/setting.html#open-mqtt-protocol) | Enables MQTT protocol parsing. | `true` |
| [`open_length_check`](/en/server/setting.html#open-length-check) | Enables length-based protocol parsing. | `true` |
| [`package_length_type`](/en/server/setting.html#package-length-type) | Type of the length field, consistent with the `pack()` function; e.g. `'N'` means a 4-byte unsigned long. | `'N'` |
| [`package_length_offset`](/en/server/setting.html#package-length-offset) | Starting offset of the length field within the packet (bytes). | `0` |
| [`package_body_offset`](/en/server/setting.html#package-body-offset-package-body-start) | Starting offset of the body data within the packet (bytes). | `4` |
| [`package_length_func`](/en/server/setting.html#package-length-func) | Custom length-parsing function that returns the length of a complete packet. | `function($data) { return 4 + unpack('N', substr($data, 0, 4))[1]; }` |
| [`package_max_length`](/en/server/setting.html#package-max-length) | Maximum receivable packet size (bytes). | `8192` |
| [`ssl_protocols`](/en/server/setting.html#ssl-protocols) | Allowed SSL/TLS protocol versions. | `SWOOLE_SSLv23_METHOD` |
| [`ssl_compress`](/en/server/setting.html#ssl-compress) | Whether to enable SSL/TLS compression. | `false` |
| [`ssl_cert_file`](/en/server/setting.html#ssl-cert-file-ssl-key-file) | Path to the client certificate file (used for mutual authentication). | `'/etc/ssl/client.crt'` |
| [`ssl_key_file`](/en/server/setting.html#ssl-cert-file-ssl-key-file) | Path to the client private key file (used for mutual authentication). | `'/etc/ssl/client.key'` |
| `ssl_passphrase` | Password of the private key file (if encrypted). | `'pass123'` |
| `ssl_host_name` | SNI domain name, used so the server returns the correct SSL certificate. | `'www.example.com'` |
| [`ssl_verify_peer`](/en/server/setting.html#ssl-verify-peer) | Whether to verify the peer certificate. | `true` |
| [`ssl_allow_self_signed`](/en/server/setting.html#ssl-allow-self-signed) | Whether to allow self-signed certificates. | `true` |
| [`ssl_cafile`](/en/server/setting.html#ssl-cafile) | Path to the CA certificate file, used to verify the peer certificate signature. | `'/etc/ssl/ca.crt'` |
| [`ssl_capath`](/en/server/setting.html#ssl-capath) | Path to the CA certificate directory (must be a hash directory), used when `ssl_cafile` is not set or invalid. | `'/etc/ssl/certs'` |
| [`ssl_verify_depth`](/en/server/setting.html#ssl-verify-depth) | Maximum depth for certificate chain verification; verification terminates beyond this depth. | `5` |
| [`ssl_ciphers`](/en/server/setting.html#ssl-ciphers) | Sets the OpenSSL cipher suite. | `'ECDHE-RSA-AES128-GCM-SHA256'` |
| [`ssl_ecdh_curve`](/en/server/setting.html#ssl-ecdh-curve) | Controls the elliptic curve used for ECDH key exchange. | `'secp256r1'` |
| `ssl_grease` | Enables the TLS GREASE (anti-ossification) extension, improving compatibility with non-standard servers; only applies to Google's `BoringSSL`. | `true` |

### setDefer

Enables defer mode.

```php
public function setDefer(bool $defer = true): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$defer` | Whether to enable defer mode. Other values: `false` | `true` |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // Create multiple clients for concurrent requests
    $clients = [];
    for ($i = 0; $i < 5; $i++) {
        $cli = new Client('127.0.0.1', 80);
        $cli->setHeaders([
            'Host' => 'localhost',
            'User-Agent' => 'Chrome/49.0.2587.3',
        ]);
        $cli->set(['timeout' => 2]);
        
        // Enable defer mode (send only, do not receive yet)
        $cli->setDefer(true);
        $cli->get('/api/user/' . $i);
        
        $clients[] = $cli;
    }
    
    // Receive responses in batch
    $results = [];
    foreach ($clients as $cli) {
        $cli->recv();      // Wait for and receive the response
        $results[] = $cli->body;
    }
    
    $client->close();
});
```

> [!WARNING]
> `setDefer` splits `sending the request` and `receiving the response` into two steps; the response must be retrieved via [recv](/en/client/http_websocket.html#recv)

### getDefer

Checks whether defer mode is enabled for the current request.

```php
public function getDefer(): bool
```

**Return value**: `true` means defer mode is enabled, `false` means defer mode is disabled.

### setMethod

Sets the request method of the `HTTP` client. Only valid for the current request; the method setting is cleared immediately after the request is sent.

```php
public function setMethod(string $method): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$method` | Sets the request method | Required |

**Return value**: Returns `true` on success, `false` on failure.

### setHeaders

Sets the request headers of the `HTTP` client.

```php
public function setHeaders(array $headers): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$headers` | Sets the request headers [must be a key-value array; the underlying layer automatically maps it to the standard `HTTP` header format `$key`: `$value`] | Required |

**Return value**: Returns `true` on success, `false` on failure.

### setBasicAuth

Sets `HTTP` Basic Authentication.

```php
public function setBasicAuth(string $username, string $password): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$username` | Username for `HTTP Basic Auth` | Required |
| `$password` | Password for `HTTP Basic Auth` | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // Set request headers
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
        'Accept' => 'text/html,application/xhtml+xml,application/xml',
    ]);
    
    // Set the timeout
    $client->set(['timeout' => 2]);
    
    // Set Basic Auth
    $client->setBasicAuth('user', 'pass');
    
    // Send the request
    $client->get('/user');
    
    echo $client->body;
    $client->close();
});
```

### setCookies

Sets the request `Cookie` of the `HTTP` client.

```php
public function setCookies(array $cookies): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$cookies` | Sets the `COOKIE` [must be a key-value array] | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Notes**

- The `cookie` values that are set persist for the lifetime of the client object.
- Calling `setCookies` repeatedly overwrites the current `cookie` state, discarding both the `cookie` values previously issued by the server and any previously set manually.
- `cookie` values are `urlencode`-encoded. To keep the original values, set a request header named `Cookie` yourself via `setHeaders`.

### setData

Sets the `HTTP` request body `(body)` data.

```php
public function setData(array|string $data): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | Sets the request body | Required |

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
        'Accept' => 'text/html,application/xhtml+xml,application/xml',
    ]);
    
    $client->set(['timeout' => 1]);
    
    // Set the data using an array
    $client->setData(['msg' => 'Hello', 'from' => 'Swoole']);
    
    // Execute the request (must be used together with setMethod)
    $client->setMethod('POST');
    $status = $client->execute('/index');
    
    echo $status . "\n";
    var_dump($client->body);
    
    $client->close();
});
```

**Notes**

- When `$data` is set but `$method` is not, the underlying layer automatically sets the request method to `POST`.
- If `$data` is an array and `Content-Type` is `application/x-www-form-urlencoded`, the underlying layer automatically applies `http_build_query` encoding.
- If `multipart/form-data` format is enabled via `addFile` or `addData`:
    - When `$data` is a string, it is ignored (because a string is not compatible with the `multipart/form-data` format);
    - When `$data` is an array, the underlying layer appends each field of the array to the request in `multipart/form-data` format.

### addFile

Used in the `HTTP` client to upload files, supporting file uploads in `multipart/form-data` format.

```php
public function addFile(string $path, string $name, ?string $type = null, ?string $filename = null, int $offset = 0, int $length = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$path` | Path of the local file to upload | Required |
| `$name` | Form field name [required; corresponds to `$_FILES['name']` on the server side] | Required |
| `$type` | `MIME` type of the file [optional; the underlying layer infers it automatically from the file extension] (referred to as `$mimeType` in the original text) | `null` |
| `$filename` | File name [optional] | `basename($path)` |
| `$offset` | Offset of the file to upload [optional; allows transferring data starting from the middle of the file. This feature can be used to support resumable uploads.] | `0` |
| `$length` | Size of the data to send [optional] | Defaults to the size of the entire file |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // Set request headers (Content-Type automatically becomes multipart/form-data)
    $client->setHeaders([
        'Host' => 'localhost',
    ]);
    
    // Add files to upload
    $client->addFile('/home/test/1.jpg', 'img1');           // Form field name is img1
    $client->addFile('/home/test/2.jpg', 'img2');           // Multiple files can be uploaded
    
    // Send the POST request
    $client->post('/upload.php', []);
    // Or use execute
    // $client->setMethod('POST');
    // $client->execute('/upload.php');
    
    echo $client->body;
    $client->close();
});
```

### addData

A method in the `HTTP` client for uploading in-memory data. Similar to `addFile`, but it allows uploading `string content` as a `virtual file` (supports `multipart/form-data` format)

```php
public function addData(string $data, string $name, ?string $type = null, ?string $filename = null, int $offset = 0, int $length = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | Data content [required; the maximum length must not exceed `buffer_output_size`] | Required |
| `$name` | Form field name [required; corresponds to `$_FILES['name']` on the server side] | Required |
| `$type` | `MIME` type of the file [optional; defaults to `application/octet-stream`] (referred to as `$mimeType` in the original text) | `null` |
| `$filename` | File name [optional; defaults to `$name`] | `null` |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // Prepare the in-memory data to upload (e.g. a dynamically generated image, a JSON string, etc.)
    $imageData = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    
    // Upload the in-memory data as a file
    $client->addData($imageData, 'test.png', 'image_file', 'image/png');
    
    // Send the POST request
    $client->post('/upload.php', []);
    
    echo $client->body;
    $client->close();
});
```

### execute

The core method for executing an `HTTP` request.

```php
public function execute(string $path): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$path` | Request path | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // Set request headers
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
    ]);
    
    // Set the timeout
    $client->set(['timeout' => 5]);
    
    // Execute a GET request
    $client->setMethod('GET');
    $client->execute('/api/users');
    
    // Check the result
    if ($client->statusCode == 200) {
        echo $client->body;
    } else {
        echo "Error: " . $client->statusCode;
    }
    
    $client->close();
});
```

### getsockname

Gets the local `Socket` address information of the client.

```php
public function getsockname(): array|false
```

**Return value**: Returns an array containing the client information on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('www.baidu.com', 80);
    
    // Send the request
    $client->get('/');
    
    // Get the local Socket address information
    $localAddr = $client->getsockname();
    
    if ($localAddr) {
        echo "Local IP: " . $localAddr['address'] . "\n";
        echo "Local port: " . $localAddr['port'] . "\n";
    }
    
    $client->close();
});
```

| key     | Meaning      |
|---------|---------|
| address | Client address   |
| port    | Client listening port |

### getpeername

A method for getting the remote server `Socket` address information.

```php
public function getpeername(): array|false
```

**Return value**: Returns an array containing the server information on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('www.baidu.com', 80);
    
    // Send the request
    $client->get('/');
    
    // Get the remote Socket address information
    $remoteAddr = $client->getpeername();
    
    if ($remoteAddr) {
        echo "Remote IP: " . $remoteAddr['address'] . "\n";
        echo "Remote port: " . $remoteAddr['port'] . "\n";
    }
    
    $client->close();
});
```

| key     | Meaning      |
|---------|---------|
| address | Server address   |
| port    | Server listening port |

### get

Makes a `GET` request with the `HTTP` client.

```php
public function get(string $path): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$path` | Request path | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    // Set common request headers
    $client->setHeaders([
        'User-Agent' => 'Swoole Client',
    ]);
    
    // Send a GET request
    $success = $client->get('/get?a=1&b=2');
    
    if ($success) {
        echo "HTTP Status: " . $client->statusCode . "\n";
        echo "Response Body: " . $client->body . "\n";
    } else {
        echo "Request failed. Error code: " . $client->errCode . "\n";
    }
    
    $client->close();
}); 
```

### post

Makes a `POST` request with the `HTTP` client.

```php
public function post(string $path, mixed $data): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$path` | Request path | Required |
| `$data` | Data to submit | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    // Set common request headers
    $client->setHeaders([
        'Content-Type' => 'application/json',
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
    ]);
    
    $data = ['name' => 'John', 'age' => 25];
    $success = $client->post('/post', json_encode($data));
    
    if ($success) {
        echo "HTTP Status: " . $client->statusCode . "\n";
        echo "Response Body: " . $client->body . "\n";
    } else {
        echo "Request failed. Error code: " . $client->errCode . "\n";
    }
    
    $client->close();
});
```

> [!TIP]
> If `$data` is an array, the underlying layer automatically sets `Content-Type` to `application/x-www-form-urlencoded`.

### download

Downloads a file from a remote server.

```php
public function download(string $path, string $filename, int $offset = 0): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$path` | The requested `URL` path | Required |
| `$filename` | Specifies the file path to write the downloaded content to [automatically written to the `downloadFile` property] | Required |
| `$offset` | Specifies the offset for writing to the file [this option can be used to support resumable downloads, in combination with the `HTTP` header `Range:bytes=$offset`] | `0` |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // Set common request headers
    $client->setHeaders([
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
    ]);
    
    $client->download('/images/swoole.svg', '/home/swoole.svg');
    $client->close();
});
```

> [!IMPORTANT]
> When `$offset` is `0` and the file already exists, the underlying layer automatically truncates the file.

### getBody

Gets the body content of the `HTTP` response.

```php
public function getBody(): false|string
```

**Return value**: Returns the `response body content` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    // Set common request headers
    $client->setHeaders([
        'User-Agent' => 'Swoole Client',
    ]);
    
    // Send a GET request
    $success = $client->get('/get?a=1&b=2');
    
    if ($success) {
        echo "HTTP Status: " . $client->statusCode . "\n";
        echo "Response Body: " . $client->getBody() . "\n";
    } else {
        echo "Request failed. Error code: " . $client->errCode . "\n";
    }
    
    $client->close();
}); 
```

### getHeaders

Returns the header information of the `HTTP` response.

```php
public function getHeaders(): null|array|false
```

**Return value**: Returns an array containing the `HTTP` response header information on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    // Send a GET request
    $client->get('/get');
    
    // Get the response headers
    $headers = $client->getHeaders();
    
    if ($headers) {
        echo "=== Response Headers ===\n";
        foreach ($headers as $key => $value) {
            echo "$key: $value\n";
        }
    } else {
        echo "Failed to get response headers\n";
    }
    
    $client->close();
});
```

### getCookies

Gets the `Cookie` information returned by the server.

```php
public function getCookies(): null|array|false
```

**Return value**: Returns an array containing the `HTTP` response header information on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('example.com', 80);
    
    // Send the request
    $client->get('/login');
    
    // Get the cookies returned by the server
    $cookies = $client->getCookies();
    
    if ($cookies) {
        echo "=== Cookies returned by the server ===\n";
        foreach ($cookies as $name => $value) {
            echo "$name = $value\n";
        }
    } else {
        echo "No cookies received\n";
    }
    
    $client->close();
});
```

### getStatusCode

Gets the `HTTP` status code of the server response.

```php
public function getStatusCode(): false|int
```

**Return value**: Returns the `HTTP` status code of the response on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    
    $client->get('/get');
    
    // Get the status code
    $statusCode = $client->getStatusCode();
    
    if ($statusCode === 200) {
        echo "Request succeeded\n";
        echo "Response body: " . $client->body . "\n";
    } else {
        echo "Request failed, status code: $statusCode\n";
    }
    
    $client->close();
});
```

### getHeaderOut

Gets the raw request headers (`Raw Request Headers`) actually sent to the `server`.

```php
public function getHeaderOut(): false|string
```

**Return value**: Returns the raw request headers on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('httpbin.org', 80);
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
        'Accept' => 'text/html,application/xhtml+xml,application/xml',
        'Accept-Encoding' => 'gzip',
    ]);
    $client->get('/get');
    
    // Get the status code
    $statusCode = $client->getStatusCode();
    
    // Get the raw request headers
    var_dump($client->getHeaderOut());
    
    $client->close();
});
```

### getPeerCert

Gets the server's `SSL/TLS` certificate information.

```php
public function getPeerCert(): false|string
```

**Return value**: Returns the `X.509` certificate information on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // Set the third parameter to true to enable SSL/TLS
    $client = new Client('www.baidu.com', 443, true);
    
    $client->setHeaders([
        'Host' => 'www.baidu.com',
        'User-Agent' => 'Swoole Client',
    ]);
    
    $client->set(['timeout' => 10]);
    
    $client->get('/');
    
    // Get the server certificate information
    $cert = $client->getPeerCert();
    
    if ($cert !== false) {
        echo "Certificate retrieved successfully\n";
        
        // The openssl extension is required to parse the certificate content
        $certInfo = openssl_x509_parse($cert);
        print_r($certInfo);
    } else {
        echo "Failed to get certificate\n";
    }
    
    $client->close();
});
```

### upgrade

Upgrades the `HTTP` connection to a `WebSocket` connection.

```php
public function upgrade(string $path): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$path` | Sets the `URL` path [such as `/`; note that `http://domain` cannot be passed here] | Required |

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // Create an HTTP client
    $client = new Client('127.0.0.1', 9501);
    
    // Upgrade to a WebSocket connection
    $ret = $client->upgrade('/websocket');
    
    if (!$ret) {
        echo "WebSocket handshake failed, HTTP status code: " . $client->statusCode . "\n";
        $client->close();
        return;
    }
    
    echo "WebSocket connected!\n";
    
    // Send a message
    $client->push("Hello WebSocket!");
    
    // Receive a message
    $response = $client->recv();
    if ($response && $response->data) {
        echo "Received: " . $response->data . "\n";
    }
    
    // Close gracefully
    $client->disconnect();
});
```

> [!WARNING]
> In some cases the request succeeds and `upgrade` returns `true`, but the server did not set the `HTTP` status code to `101` — it is `200` or `403` instead, which means the server rejected the handshake request.

### push

Pushes a message to the `WebSocket` server.

```php
public function push(mixed $data, int $opcode = SWOOLE_WEBSOCKET_OPCODE_TEXT, int $flags = SWOOLE_WEBSOCKET_FLAG_FIN): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The data content to send [defaults to `UTF-8` text format; for other encodings or binary data, use [`SWOOLE_WEBSOCKET_OPCODE_BINARY`](/en/server/methods.html#push)] | Required |
| `$opcode` | Opcode; other values: `SWOOLE_WEBSOCKET_OPCODE_BINARY` | `SWOOLE_WEBSOCKET_OPCODE_TEXT` |
| `$flags` | Operation type | `SWOOLE_WEBSOCKET_FLAG_FIN` |

**Return value**: Returns `true` when the send succeeds; returns `false` when the send fails because the connection does not exist, is already closed, or the `WebSocket` handshake has not completed.

### recv

Receives a message from the `HTTP` or `WebSocket` server.

```php
public function recv(float $timeout = 0): Swoole\WebSocket\Frame|string|bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Sets the timeout. Unit: seconds [supports floating-point values, e.g. `1.5` means `1s`+`500ms`] | `0` |

**Return value**:

- `WebSocket` client: returns a [`Swoole\WebSocket\Frame`](/en/server/class/frame.html) object on success, an empty string when the connection is closed, and `false` on failure.
- `HTTP` client: returns `true` on success, an empty string when the connection is closed, and `false` on failure.

**Example**

- `HTTP` client.

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // Create multiple clients for concurrent requests
    $clients = [];
    for ($i = 0; $i < 5; $i++) {
        $cli = new Client('127.0.0.1', 80);
        $cli->setHeaders([
            'Host' => 'localhost',
            'User-Agent' => 'Chrome/49.0.2587.3',
        ]);
        $cli->set(['timeout' => 2]);
        
        // Enable defer mode (send only, do not receive yet)
        $cli->setDefer(true);
        $cli->get('/api/user/' . $i);
        
        $clients[] = $cli;
    }
    
    // Receive responses in batch
    $results = [];
    foreach ($clients as $cli) {
        $cli->recv();      // Wait for and receive the response
        $results[] = $cli->body;
    }
    
    $client->close();
});
```

- `WebSocket` client.

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // Create an HTTP client
    $client = new Client('127.0.0.1', 9501);
    
    // Upgrade to a WebSocket connection
    $ret = $client->upgrade('/websocket');
    
    if (!$ret) {
        echo "WebSocket handshake failed, HTTP status code: " . $client->statusCode . "\n";
        $client->close();
        return;
    }
    
    echo "WebSocket connected!\n";
    
    // Send a message
    $client->push("Hello WebSocket!");
    
    // Receive a message
    $response = $client->recv();
    if ($response && $response->data) {
        echo "Received: " . $response->data . "\n";
    }
    
    // Close gracefully
    $client->disconnect();
});
```

**Notes**

- The `HTTP` client must be used together with [setDefer](/en/client/http_websocket.html#setdefer); `recv` can only receive server data when `setDefer` has been set.
- After the `HTTP` client executes `recv` successfully, the response body is stored in the current [body](/en/client/http_websocket.html#body) property and can be retrieved via the [body](/en/client/http_websocket.html#body) property or the [getBody](/en/client/http_websocket.html#getbody) method.

### close

Closes the connection.

```php
public function close(): bool
```

**Return value**: Returns `true` on success, `false` on failure.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    $client = new Client('127.0.0.1', 80);
    
    // Set request headers
    $client->setHeaders([
        'Host' => 'localhost',
        'User-Agent' => 'Chrome/49.0.2587.3',
    ]);
    
    // Set the timeout
    $client->set(['timeout' => 5]);
    
    // Execute a GET request
    $client->setMethod('GET');
    $client->execute('/api/users');
    
    // Check the result
    if ($client->statusCode == 200) {
        echo $client->body;
    } else {
        echo "Error: " . $client->statusCode;
    }
    
    $client->close();
});
```

### ping

Sends a `WebSocket` heartbeat packet.

```php
public function ping(string $data = ""): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | Heartbeat packet data content | Empty string |

**Return value**: Returns `true` when the send succeeds; returns `false` when the send fails because the connection does not exist, is already closed, or the `WebSocket` handshake has not completed.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use Swoole\WebSocket\Frame;
use function Swoole\Coroutine\run;

run(function () {
    $client = new Client('127.0.0.1', 9501);
    $client->upgrade('/');  // Upgrade to a WebSocket connection first

    // Send a Ping
    $client->ping('Hello');
    $client->disconnect();
    $client->close();
});
```

> [!WARNING]
> The underlying layer automatically handles `pong` control frames sent by the server. To handle `pong` control frames manually, set `open_websocket_pong_frame` to `true` via the [set](/en/client/http_websocket.html#set) method.

### disconnect

Closes the current `WebSocket` connection.

```php
public function disconnect(int $code = SWOOLE_WEBSOCKET_CLOSE_NORMAL, string $reason = ""): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$code` | Error code | [`SWOOLE_WEBSOCKET_CLOSE_NORMAL`](/en/server/methods.html#disconnect) |
| `$reason` | Close reason | Empty string |

**Return value**: Returns `true` when the close succeeds; returns `false` when the close fails because the connection does not exist, is already closed, or the `WebSocket` handshake has not completed.

**Example**

```php
<?php
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function() {
    // Create a client and connect to the WebSocket server
    $client = new Client('127.0.0.1', 9501);
    
    // Upgrade to a WebSocket connection
    $ret = $client->upgrade('/');
    
    if (!$ret) {
        echo "WebSocket handshake failed\n";
        return;
    }
    
    echo "WebSocket connected!\n";
    
    // Send a message
    $client->push("Hello WebSocket!");
    echo "Sent: Hello WebSocket!\n";
    
    // Receive the reply
    $response = $client->recv();
    if ($response && $response->data) {
        echo "Received reply: {$response->data}\n";
    }
    
    // Send a few more messages
    for ($i = 1; $i <= 3; $i++) {
        $msg = "Message #{$i}";
        $client->push($msg);
        echo "Sent: {$msg}\n";
        
        $resp = $client->recv();
        if ($resp && $resp->data) {
            echo "Received reply: {$resp->data}\n";
        }
        
        Coroutine::sleep(1);
    }
    
    // ===== Key: use disconnect() to close the connection gracefully =====
    echo "\nPreparing to disconnect gracefully...\n";
    $client->disconnect();
    echo "disconnect() called, close frame sent\n";
    
    // Verify the connection state
    if ($client->isConnected()) {
        echo "Connection still exists\n";
    } else {
        echo "Connection closed\n";
    }
});
```

> [!WARNING]
> Unlike [close](/en/client/http_websocket.html#close), `disconnect` sends a `WebSocket` close frame to the `WebSocket` server to close the connection gracefully.