# 進程管理

進程管理器`Swoole\Process\Manager`，基於 [Swoole\Process\Pool](/zh-hant/process/pool.html) 實現，用於管理多個工作進程。

## 方法

### __construct

構造方法。

```php
public function __construct(int $ipcType = SWOOLE_IPC_NONE, int $msgQueueKey = 0)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$ipcType` | 通信模式，取值同 [Swoole\Process\Pool 的 `$ipc_type`](/zh-hant/process/pool.html#construct) | `SWOOLE_IPC_NONE` |
| `$msgQueueKey` | 消息隊列的 `key`，同 [`Swoole\Process\Pool` 的 `$msgqueue_key`](/zh-hant/process/pool.html#construct) | `0` |

**示例**

```php
<?php
use Swoole\Coroutine;
use Swoole\Process\Manager;
use Swoole\Process\Pool;

// 不啓用進程間通信，不使用消息隊列
$pm = new Manager(SWOOLE_IPC_NONE, 0);

$pm->add(function (Pool $pool, int $workerId) {
    Coroutine::sleep(1);
    echo "worker #{$workerId} pid: " . getmypid() . "\n";
    // 回調返回後工作進程會被重新拉起，此處主動終止進程池
    $pool->shutdown();
}, true);

$pm->start();
```

### add

新增一個工作進程。

```php
public function add(callable $func, bool $enableCoroutine = false): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$func` | 該進程執行的回調函數 | 必填 |
| `$enableCoroutine` | 是否爲該進程創建協程執行回調 | `false` |

**示例**

```php
<?php
use Swoole\Coroutine;
use Swoole\Process\Manager;
use Swoole\Process\Pool;

$pm = new Manager();

// 同步進程，回調中不能使用協程 API
$pm->add(function (Pool $pool, int $workerId) {
    echo "sync worker #{$workerId}\n";
    sleep(2);
});

// 協程進程，第二個參數爲 true
$pm->add(function (Pool $pool, int $workerId) {
    Coroutine::sleep(1);
    echo "coroutine worker #{$workerId}\n";
    // 終止進程池，避免同步進程退出後被重新拉起
    $pool->shutdown();
}, true);

$pm->start();
```

### addBatch

批量新增工作進程。

```php
public function addBatch(int $workerNum, callable $func, bool $enableCoroutine = false): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$workerNum` | 新增進程的數量 | 必填 |
| `$func` | 各進程執行的回調函數 | 必填 |
| `$enableCoroutine` | 是否爲各進程創建協程執行回調 | `false` |

**示例**

```php
<?php
use Swoole\Coroutine;
use Swoole\Process\Manager;
use Swoole\Process\Pool;

$pm = new Manager();

// 批量新增 3 個協程進程，執行同一個回調
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

啓動工作進程。

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

// 須在 add/addBatch 之後調用
$pm->start();
```

### setIPCType

設置進程間通信方式。

```php
public function setIPCType(int $ipcType): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$ipcType` | 通信模式，取值見 [Process\Pool 的 `$ipc_type`](/zh-hant/process/pool.html#construct) | 必填 |

**示例**

```php
<?php
use Swoole\Process\Manager;

$pm = new Manager();

// 設置後返回 $pm 自身
$pm->setIPCType(SWOOLE_IPC_UNIXSOCK);

var_dump($pm->getIPCType());
```

### getIPCType

獲取進程間通信方式。

```php
public function getIPCType(): int
```

**示例**

```php
<?php
use Swoole\Process\Manager;

// 構造時指定通信方式
$pm = new Manager(SWOOLE_IPC_UNIXSOCK);

var_dump($pm->getIPCType());
```

### setMsgQueueKey

設置消息隊列的 `key`。

```php
public function setMsgQueueKey(int $msgQueueKey): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$msgQueueKey` | 消息隊列的 `key` | 必填 |

**示例**

```php
<?php
use Swoole\Process\Manager;

$pm = new Manager();
$pm->setIPCType(SWOOLE_IPC_MSGQUEUE);

// 與外部投遞方使用同一個 key
$pm->setMsgQueueKey(0x7000001);

var_dump($pm->getMsgQueueKey());
```

### getMsgQueueKey

獲取消息隊列的 `key`。

```php
public function getMsgQueueKey(): int
```

**示例**

```php
<?php
use Swoole\Process\Manager;

// 構造時指定消息隊列的 key
$pm = new Manager(SWOOLE_IPC_MSGQUEUE, 0x7000001);

var_dump($pm->getMsgQueueKey());
```

## 示例

創建 2 個同步進程和 1 個協程進程，各自執行獨立任務。

```php
<?php
use Swoole\Coroutine;
use Swoole\Process\Manager;
use Swoole\Process\Pool;

$pm = new Manager();

for ($i = 0; $i < 2; $i++) {
    $pm->add(function (Pool $pool, int $workerId) {
        echo "sync worker #{$workerId} is started\n";
        // 回調返回即工作進程退出並被重新拉起，常駐任務須自行循環
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
