# 并发容器

`Swoole\Thread` 提供了 3 种安全的并发容器：[`Thread\ArrayList`](#arraylist)、[`Thread\Map`](#map)、[`Thread\Queue`](#queue)。可作为线程参数传递给子线程，读写时在其他线程是可见的。

> [!NOTE]
> 需要 `Swoole` 版本 >= `v6.0`，且已开启多线程支持，详见[创建线程](/zh/thread/create.html#使用条件)。

## 特性

- `Map`、`ArrayList`、`Queue` 会自动分配内存，不需要像 [Table](/zh/table.html) 那样固定分配。

- 底层会自动加锁，是线程安全的。

- 必须在线程创建前将 `Map`、`ArrayList`、`Queue` 对象作为线程参数传递给子线程。

- 可传递的变量类型参考[数据类型](/zh/thread/create.html#数据类型)。

- 均不支持迭代器：`ArrayList` 可使用 `toArray()` 来代替，`Map` 可使用 `keys()`、`values()`、`toArray()` 来代替，`Queue` 底层使用了 `C++ std::queue`，仅支持先进先出操作。

- `Thread\ArrayList` 和 `Thread\Map` 实现了 `ArrayAccess` 和 `Countable` 接口，可以直接作为数组操作。

## ArrayList

并发的 `ArrayList` 结构，仅支持数字索引下标操作，非数字将进行一次强制转换操作。

- 增加或修改：`$list[$index] = $value`
- 删除：`unset($list[$index])`
- 读取：`$value = $list[$index]`
- 获取长度：`count($list)`

**示例**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\ArrayList;

$args = Thread::getArguments();

if (empty($args)) {
    // 主线程：容器必须在创建线程前作为参数传入
    $list = new ArrayList();
    $thread = new Thread(__FILE__, $list);

    sleep(1);
    $list[] = uniqid();
    $thread->join();
} else {
    // 子线程
    $list = $args[0];
    sleep(2);
    // 主线程 1 秒后写入的元素，在子线程中可见
    var_dump($list[0]);
}
```

> [!WARNING]
> 删除操作会引起 `ArrayList` 批量前移操作，例如 `ArrayList` 有 `1000` 个元素，当 `unset($list[4])` 时，将需要 `$list[5:999]` 进行批量迁移操作，填补删除 `$list[4]` 产生的空位。但不会深度复制元素，仅移动其指针。
>
> 若 `ArrayList` 较大时，删除靠前的元素，可能会消耗较多的 `CPU` 资源。

### __construct

安全并发容器 `ArrayList` 构造函数。

```php
public function __construct(?array $values = null)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$values` | 遍历数组将数组中的值添加到 `ArrayList` 中。只接受 `list` 类型的数组，不接受关联数组，否则将抛出异常 | `null` |

> [!TIP]
> 关联数组需使用 `array_values()` 转换为 `list` 类型的数组。

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList(['a', 'b', 'c']);

// 关联数组须先转换为 list 类型
$assoc = new ArrayList(array_values(['k1' => 1, 'k2' => 2]));

var_dump($list->count(), $assoc->count());
```

### incr

使 `ArrayList` 中的数据安全地自增，支持浮点型或整型，若对其他类型进行自增操作，将会自动转为整型，初始化为 `0`，再进行自增操作。

```php
public function incr(int $index, mixed $value = 1): int|float
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$index` | 索引数字，必须是有效的索引地址，否则会抛出异常 | 必填 |
| `$value` | 需要自增的值 | `1` |

**返回值**：返回自增后的值。

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList([10, 'x']);

var_dump($list->incr(0, 5));
// 非数值元素自动转为整型 0，再自增 1
var_dump($list->incr(1));
```

### decr

使 `ArrayList` 中的数据安全地自减，支持浮点型或整型，若对其他类型进行自减操作，将会自动转为整型，初始化为 `0`，再进行自减操作。

```php
public function decr(int $index, mixed $value = 1): int|float
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$index` | 索引数字，必须是有效的索引地址，否则会抛出异常 | 必填 |
| `$value` | 需要自减的值 | `1` |

**返回值**：返回自减后的值。

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList([10, 'x']);

var_dump($list->decr(0, 5));
// 非数值元素自动转为整型 0，再自减 1
var_dump($list->decr(1));
```

### count

获取 `ArrayList` 元素数量。

```php
public function count(): int
```

**返回值**：返回 `ArrayList` 中的元素数量。

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList(['a', 'b']);

var_dump($list->count());
// 实现了 Countable 接口，也可以直接使用 count()
var_dump(count($list));
```

### toArray

将 `ArrayList` 转换为数组。

```php
public function toArray(): array
```

**返回值**：返回 `ArrayList` 中的所有元素。

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList(['a', 'b']);

// 不支持迭代器，遍历前先转换为数组
foreach ($list->toArray() as $index => $value) {
    echo "{$index}: {$value}\n";
}
```

### clean

清空所有元素。

```php
public function clean(): void
```

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList(['a', 'b']);
$list->clean();

var_dump($list->count());
```

### sort

对容器内的元素进行排序。与 `PHP` 的 `sort()` 函数的行为是一致的。

```php
public function sort(): void
```

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList([3, 1, 2]);
$list->sort();

var_dump($list->toArray());
```

### find

查找第一个与给定值相等的元素，返回其整数下标。

```php
public function find(mixed $value): int|null
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$value` | 要查找的值 | 必填 |

**返回值**：命中返回第一个匹配元素的整数下标，找不到返回 `null`。

> [!NOTE]
> Swoole 版本 >= `v6.0.0` 可用。比较是严格的：类型必须相同，整数、浮点数、字符串按值相等，`bool`/`null` 仅匹配同值，数组和对象一律不匹配。查找期间持有读锁，线程安全。

**示例**

```php
<?php
use Swoole\Thread\ArrayList;

$list = new ArrayList(['a', 'b', 'c']);
var_dump($list->find('b')); // int(1)
var_dump($list->find('z')); // NULL
```

## Map

并发的 `Map` 结构，实现了 `ArrayAccess` 和 `Countable` 接口。

- 增加或修改：`$map[$key] = $value`
- 删除：`unset($map[$key])`
- 读取：`$value = $map[$key]`
- 获取长度：`count($map)`

**示例**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Map;

$args = Thread::getArguments();

if (empty($args)) {
    // 主线程：容器必须在创建线程前作为参数传入
    $map = new Map();
    $thread = new Thread(__FILE__, $map);

    sleep(1);
    $map['test'] = uniqid();
    $thread->join();
} else {
    // 子线程
    $map = $args[0];
    sleep(2);
    // 主线程 1 秒后写入的元素，在子线程中可见
    var_dump($map['test']);
}
```

### __construct

安全并发容器 `Map` 构造函数。

```php
public function __construct(?array $values = null)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$values` | 遍历数组将键值对添加到 `Map` 中，保留原有的 `key`。多维数组会递归转为嵌套的 `Map` 或 `ArrayList`，详见[数组](/zh/thread/create.html#数组) | `null` |

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map(['a' => 1, 'b' => 2]);

var_dump($map->count());
```

### add

向 `Map` 中写入数据。

```php
public function add(mixed $key, mixed $value): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 需要添加的 `key` | 必填 |
| `$value` | 需要添加的值 | 必填 |

**返回值**：如果 `$key` 已存在，返回 `false`，否则返回 `true` 表示添加成功。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();

var_dump($map->add('test', 1));
// key 已存在，添加失败
var_dump($map->add('test', 2));
```

### update

更新 `Map` 中的数据。

```php
public function update(mixed $key, mixed $value): bool
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 需要修改的 `key` | 必填 |
| `$value` | 需要修改的值 | 必填 |

**返回值**：如果 `$key` 不存在，返回 `false`，否则返回 `true` 表示更新成功。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map->add('test', 1);

var_dump($map->update('test', 2));
// key 不存在，更新失败
var_dump($map->update('none', 3));
```

### incr

使 `Map` 中的数据安全地自增，支持浮点型或整型，若对其他类型进行自增操作，将会自动转为整型，初始化为 `0`，再进行自增操作。

```php
public function incr(mixed $key, mixed $value = 1): int|float
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 需要自增的 `key`，如果不存在则自动创建，并初始化为 `0` | 必填 |
| `$value` | 需要自增的值 | `1` |

**返回值**：返回自增后的值。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();

// key 不存在时自动创建并初始化为 0
var_dump($map->incr('count'));
var_dump($map->incr('count', 1.5));
```

### decr

使 `Map` 中的数据安全地自减，支持浮点型或整型，若对其他类型进行自减操作，将会自动转为整型，初始化为 `0`，再进行自减操作。

```php
public function decr(mixed $key, mixed $value = 1): int|float
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$key` | 需要自减的 `key`，如果不存在则自动创建，并初始化为 `0` | 必填 |
| `$value` | 需要自减的值 | `1` |

**返回值**：返回自减后的值。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();

// key 不存在时自动创建并初始化为 0
var_dump($map->decr('count'));
var_dump($map->decr('count', 1.5));
```

### count

获取元素数量。

```php
public function count(): int
```

**返回值**：返回 `Map` 中的元素数量。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;
$map['b'] = 2;

var_dump($map->count());
// 实现了 Countable 接口，也可以直接使用 count()
var_dump(count($map));
```

### keys

返回所有 `key`。

```php
public function keys(): array
```

**返回值**：返回 `Map` 所有的 `key`。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;
$map['b'] = 2;

var_dump($map->keys());
```

### values

返回所有 `value`。

```php
public function values(): array
```

**返回值**：返回 `Map` 所有的 `value`。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;
$map['b'] = 2;

var_dump($map->values());
```

### toArray

将 `Map` 转换为数组。

```php
public function toArray(): array
```

**返回值**：返回 `Map` 中的所有元素。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;

// 不支持迭代器，遍历前先转换为数组
foreach ($map->toArray() as $key => $value) {
    echo "{$key}: {$value}\n";
}
```

### clean

清空所有元素。

```php
public function clean(): void
```

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;
$map->clean();

var_dump($map->count());
```

### sort

对容器内的元素进行排序。底层会保存 `key` 与 `value` 的映射关系，仅对 `value` 进行排序。与 `PHP` 的 `asort()` 函数的行为是一致的。

```php
public function sort(): void
```

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['b'] = 2;
$map['a'] = 1;

// 按 value 升序排序，key 与 value 的映射关系保持不变
$map->sort();

var_dump($map->keys(), $map->values());
```

### find

查找第一个与给定值相等的元素，返回其键名。

```php
public function find(mixed $value): mixed
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$value` | 要查找的值 | 必填 |

**返回值**：命中返回第一个匹配元素的键（字符串键或整数索引），找不到返回 `null`。

> [!NOTE]
> Swoole 版本 >= `v6.0.0` 可用。比较规则与 [ArrayList::find](#find) 相同：类型必须相同，整数、浮点数、字符串按值相等，数组和对象一律不匹配。查找期间持有读锁，线程安全。

**示例**

```php
<?php
use Swoole\Thread\Map;

$map = new Map();
$map['a'] = 1;
$map['b'] = 2;
var_dump($map->find(2)); // string(1) "b"
var_dump($map->find(3)); // NULL
```

## Queue

并发的 `Queue` 结构，是一个先进先出的数据结构，只能压入、弹出元素，不能随机访问元素。

`Thread\Queue` 内置了线程条件变量，可在 `push`/`pop` 操作中唤醒、等待其他线程。

**常量**

| 常量 | 说明 |
|:---|:---|
| `Queue::NOTIFY_ONE` | 唤醒一个线程 |
| `Queue::NOTIFY_ALL` | 唤醒所有线程 |

**示例**

```php
<?php
use Swoole\Thread;
use Swoole\Thread\Queue;

$args = Thread::getArguments();
$c = 4;
$n = 128;

if (empty($args)) {
    // 主线程：4 个消费者线程，128 条任务
    $threads = [];
    $queue = new Queue();
    for ($i = 0; $i < $c; $i++) {
        $threads[] = new Thread(__FILE__, $i, $queue);
    }

    while ($n--) {
        $queue->push(base64_encode(random_bytes(16)), Queue::NOTIFY_ONE);
        usleep(random_int(10000, 100000));
    }

    // 为每个消费者线程压入一条空数据，作为退出信号
    $n = $c;
    while ($n--) {
        $queue->push('', Queue::NOTIFY_ONE);
    }

    for ($i = 0; $i < $c; $i++) {
        $threads[$i]->join();
    }
    var_dump($queue->count());
} else {
    // 子线程：阻塞读取，直到取到退出信号
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

安全并发容器 `Queue` 构造函数。

```php
public function __construct()
```

**示例**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();

$queue->push('job-1');
var_dump($queue->count());
```

### push

向队列尾部中写入数据。

```php
public function push(mixed $value, int $notify = 0): void
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$value` | 写入的数据内容 | 必填 |
| `$notify` | 是否通知等待读取数据的线程。`Queue::NOTIFY_ONE` 唤醒一个线程，`Queue::NOTIFY_ALL` 唤醒所有线程 | `0`，不会唤醒任何线程 |

> [!WARNING]
> 为避免产生歧义，请勿向队列中写入 `null` 和 `false`。

**示例**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();

// 默认不唤醒任何等待的线程
$queue->push('job-1');
// 写入后唤醒一个正在 pop() 上等待的线程
$queue->push('job-2', Queue::NOTIFY_ONE);
// 写入后唤醒所有正在 pop() 上等待的线程
$queue->push('job-3', Queue::NOTIFY_ALL);
```

### pop

从队列头部中提取数据。

```php
public function pop(float $timeout = 0): mixed
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$timeout` | 超时时间。不为 `0` 时，表示当队列为空时在 `$timeout` 秒内等待生产者 `push()` 数据，为负数时表示永不超时 | `0`，表示不等待 |

**返回值**：返回队列头部数据。`$timeout` 为 `0` 时，队列为空立即返回 `null`；大于 `0` 时，等待超时后返回 `null`。

> [!NOTE]
> 使用 `Queue::NOTIFY_ALL` 唤醒所有线程时，只有一个线程可以获得 `push()` 操作写入的数据。

**示例**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();
$queue->push('job-1');

// 先进先出，取出队头元素
var_dump($queue->pop());
// 队列为空且不等待，直接返回 null
var_dump($queue->pop());
// 队列为空时最多等待 1 秒；传入负数表示永不超时
var_dump($queue->pop(1));
```

### count

获取队列元素数量。

```php
public function count(): int
```

**返回值**：返回队列数量。

**示例**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();
$queue->push('job-1');
$queue->push('job-2');

var_dump($queue->count());
```

### clean

清空所有元素。

```php
public function clean(): void
```

**示例**

```php
<?php
use Swoole\Thread\Queue;

$queue = new Queue();
$queue->push('job-1');
$queue->clean();

var_dump($queue->count());
```
