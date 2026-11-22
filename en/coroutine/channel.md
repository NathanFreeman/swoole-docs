# Channel

`Swoole\Coroutine\Channel` is a high-performance data structure for inter-coroutine communication. You can think of it directly as a message queue dedicated to coroutines.

- A channel is similar to a `PHP` `Array`: it only occupies memory, requires no additional resource allocation, and all operations are memory operations with no `IO` cost.
- The underlying implementation uses `PHP` reference counting, with no memory copying. Even passing huge strings or arrays incurs no extra performance cost.
- Channels use local memory, and memory is isolated between different processes. [`push`](#push) and [`pop`](#pop) operations can only be performed between coroutines within the same process.

## Properties

### capacity

The current channel capacity.

```php
public int $capacity
```

### errCode

The error code of the most recent operation.

```php
public int $errCode
```

| Error code | Meaning |
|:---|:---|
| `SWOOLE_CHANNEL_OK` | Operation succeeded |
| `SWOOLE_CHANNEL_TIMEOUT` | Operation timed out |
| `SWOOLE_CHANNEL_CLOSED` | The channel is closed |
| `SWOOLE_CHANNEL_CANCELED` | The current operation was canceled by [cancel](/en/coroutine/coroutine_api.html#cancel) |

## Methods

### __construct

Creates a channel.

```php
public function __construct(int $capacity = 1)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$capacity` | Channel capacity; must be an integer greater than or equal to `1` | `1` |

> [!TIP]
> When the amount of data in the channel equals `$capacity`, the channel is full. The next coroutine that writes data triggers a coroutine switch, and writing can only continue once data in the channel has been consumed.

### push

Writes data into the channel.

```php
public function push(mixed $data, float $timeout = -1): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$data` | The data to write; can be any type of PHP variable, including closures and resources | Required |
| `$timeout` | Timeout in seconds; supports floats (`1.5` means `1s` + `500ms`) | `-1`, never times out |

**Return value**: Returns `true` on success; returns `false` on failure when the channel is closed, and you can use [`$channel->errCode`](#errcode) to get the error code.

> [!NOTE]
> To avoid ambiguity, do not write `null` or `false` into the channel.

> [!TIP]
> When the channel is full, `push` suspends the current coroutine. If no consumer consumes data within the agreed time, a timeout occurs: the underlying layer resumes the current coroutine, the `push` call immediately returns `false`, and the write fails.

### pop

Reads data from the channel.

```php
public function pop(float $timeout = -1): mixed
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Timeout in seconds; supports floats (`1.5` means `1s` + `500ms`) | `-1`, never times out |

**Return value**: Can be any type of PHP variable, including closures and resources; returns `false` on failure when the channel is closed.

> [!TIP]
> When the channel is empty, `pop` suspends the current coroutine. If no producer produces data within the agreed time, a timeout occurs: the underlying layer resumes the current coroutine, the `pop` call immediately returns `false`, and the read fails.

### stats

Gets the channel's status.

```php
public function stats(): array
```

**Return value**: Returns an array; a buffered channel contains the following information.

| key | Meaning |
|:---|:---|
| `consumer_num` | Number of coroutines waiting to consume (`pop`) |
| `producer_num` | Number of coroutines waiting to produce (`push`) |
| `queue_num` | Amount of data in the channel |

### close

Closes the channel and wakes up all coroutines waiting to read from or write to it.

```php
public function close(): bool
```

**Return value**: Returns `true` on success and `false` on failure.

> [!TIP]
> After closing, all producer coroutines are woken up and the `push` method returns `false`; all consumer coroutines are also woken up and the `pop` method returns `false`.

### length

Gets the amount of data pending consumption in the channel.

```php
public function length(): int
```

**Return value**: The amount of data pending consumption in the channel.

### isEmpty

Checks whether the channel is currently empty.

```php
public function isEmpty(): bool
```

**Return value**: Returns `true` if the channel is empty, otherwise `false`.

### isFull

Checks whether the channel is currently full.

```php
public function isFull(): bool
```

**Return value**: Returns `true` if the channel is full, otherwise `false`.

## Examples

```php
<?php
use Swoole\Coroutine;
use Swoole\Coroutine\Channel;
use function Swoole\Coroutine\run;

run(function () {
    $channel = new Channel(1);
    Coroutine::create(function () use ($channel) {
        for ($i = 0; $i < 10; $i++) {
            Coroutine::sleep(1.0);
            $channel->push(['rand' => rand(1000, 9999), 'index' => $i]);
            echo "{$i}\n";
        }
    });
    Coroutine::create(function () use ($channel) {
        while (1) {
            $data = $channel->pop(2.0);
            if ($data) {
                var_dump($data);
            } else {
                assert($channel->errCode === SWOOLE_CHANNEL_TIMEOUT);
                break;
            }
        }
    });
});
```

## Notes

When using `Channel` in an async server, the `Channel` object must be created before the [start](/en/server/methods.html#start) method is executed, and referenced via the `use` syntax.

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Coroutine\Channel;

$channel = new Channel(100);
$server = new Server('127.0.0.1', 9501);
$server->set([
    'worker_num' => 4,
    'enable_coroutine' => true
]);

$server->on('request', function (Request $request, Response $response) use ($channel) {

});

$server->start();
```