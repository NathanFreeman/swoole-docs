# 其他

## 異常處理

在協程編程中可直接使用 `try/catch` 處理異常，但必須在協程內捕獲，不得跨協程捕獲異常。如果沒有捕獲異常，會導致整個進程退出。

**錯誤示例**

```php
<?php
use function Swoole\Coroutine\run;
use Swoole\Coroutine;

try {
    run(function () {
        Coroutine::create(function () {
            throw new \RuntimeException(__FILE__, __LINE__);
        });
    });
} catch (\Throwable $e) {
    echo $e;
}
```

**正確示例**

```php
<?php
use function Swoole\Coroutine\run;
use Swoole\Coroutine;

run(function () {
    Coroutine::create(function () {
        try {
            throw new \RuntimeException(__FILE__, __LINE__);
        } catch (\Throwable $e) {
            echo $e;
        }
    });
});
```

## 退出協程

由於 [exit](https://www.php.net/manual/en/function.exit.php) 會導致整個進程直接退出，`Swoole` 在底層替換了 `exit` 的實現邏輯：在協程中執行 `exit` 會拋出一個 [Swoole\ExitException](/zh-hant/server/class/exit_exception.html) 異常。可以在需要的位置捕獲該異常，實現與原生 PHP 一樣的退出邏輯。

**示例**

```php
<?php
use Swoole\ExitException;
use function Swoole\Coroutine\run;

run(function () {
    try {
        exit(1);
    } catch (ExitException $e) {
        var_dump($e->getMessage());
        var_dump($e->getStatus() === 1);
        var_dump($e->getFlags() === SWOOLE_EXIT_IN_COROUTINE);
    }
});
```

## 禁止共享連接

與同步阻塞程序不同，協程是併發處理請求的，同一時間可能會有很多個請求在並行處理。一旦共用客戶端連接，就會導致不同協程之間發生數據錯亂。

**錯誤示例**

```php
<?php
use Redis;
use function Swoole\Coroutine\go;
use function Swoole\Coroutine\run;

run(function () {
    $redis = new Redis();
    $redis->connect('127.0.0.1');

    go(function () use ($redis) {
        $redis->set('a', 'Hello');
    });

    go(function () use ($redis) {
        $redis->set('b', 'World');
    });
});
```

## 保存協程上下文

多個協程是併發執行的，因此不能使用類靜態變量 / 全局變量保存協程上下文內容。使用局部變量是安全的，因爲局部變量的值會自動保存在協程棧中，其他協程訪問不到。

可以使用一個 `Context` 類來管理協程上下文：在 `Context` 類中，使用 [getCid](/zh-hant/coroutine/coroutine_api.html#getcid) 獲取協程 `ID`，隔離不同協程之間的全局變量，並在協程退出時清理上下文數據。

**示例**

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine;

class Context
{
    public static $pool = [];

    public static function put(string $key, $value)
    {
        self::$pool[Coroutine::getCid()][$key] = $value;
    }

    public static function get(string $key)
    {
        return self::$pool[Coroutine::getCid()][$key] ?? null;
    }

    public static function delete()
    {
        unset(self::$pool[Coroutine::getCid()]);
    }
}

$server = new Server('127.0.0.1', 9501);
$server->on('request', function (Request $request, Response $response) {
    if ($request->server['request_uri'] == '/a') {
        Context::put('name', 'a');
        Coroutine::sleep(1.0);
        echo Context::get('name');
        $response->end(Context::get('name'));
        // 退出協程時清理
        Context::delete();
    } else {
        Context::put('name', 'b');
        $response->end();
        // 退出協程時清理
        Context::delete();
    }
});

$server->start();
```

## 禁止在協程中創建進程

由於在協程中創建進程會導致新進程攜帶其他協程的上下文，因此底層禁止在協程中使用創建進程的函數。

可以使用 [exec](/zh-hant/coroutine/system_api.html#exec)、協程化的 [`shell_exec`](/zh-hant/coroutine/hook.html) 和協程化的 [`proc_open`](/zh-hant/coroutine/hook.html#swoole-hook-proc) 實現父子進程交互通信。

**示例**

```php
<?php
use Swoole\Runtime;
use function Swoole\Coroutine\run;

Runtime::enableCoroutine(SWOOLE_HOOK_ALL);
run(function () {
    $descriptorspec = array(
        0 => array("pipe", "r"),
        1 => array("pipe", "w"),
        2 => array("file", "/tmp/error-output.txt", "a")
    );

    $process = proc_open('php ' . __DIR__ . '/read_stdin.php', $descriptorspec, $pipes);

    $n = 10;
    while ($n--) {
        fwrite($pipes[0], "hello #$n \n");
        echo fread($pipes[1], 8192);
    }

    fclose($pipes[0]);
    proc_close($process);
});
```

**read_stdin.php**

```php
<?php
while (true) {
    $line = fgets(STDIN);
    if ($line) {
        echo $line;
    } else {
        break;
    }
}
```

## 魔術方法中不得產生協程切換

在 `__get` / `__set` 等魔術方法裏不得產生協程切換。

**原因**：PHP 爲防止魔術方法遞歸調用做了特殊設計——如果類定義了 `__get()` 方法，實例化並分配屬性內存（`properties_table`）時會額外分配一個類型爲 `HashTable` 的 `zval`。每次調用 `__get($var)` 時，會把 `$var` 的名稱存入這個哈希表，用它來判斷當前屬性是否已經在 `__get()` 之中：如果是，就不再調用 `__get()`；否則把 `$var` 作爲 key 插入哈希表並設置標記（`*guard |= IN_ISSET`），調用完 `__get()` 後再清除標記（`*guard &= ~IN_ISSET`）。

> [!NOTE]
> 這個哈希表並非 `__get()` 專用，其他魔術方法也會用到，因此其值類型爲 `zend_long`，不同的魔術方法佔用不同的 bit 位。它也不會爲所有對象都額外分配：對象創建時根據 `zend_class_entry.ce_flags` 是否包含 `ZEND_ACC_USE_GUARDS` 決定是否分配，類編譯時若發現定義了 `__get()`、`__set()`、`__unset()`、`__isset()` 方法，就會打上這個掩碼。

一旦在魔術方法中發生協程切換，協程切換出去後下次調用就會被判斷爲循環調用。此問題由 PHP 的**語言特性**所致，與 PHP 開發組溝通後仍暫時無解。

> [!WARNING]
> 即使魔術方法中沒有可以導致協程切換的代碼，在設置打開協程搶佔式調度後，依然可能導致魔術方法被強行切換協程。

**延伸閱讀**：[PHP7 內核剖析 · zend_object](https://github.com/pangudashu/php7-internal/blob/40645cfe087b373c80738881911ae3b178818f11/3/zend_object.md)
