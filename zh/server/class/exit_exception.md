# Swoole\ExitException

`Swoole\ExitException` 是 `Swoole` 为了解决在常驻内存服务中滥用 `exit` 导致进程崩溃而设计的一个安全机制。简单来说，它将原本会导致整个进程退出的 `exit`，变成了一个可以在协程中被捕获的异常。

## 方法

### getStatus

获取调用 `exit()` 函数时传入的状态码或消息。

```php
public function getStatus(): mixed
```

**返回值**：即 `exit()` 传入什么，它就返回什么。

### getFlags

判断 `exit()` 操作发生的具体上下文环境，帮助开发者了解这个退出异常是从哪里抛出的。

```php
public function getFlags(): int
```

**返回值**：`SWOOLE_EXIT_IN_COROUTINE`，协程中退出；`SWOOLE_EXIT_IN_SERVER`，在异步服务器中退出。

## 示例

```php
<?php
use Swoole\ExitException;
use function Swoole\Coroutine\run;
run(function () {
    try {
        exit(255);
    } catch (ExitException $e) {
        var_dump($e->getMessage());
        var_dump($e->getStatus() === 255);
        var_dump($e->getFlags() === SWOOLE_EXIT_IN_COROUTINE);
    }
});
```
