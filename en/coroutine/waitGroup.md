# WaitGroup

We can use `Swoole\Coroutine\WaitGroup` to make the main coroutine wait until all child coroutine tasks have finished before continuing.

It solves a very common pain point: when you launch concurrent operations in multiple coroutines at the same time (for example, multiple network requests), how do you know precisely when they have all completed? `WaitGroup` was created to solve exactly this problem.

> [!NOTE]
> `WaitGroup` is implemented in pure PHP code; under the hood it relies on [channels](/en/coroutine/channel.html) to perform blocking and wake-up.

## Methods

### __construct

Creates a wait group.

```php
public function __construct(int $delta = 0)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$delta` | Initial coroutine count | `0` |

### add

A new coroutine needs to be waited for; the reference count is incremented by 1.

```php
public function add(int $delta = 1): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$delta` | Number of coroutines to wait for | `1` |

### done

The current coroutine has finished; the reference count is decremented by 1.

```php
public function done(): void
```

### wait

The main coroutine starts waiting for child coroutines to complete.

```php
public function wait(float $timeout = -1): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Timeout | `-1`, never times out |

**Return value**: Returns `true` on success and `false` on failure.

### count

Gets the number of coroutines still to be waited for.

```php
public function count(): int
```

**Return value**: The number of coroutines currently being waited for.

## Examples

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
    // Start the first coroutine
    Coroutine::create(function () use ($wg, &$result) {
        // Start a coroutine HTTP client and request the Taobao homepage
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
    // Start the second coroutine
    Coroutine::create(function () use ($wg, &$result) {
        // Start a coroutine HTTP client and request the Baidu homepage
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

    // Suspend the current coroutine; it resumes after all tasks complete
    $wg->wait();
    // Here $result contains the results of the 2 tasks
    var_dump($result);
});
```