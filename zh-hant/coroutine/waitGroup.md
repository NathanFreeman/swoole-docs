# 等待組

我們可以使用 `Swoole\Coroutine\WaitGroup` 讓主協程等待所有子協程任務全部執行完畢，再繼續往後運行。

它解決的是一個很常見的痛點：當你同時在多個協程裏發起了併發操作（比如多個網絡請求），如何精準地知道它們全部都已經完成了？`WaitGroup` 就是爲了解決這個問題而生的。

> [!NOTE]
> `WaitGroup` 是純 PHP 代碼實現的，底層正是基於[通道](/zh-hant/coroutine/channel.html)來完成阻塞和喚醒。

## 方法

### __construct

創建一個等待組。

```php
public function __construct(int $delta = 0)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$delta` | 初始化協程數 | `0` |

### add

有新的協程需要等待，引用計數加 1。

```php
public function add(int $delta = 1): void
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$delta` | 需要等待完成的協程數 | `1` |

### done

當前協程已經完成，引用計數減 1。

```php
public function done(): void
```

### wait

主協程開始等待子協程完成。

```php
public function wait(float $timeout = -1): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$timeout` | 超時時間 | `-1`，永不超時 |

**返回值**：操作成功返回 `true`，操作失敗返回 `false`。

### count

查看需要等待協程完成的數量。

```php
public function count(): int
```

**返回值**：當前需要等待協程完成的數量。

## 示例

```php
<?php
use Swoole\Coroutine;
use Swoole\Coroutine\WaitGroup;
use Swoole\Coroutine\Http\Client;
use function Swoole\Coroutine\run;

run(function () {
    $wg = new WaitGroup();
    $result = [];

    $wg->add();
    // 啓動第一個協程
    Coroutine::create(function () use ($wg, &$result) {
        // 啓動一個協程客戶端 client，請求淘寶首頁
        $cli = new Client('www.taobao.com', 443, true);
        $cli->setHeaders([
            'Host' => 'www.taobao.com',
            'User-Agent' => 'Chrome/49.0.2587.3',
            'Accept' => 'text/html,application/xhtml+xml,application/xml',
            'Accept-Encoding' => 'gzip',
        ]);
        $cli->set(['timeout' => 1]);
        $cli->get('/index.php');

        $result['taobao'] = $cli->body;
        $cli->close();

        $wg->done();
    });

    $wg->add();
    // 啓動第二個協程
    Coroutine::create(function () use ($wg, &$result) {
        // 啓動一個協程客戶端 client，請求百度首頁
        $cli = new Client('www.baidu.com', 443, true);
        $cli->setHeaders([
            'Host' => 'www.baidu.com',
            'User-Agent' => 'Chrome/49.0.2587.3',
            'Accept' => 'text/html,application/xhtml+xml,application/xml',
            'Accept-Encoding' => 'gzip',
        ]);
        $cli->set(['timeout' => 1]);
        $cli->get('/index.php');

        $result['baidu'] = $cli->body;
        $cli->close();

        $wg->done();
    });

    // 掛起當前協程，等待所有任務完成後恢復
    $wg->wait();
    // 這裏 $result 包含了 2 個任務執行結果
    var_dump($result);
});
```
