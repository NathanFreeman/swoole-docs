# 进程管理

进程管理器`Swoole\Process\Manager`，基于 [Swoole\Process\Pool](/zh/process/pool.html) 实现，用于管理多个工作进程。

## 方法

### __construct

构造方法。

```php
public function __construct(int $ipcType = SWOOLE_IPC_NONE, int $msgQueueKey = 0)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$ipcType` | 通信模式，取值同 [Swoole\Process\Pool 的 `$ipc_type`](/zh/process/pool.html#construct) | `SWOOLE_IPC_NONE` |
| `$msgQueueKey` | 消息队列的 `key`，同 [`Swoole\Process\Pool` 的 `$msgqueue_key`](/zh/process/pool.html#construct) | `0` |

**示例**

```php
<?php
use Swoole\Coroutine;
use Swoole\Process\Manager;
use Swoole\Process\Pool;

// 不启用进程间通信，不使用消息队列
$pm = new Manager(SWOOLE_IPC_NONE, 0);

$pm->add(function (Pool $pool, int $workerId) {
    Coroutine::sleep(1);
    echo "worker #{$workerId} pid: " . getmypid() . "\n";
    // 回调返回后工作进程会被重新拉起，此处主动终止进程池
    $pool->shutdown();
}, true);

$pm->start();
```

### add

新增一个工作进程。

```php
public function add(callable $func, bool $enableCoroutine = false): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$func` | 该进程执行的回调函数 | 必填 |
| `$enableCoroutine` | 是否为该进程创建协程执行回调 | `false` |

**示例**

```php
<?php
use Swoole\Coroutine;
use Swoole\Process\Manager;
use Swoole\Process\Pool;

$pm = new Manager();

// 同步进程，回调中不能使用协程 API
$pm->add(function (Pool $pool, int $workerId) {
    echo "sync worker #{$workerId}\n";
    sleep(2);
});

// 协程进程，第二个参数为 true
$pm->add(function (Pool $pool, int $workerId) {
    Coroutine::sleep(1);
    echo "coroutine worker #{$workerId}\n";
    // 终止进程池，避免同步进程退出后被重新拉起
    $pool->shutdown();
}, true);

$pm->start();
```

### addBatch

批量新增工作进程。

```php
public function addBatch(int $workerNum, callable $func, bool $enableCoroutine = false): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$workerNum` | 新增进程的数量 | 必填 |
| `$func` | 各进程执行的回调函数 | 必填 |
| `$enableCoroutine` | 是否为各进程创建协程执行回调 | `false` |

**示例**

```php
<?php
use Swoole\Coroutine;
use Swoole\Process\Manager;
use Swoole\Process\Pool;

$pm = new Manager();

// 批量新增 3 个协程进程，执行同一个回调
$pm->addBatch(3, function (Pool $pool, int $workerId) {
    Coroutine::sleep($workerId + 1);
    echo "worker #{$workerId} pid: " . getmypid() . "\n";
    if ($workerId == 2) {
        $pool->shutdown();
    }
}, true);

$pm->start();
```

### start

启动工作进程。

```php
public function start(): void
```

**示例**

```php
<?php
use Swoole\Coroutine;
use Swoole\Process\Manager;
use Swoole\Process\Pool;

$pm = new Manager();

$pm->addBatch(2, function (Pool $pool, int $workerId) {
    Coroutine::sleep($workerId + 1);
    echo "worker #{$workerId} done\n";
    if ($workerId == 1) {
        $pool->shutdown();
    }
}, true);

// 须在 add/addBatch 之后调用
$pm->start();
```

### setIPCType

设置进程间通信方式。

```php
public function setIPCType(int $ipcType): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$ipcType` | 通信模式，取值见 [Process\Pool 的 `$ipc_type`](/zh/process/pool.html#construct) | 必填 |

**示例**

```php
<?php
use Swoole\Process\Manager;

$pm = new Manager();

// 设置后返回 $pm 自身
$pm->setIPCType(SWOOLE_IPC_UNIXSOCK);

var_dump($pm->getIPCType());
```

### getIPCType

获取进程间通信方式。

```php
public function getIPCType(): int
```

**示例**

```php
<?php
use Swoole\Process\Manager;

// 构造时指定通信方式
$pm = new Manager(SWOOLE_IPC_UNIXSOCK);

var_dump($pm->getIPCType());
```

### setMsgQueueKey

设置消息队列的 `key`。

```php
public function setMsgQueueKey(int $msgQueueKey): self
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$msgQueueKey` | 消息队列的 `key` | 必填 |

**示例**

```php
<?php
use Swoole\Process\Manager;

$pm = new Manager();
$pm->setIPCType(SWOOLE_IPC_MSGQUEUE);

// 与外部投递方使用同一个 key
$pm->setMsgQueueKey(0x7000001);

var_dump($pm->getMsgQueueKey());
```

### getMsgQueueKey

获取消息队列的 `key`。

```php
public function getMsgQueueKey(): int
```

**示例**

```php
<?php
use Swoole\Process\Manager;

// 构造时指定消息队列的 key
$pm = new Manager(SWOOLE_IPC_MSGQUEUE, 0x7000001);

var_dump($pm->getMsgQueueKey());
```

## 示例

创建 2 个同步进程和 1 个协程进程，各自执行独立任务。

```php
<?php
use Swoole\Coroutine;
use Swoole\Process\Manager;
use Swoole\Process\Pool;

$pm = new Manager();

for ($i = 0; $i < 2; $i++) {
    $pm->add(function (Pool $pool, int $workerId) {
        echo "sync worker #{$workerId} is started\n";
        // 回调返回即工作进程退出并被重新拉起，常驻任务须自行循环
        while (true) {
            sleep(1);
        }
    });
}

$pm->add(function (Pool $pool, int $workerId) {
    while (true) {
        Coroutine::sleep(1);
    }
}, true);

$pm->start();
```
