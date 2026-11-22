# WebSocket 協程服務器

藉助 [Swoole\Coroutine\Http\Server](/zh-hant/server/coroutine/http.html) 和 [handle](/zh-hant/server/coroutine/http.html#handle) 回調函數中的 [Swoole\Http\Response](/zh-hant/server/class/response.html) 對象，我們可以把一個 `HTTP` 服務器升級成 `WebSocket` 服務器。

## 示例

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
