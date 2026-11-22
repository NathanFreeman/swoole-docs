# Coroutine Container

`Swoole`'s coroutine container can be understood as the **environment** or **dispatch room** in which coroutines run. It manages the **creation**, **execution**, and **switching** of all coroutines, ensuring that coroutine code runs efficiently in asynchronous non-blocking mode. Simply put, all coroutines must run inside a container.

## Creating a Coroutine Container

### The run() Function

```php
<?php
use function Swoole\Coroutine\run;
use function Swoole\Coroutine\go;

run(function () {
    go(function () {
        sleep(2);  // Coroutine 1
        echo 'coroutine 1' . PHP_EOL;
    });

    go(function () {
        sleep(1);  // Coroutine 2
        echo 'coroutine 2' . PHP_EOL;
    });
});
```

`run()` is the core entry point of coroutine scheduling:

- It automatically initializes the event loop and the scheduler under the hood, providing the runtime environment required for coroutines' **concurrent execution**, **automatic suspension**, and **resumption**.
- It is provided by the `library` module, so you must set `swoole.enable_library=On` in `php.ini` to use it.
- `run()` itself creates a coroutine environment, and its callback function also executes inside a coroutine. If you only need to run a single coroutine, there is no need to call [`go()`](/en/coroutine/coroutine_api.html#create) again — just write your business logic directly in the `run()` callback.
- Apart from [async servers](/en/server/tcp_udp.html), standalone scripts and custom programs all need to create a coroutine container via the `run()` method.

> [!WARNING]
> You cannot nest `run()` inside `run()`; otherwise you will get the error `Unable to call Event::wait() in coroutine`.

### Async Servers

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->set([
    'enable_coroutine' => true
]);
$server->on('request', function (Request $request, Response $response) {
    $response->end('<h1>Hello World</h1>');
});

$server->start();
```

After setting [enable_coroutine](/en/server/setting.html#enable-coroutine) to `true`, the callback of every [request](/en/server/events.html#request) event automatically executes inside a **coroutine container**, with no need to call `run()` manually.

> [!TIP]
> For more details about async servers, see the "Async Servers" chapter. Here you only need to know this: with `enable_coroutine` set to `true`, when the async server executes the callbacks of **certain** events, it automatically creates a coroutine container and schedules coroutines to run the callbacks.

> [!WARNING]
> If the async server has already enabled coroutines via `enable_coroutine`, you must not execute `Swoole\Coroutine\run` inside the callbacks.