# Process Management

The process manager `Swoole\Process\Manager` is implemented on top of [Swoole\Process\Pool](/en/process/pool.html) and is used to manage multiple worker processes.

## Methods

### __construct

Constructor.

```php
public function __construct(int $ipcType = SWOOLE_IPC_NONE, int $msgQueueKey = 0)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$ipcType` | Communication mode; same values as [`$ipc_type` of Swoole\Process\Pool](/en/process/pool.html#construct) | `SWOOLE_IPC_NONE` |
| `$msgQueueKey` | The `key` of the message queue; same as [`$msgqueue_key` of `Swoole\Process\Pool`](/en/process/pool.html#construct) | `0` |

**Example**

```php
<?php
use Swoole\Coroutine;
use Swoole\Process\Manager;
use Swoole\Process\Pool;

// No inter-process communication, no message queue
$pm = new Manager(SWOOLE_IPC_NONE, 0);

$pm->add(function (Pool $pool, int $workerId) {
    Coroutine::sleep(1);
    echo "worker #{$workerId} pid: " . getmypid() . "\n";
    // The worker process is relaunched after the callback returns; shut down the pool here explicitly
    $pool->shutdown();
}, true);

$pm->start();
```

### add

Add a worker process.

```php
public function add(callable $func, bool $enableCoroutine = false): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$func` | The callback function this process executes | Required |
| `$enableCoroutine` | Whether to create a coroutine to run the callback for this process | `false` |

**Example**

```php
<?php
use Swoole\Coroutine;
use Swoole\Process\Manager;
use Swoole\Process\Pool;

$pm = new Manager();

// Synchronous process; coroutine APIs cannot be used in the callback
$pm->add(function (Pool $pool, int $workerId) {
    echo "sync worker #{$workerId}\n";
    sleep(2);
});

// Coroutine process; the second parameter is true
$pm->add(function (Pool $pool, int $workerId) {
    Coroutine::sleep(1);
    echo "coroutine worker #{$workerId}\n";
    // Shut down the pool to prevent synchronous processes from being relaunched after exiting
    $pool->shutdown();
}, true);

$pm->start();
```

### addBatch

Add worker processes in batch.

```php
public function addBatch(int $workerNum, callable $func, bool $enableCoroutine = false): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$workerNum` | Number of processes to add | Required |
| `$func` | The callback function each process executes | Required |
| `$enableCoroutine` | Whether to create a coroutine to run the callback for each process | `false` |

**Example**

```php
<?php
use Swoole\Coroutine;
use Swoole\Process\Manager;
use Swoole\Process\Pool;

$pm = new Manager();

// Add 3 coroutine processes in batch, all running the same callback
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

Start the worker processes.

```php
public function start(): void
```

**Example**

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

// Must be called after add/addBatch
$pm->start();
```

### setIPCType

Set the inter-process communication method.

```php
public function setIPCType(int $ipcType): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$ipcType` | Communication mode; see [`$ipc_type` of Process\Pool](/en/process/pool.html#construct) for values | Required |

**Example**

```php
<?php
use Swoole\Process\Manager;

$pm = new Manager();

// Returns $pm itself after setting
$pm->setIPCType(SWOOLE_IPC_UNIXSOCK);

var_dump($pm->getIPCType());
```

### getIPCType

Get the inter-process communication method.

```php
public function getIPCType(): int
```

**Example**

```php
<?php
use Swoole\Process\Manager;

// Specify the communication method at construction
$pm = new Manager(SWOOLE_IPC_UNIXSOCK);

var_dump($pm->getIPCType());
```

### setMsgQueueKey

Set the `key` of the message queue.

```php
public function setMsgQueueKey(int $msgQueueKey): self
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$msgQueueKey` | The `key` of the message queue | Required |

**Example**

```php
<?php
use Swoole\Process\Manager;

$pm = new Manager();
$pm->setIPCType(SWOOLE_IPC_MSGQUEUE);

// Use the same key as the external producer
$pm->setMsgQueueKey(0x7000001);

var_dump($pm->getMsgQueueKey());
```

### getMsgQueueKey

Get the `key` of the message queue.

```php
public function getMsgQueueKey(): int
```

**Example**

```php
<?php
use Swoole\Process\Manager;

// Specify the message queue key at construction
$pm = new Manager(SWOOLE_IPC_MSGQUEUE, 0x7000001);

var_dump($pm->getMsgQueueKey());
```

## Examples

Create 2 synchronous processes and 1 coroutine process, each running an independent task.

```php
<?php
use Swoole\Coroutine;
use Swoole\Process\Manager;
use Swoole\Process\Pool;

$pm = new Manager();

for ($i = 0; $i < 2; $i++) {
    $pm->add(function (Pool $pool, int $workerId) {
        echo "sync worker #{$workerId} is started\n";
        // When the callback returns, the worker process exits and is relaunched; long-running tasks must loop themselves
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