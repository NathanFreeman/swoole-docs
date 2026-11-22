# 等待组

我们可以使用 `Swoole\Coroutine\WaitGroup` 让主协程等待所有子协程任务全部执行完毕，再继续往后运行。

它解决的是一个很常见的痛点：当你同时在多个协程里发起了并发操作（比如多个网络请求），如何精准地知道它们全部都已经完成了？`WaitGroup` 就是为了解决这个问题而生的。

> [!NOTE]
> `WaitGroup` 是纯 PHP 代码实现的，底层正是基于[通道](/zh/coroutine/channel.html)来完成阻塞和唤醒。

## 方法

### __construct

创建一个等待组。

```php
public function __construct(int $delta = 0)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$delta` | 初始化协程数 | `0` |

### add

有新的协程需要等待，引用计数加 1。

```php
public function add(int $delta = 1): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$delta` | 需要等待完成的协程数 | `1` |

### done

当前协程已经完成，引用计数减 1。

```php
public function done(): void
```

### wait

主协程开始等待子协程完成。

```php
public function wait(float $timeout = -1): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 超时时间 | `-1`，永不超时 |

**返回值**：操作成功返回 `true`，操作失败返回 `false`。

### count

查看需要等待协程完成的数量。

```php
public function count(): int
```

**返回值**：当前需要等待协程完成的数量。

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
    // 启动第一个协程
    Coroutine::create(function () use ($wg, &$result) {
        // 启动一个协程客户端 client，请求淘宝首页
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
    // 启动第二个协程
    Coroutine::create(function () use ($wg, &$result) {
        // 启动一个协程客户端 client，请求百度首页
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

    // 挂起当前协程，等待所有任务完成后恢复
    $wg->wait();
    // 这里 $result 包含了 2 个任务执行结果
    var_dump($result);
});
```
