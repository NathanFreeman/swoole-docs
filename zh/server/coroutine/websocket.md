# WebSocket 协程服务器

借助 [Swoole\Coroutine\Http\Server](/zh/server/coroutine/http.html) 和 [handle](/zh/server/coroutine/http.html#handle) 回调函数中的 [Swoole\Http\Response](/zh/server/class/response.html) 对象，我们可以把一个 `HTTP` 服务器升级成 `WebSocket` 服务器。

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
