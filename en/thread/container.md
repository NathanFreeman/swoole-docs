# Concurrent Containers

`Swoole\Thread` provides 3 safe concurrent containers: [`Thread\ArrayList`](#arraylist), [`Thread\Map`](#map), and [`Thread\Queue`](#queue). They can be passed to child threads as thread arguments, and reads and writes are visible in other threads.

> [!NOTE]
> Requires `Swoole` version >= `v6.0` with multi-thread support enabled. See [Creating Threads](/en/thread/create.html#requirements) for details.

## Features

- `Map`, `ArrayList`, and `Queue` allocate memory automatically; no fixed allocation like [Table](/en/table.html) is needed.

- Locking is applied automatically at the underlying layer, so they are thread-safe.

- The `Map`, `ArrayList`, and `Queue` objects must be passed to the child thread as thread arguments before the thread is created.

- For the variable types that can be passed, see [Data Types](/en/thread/create.html#data-types).

- None of them support iterators: for `ArrayList`, use `toArray()` instead; for `Map`, use `keys()`, `values()`, and `toArray()` instead; `Queue` is built on `C++ std::queue` and only supports first-in-first-out operations.

- `Thread\ArrayList` and `Thread\Map` implement the `ArrayAccess` and `Countable` interfaces, so they can be operated on directly as arrays.

## ArrayList

A concurrent `ArrayList` structure. Only numeric index access is supported; a non-numeric index is coerced with a single cast.

- Add or modify: `$list[$index] = $value`
- Delete: `unset($list[$index])`
- Read: `$value = $list[$index]`
- Get the length: `count($list)`

**Example**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\ArrayList;

$args = Thread::getArguments();

if (empty($args)) {
    // Main thread: the container must be passed as an argument before the thread is created
    $list = new ArrayList();
    $thread = new Thread(__FILE__, $list);

    sleep(1);
    $list[] = uniqid();
    $thread->join();
} else {
    // Child thread
    $list = $args[0];
    sleep(2);
    // The element written by the main thread after 1 second is visible in the child thread
    var_dump($list[0]);
}
```

> [!WARNING]
> A delete operation causes `ArrayList` to shift elements forward in bulk. For example, if an `ArrayList` has `1000` elements, `unset($list[4])` requires `$list[5:999]` to be migrated in bulk to fill the gap left by removing `$list[4]`. Elements are not deep-copied; only their pointers are moved.
>
> When the `ArrayList` is large, deleting an element near the front may consume significant `CPU` resources.

### __construct

Constructor of the safe concurrent container `ArrayList`.

```php
public function __construct(?array $values = null)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$values` | Iterates over the array and adds its values to the `ArrayList`. Only accepts `list`-type arrays, not associative arrays; otherwise an exception is thrown | `null` |

> [!TIP]
> Associative arrays must be converted to `list`-type arrays with `array_values()`.

**Example**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList(['a', 'b', 'c']);

// Associative arrays must first be converted to list type
$assoc = new ArrayList(array_values(['k1' => 1, 'k2' => 2]));

var_dump($list->count(), $assoc->count());
```

### incr

Safely increments data in the `ArrayList`. Float and integer types are supported. If the increment is applied to any other type, it is automatically converted to an integer, initialized to `0`, and then incremented.

```php
public function incr(int $index, mixed $value = 1): int|float
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$index` | Numeric index; must be a valid index address, otherwise an exception is thrown | Required |
| `$value` | The value to increment by | `1` |

**Return value**: Returns the value after the increment.

**Example**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList([10, 'x']);

var_dump($list->incr(0, 5));
// A non-numeric element is automatically converted to integer 0, then incremented by 1
var_dump($list->incr(1));
```

### decr

Safely decrements data in the `ArrayList`. Float and integer types are supported. If the decrement is applied to any other type, it is automatically converted to an integer, initialized to `0`, and then decremented.

```php
public function decr(int $index, mixed $value = 1): int|float
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$index` | Numeric index; must be a valid index address, otherwise an exception is thrown | Required |
| `$value` | The value to decrement by | `1` |

**Return value**: Returns the value after the decrement.

**Example**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList([10, 'x']);

var_dump($list->decr(0, 5));
// A non-numeric element is automatically converted to integer 0, then decremented by 1
var_dump($list->decr(1));
```

### count

Gets the number of elements in the `ArrayList`.

```php
public function count(): int
```

**Return value**: Returns the number of elements in the `ArrayList`.

**Example**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList(['a', 'b']);

var_dump($list->count());
// Implements the Countable interface, so count() can also be used directly
var_dump(count($list));
```

### toArray

Converts the `ArrayList` to an array.

```php
public function toArray(): array
```

**Return value**: Returns all elements in the `ArrayList`.

**Example**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList(['a', 'b']);

// Iterators are not supported; convert to an array before iterating
foreach ($list->toArray() as $index => $value) {
    echo "{$index}: {$value}\n";
}
```

### clean

Removes all elements.

```php
public function clean(): void
```

**Example**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList(['a', 'b']);
$list->clean();

var_dump($list->count());
```

### sort

Sorts the elements in the container. The behavior is identical to `PHP`'s `sort()` function.

```php
public function sort(): void
```

**Example**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList([3, 1, 2]);
$list->sort();

var_dump($list->toArray());
```

## Map

A concurrent `Map` structure that implements the `ArrayAccess` and `Countable` interfaces.

- Add or modify: `$map[$key] = $value`
- Delete: `unset($map[$key])`
- Read: `$value = $map[$key]`
- Get the length: `count($map)`

**Example**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Map;

$args = Thread::getArguments();

if (empty($args)) {
    // Main thread: the container must be passed as an argument before the thread is created
    $map = new Map();
    $thread = new Thread(__FILE__, $map);

    sleep(1);
    $map['test'] = uniqid();
    $thread->join();
} else {
    // Child thread
    $map = $args[0];
    sleep(2);
    // The element written by the main thread after 1 second is visible in the child thread
    var_dump($map['test']);
}
```

### __construct

Constructor of the safe concurrent container `Map`.

```php
public function __construct(?array $values = null)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$values` | Iterates over the array and adds the key-value pairs to the `Map`, preserving the original `key`. Multi-dimensional arrays are recursively converted to nested `Map` or `ArrayList` objects; see [Arrays](/en/thread/create.html#arrays) for details | `null` |

**Example**

```php
<?php
use Swoole\Thread\Map;

$map = new Map(['a' => 1, 'b' => 2]);

var_dump($map->count());
```

### add

Writes data into the `Map`.

```php
public function add(mixed $key, mixed $value): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` to add | Required |
| `$value` | The value to add | Required |

**Return value**: If `$key` already exists, returns `false`; otherwise returns `true`, indicating the addition succeeded.

**Example**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();

var_dump($map->add('test', 1));
// The key already exists, so the addition fails
var_dump($map->add('test', 2));
```

### update

Updates data in the `Map`.

```php
public function update(mixed $key, mixed $value): bool
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` to modify | Required |
| `$value` | The value to set | Required |

**Return value**: If `$key` does not exist, returns `false`; otherwise returns `true`, indicating the update succeeded.

**Example**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map->add('test', 1);

var_dump($map->update('test', 2));
// The key does not exist, so the update fails
var_dump($map->update('none', 3));
```

### incr

Safely increments data in the `Map`. Float and integer types are supported. If the increment is applied to any other type, it is automatically converted to an integer, initialized to `0`, and then incremented.

```php
public function incr(mixed $key, mixed $value = 1): int|float
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` to increment; if it does not exist, it is created automatically and initialized to `0` | Required |
| `$value` | The value to increment by | `1` |

**Return value**: Returns the value after the increment.

**Example**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();

// If the key does not exist, it is created automatically and initialized to 0
var_dump($map->incr('count'));
var_dump($map->incr('count', 1.5));
```

### decr

Safely decrements data in the `Map`. Float and integer types are supported. If the decrement is applied to any other type, it is automatically converted to an integer, initialized to `0`, and then decremented.

```php
public function decr(mixed $key, mixed $value = 1): int|float
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$key` | The `key` to decrement; if it does not exist, it is created automatically and initialized to `0` | Required |
| `$value` | The value to decrement by | `1` |

**Return value**: Returns the value after the decrement.

**Example**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();

// If the key does not exist, it is created automatically and initialized to 0
var_dump($map->decr('count'));
var_dump($map->decr('count', 1.5));
```

### count

Gets the number of elements.

```php
public function count(): int
```

**Return value**: Returns the number of elements in the `Map`.

**Example**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;
$map['b'] = 2;

var_dump($map->count());
// Implements the Countable interface, so count() can also be used directly
var_dump(count($map));
```

### keys

Returns all `key`s.

```php
public function keys(): array
```

**Return value**: Returns all `key`s of the `Map`.

**Example**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;
$map['b'] = 2;

var_dump($map->keys());
```

### values

Returns all `value`s.

```php
public function values(): array
```

**Return value**: Returns all `value`s of the `Map`.

**Example**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;
$map['b'] = 2;

var_dump($map->values());
```

### toArray

Converts the `Map` to an array.

```php
public function toArray(): array
```

**Return value**: Returns all elements in the `Map`.

**Example**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;

// Iterators are not supported; convert to an array before iterating
foreach ($map->toArray() as $key => $value) {
    echo "{$key}: {$value}\n";
}
```

### clean

Removes all elements.

```php
public function clean(): void
```

**Example**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;
$map->clean();

var_dump($map->count());
```

### sort

Sorts the elements in the container. The underlying layer preserves the mapping between `key` and `value` and sorts only by `value`. The behavior is identical to `PHP`'s `asort()` function.

```php
public function sort(): void
```

**Example**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['b'] = 2;
$map['a'] = 1;

// Sorts by value in ascending order; the key-value mapping is preserved
$map->sort();

var_dump($map->keys(), $map->values());
```

## Queue

A concurrent `Queue` structure. It is a first-in-first-out data structure that only supports pushing and popping elements; random access to elements is not possible.

`Thread\Queue` has a built-in thread condition variable that can wake up or wait for other threads during `push`/`pop` operations.

**Constants**

| Constant | Description |
|:---|:---|
| `Queue::NOTIFY_ONE` | Wakes up one thread |
| `Queue::NOTIFY_ALL` | Wakes up all threads |

**Example**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Queue;

$args = Thread::getArguments();
$c = 4;
$n = 128;

if (empty($args)) {
    // Main thread: 4 consumer threads, 128 tasks
    $threads = [];
    $queue = new Queue();
    for ($i = 0; $i < $c; $i++) {
        $threads[] = new Thread(__FILE__, $i, $queue);
    }

    while ($n--) {
        $queue->push(base64_encode(random_bytes(16)), Queue::NOTIFY_ONE);
        usleep(random_int(10000, 100000));
    }

    // Push one empty item for each consumer thread as an exit signal
    $n = $c;
    while ($n--) {
        $queue->push('', Queue::NOTIFY_ONE);
    }

    for ($i = 0; $i < $c; $i++) {
        $threads[$i]->join();
    }
    var_dump($queue->count());
} else {
    // Child thread: blocking read until the exit signal is received
    $queue = $args[1];
    while (1) {
        $job = $queue->pop(-1);
        if (!$job) {
            break;
        }
        var_dump($job);
    }
}
```

### __construct

Constructor of the safe concurrent container `Queue`.

```php
public function __construct()
```

**Example**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();

$queue->push('job-1');
var_dump($queue->count());
```

### push

Writes data to the tail of the queue.

```php
public function push(mixed $value, int $notify = 0): void
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$value` | The data to write | Required |
| `$notify` | Whether to notify threads waiting to read data. `Queue::NOTIFY_ONE` wakes up one thread; `Queue::NOTIFY_ALL` wakes up all threads | `0`, no thread is woken up |

> [!WARNING]
> To avoid ambiguity, do not write `null` or `false` into the queue.

**Example**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();

// By default, no waiting thread is woken up
$queue->push('job-1');
// After writing, wake up one thread waiting on pop()
$queue->push('job-2', Queue::NOTIFY_ONE);
// After writing, wake up all threads waiting on pop()
$queue->push('job-3', Queue::NOTIFY_ALL);
```

### pop

Retrieves data from the head of the queue.

```php
public function pop(float $timeout = 0): mixed
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$timeout` | Timeout. When not `0`, if the queue is empty, waits up to `$timeout` seconds for a producer to `push()` data; a negative value means never time out | `0`, meaning no waiting |

**Return value**: Returns the data at the head of the queue. When `$timeout` is `0`, returns `null` immediately if the queue is empty; when greater than `0`, returns `null` after the wait times out.

> [!NOTE]
> When `Queue::NOTIFY_ALL` is used to wake up all threads, only one thread can obtain the data written by the `push()` operation.

**Example**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();
$queue->push('job-1');

// First-in-first-out: take the element at the head of the queue
var_dump($queue->pop());
// The queue is empty and no waiting is requested, so null is returned immediately
var_dump($queue->pop());
// Wait up to 1 second when the queue is empty; a negative value means never time out
var_dump($queue->pop(1));
```

### count

Gets the number of elements in the queue.

```php
public function count(): int
```

**Return value**: Returns the number of items in the queue.

**Example**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();
$queue->push('job-1');
$queue->push('job-2');

var_dump($queue->count());
```

### clean

Removes all elements.

```php
public function clean(): void
```

**Example**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();
$queue->push('job-1');
$queue->clean();

var_dump($queue->count());
```