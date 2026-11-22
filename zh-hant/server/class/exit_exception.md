# Swoole\ExitException

`Swoole\ExitException` 是 `Swoole` 爲了解決在常駐內存服務中濫用 `exit` 導致進程崩潰而設計的一個安全機制。簡單來說，它將原本會導致整個進程退出的 `exit`，變成了一個可以在協程中被捕獲的異常。

## 方法

### getStatus

獲取調用 `exit()` 函數時傳入的狀態碼或消息。

```php
public function getStatus(): mixed
```

**返回值**：即 `exit()` 傳入什麼，它就返回什麼。

### getFlags

判斷 `exit()` 操作發生的具體上下文環境，幫助開發者瞭解這個退出異常是從哪裏拋出的。

```php
public function getFlags(): int
```

**返回值**：`SWOOLE_EXIT_IN_COROUTINE`，協程中退出；`SWOOLE_EXIT_IN_SERVER`，在異步服務器中退出。

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
