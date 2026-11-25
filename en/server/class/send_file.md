# Swoole\SendFile

`Swoole\SendFile` is a helper class introduced in `v6.3.0`, an object dedicated to describing a "file to be sent". It encapsulates the file path, offset, send length, and the "delete after send" option into a single object that can be passed directly to [Swoole\Http\Response::sendfile()](/en/server/class/response.html#sendfile) and [Swoole\Server::sendfile()](/en/server/methods.html#sendfile).

For scenarios such as "generate a temporary report first, then send it", setting `deleteAfterSend` to `true` makes the file get deleted automatically when the send task finishes, with no need for business code to call `unlink` manually, greatly simplifying file lifecycle management.

## Properties

| Property | Type | Description | Default |
|:---|:---|:---|:---|
| `$filename` | `string` | The file path, passed via the constructor, read-only | Required |
| `$offset` | `int` | The file offset to start sending from, must be greater than or equal to `0` | `0` |
| `$length` | `int` | The length of data to send, must be greater than or equal to `0`; `0` means sending all remaining content from `$offset` | `0` |
| `$deleteAfterSend` | `bool` | Whether to delete the file automatically when the send task finishes | `false` |

## Methods

### __construct

Constructs a file-to-send object.

```php
public function __construct(string $filename)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$filename` | The file path, must not be empty or contain `null` bytes | Required |

## Example

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\SendFile;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function (Request $request, Response $response) {
    // Generate a temporary report first
    $filename = tempnam(sys_get_temp_dir(), 'report_');
    file_put_contents($filename, 'report content');

    // The temporary file is deleted automatically after sending
    $file = new SendFile($filename);
    $file->deleteAfterSend = true;
    $response->sendfile($file);
});
$server->start();
```

> [!WARNING]
> **Notes**
>
> - Available since Swoole `v6.3.0`.
> - When passing a `SendFile` object to `sendfile()`, the `$offset`, `$length`, and `$delete_file` arguments must not be provided, otherwise a `ValueError` is thrown; the object's properties take effect instead.
> - `$filename` is a read-only property, and the constructor can only be called once.
> - When `deleteAfterSend` is `true`, once the send request is accepted by the underlying layer, ownership of the file cleanup is transferred, and the object cannot be used for `sendfile()` again, otherwise an `Error` is thrown.
> - The file is deleted when the send task finishes, including when sending fails or the connection closes early; if parameter validation fails (such as the file not existing), the file is kept.
> - The class is `final` and cannot be serialized or cloned.