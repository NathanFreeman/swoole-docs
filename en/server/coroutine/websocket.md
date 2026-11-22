# WebSocket Coroutine Server

With [Swoole\Coroutine\Http\Server](/en/server/coroutine/http.html) and the [Swoole\Http\Response](/en/server/class/response.html) object in the [handle](/en/server/coroutine/http.html#handle) callback, we can upgrade an `HTTP` server into a `WebSocket` server.

## Examples

```php
<?php
use Swoole\Coroutine\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use function Swoole\Coroutine\run;

run(function() {
    $server = new Server('127.0.0.1', 9502, false, true);
    $server->handle('/', function (Request $request, Response $response) {
        $response->upgrade();
        while(true) {
            $frame = $response->recv();
            if ($frame) {
                $response->push($frame);
            }
            
            if (!$frame) {
                echo 'errorCode: ' . swoole_last_error() . "\n";
                $response->close();
                break;
            }
        }
    });
    $server->start();
});
```