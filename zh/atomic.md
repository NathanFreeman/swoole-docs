# 无锁计数器
* `Swoole` 底层提供了**原子计数**操作类，利用 `gcc/clang` 的 `CPU 原子指令`实现无锁的整数增减操作，并基于共享内存支持跨进程计数，无需加锁。该机制常用于`多进程 / 多线程`环境下的同步场景。
* 多进程模式下，只能使用 `Swoole\Atomic` 类（32 位无符号整型）。如果业务需要处理负值或更大范围的整数，可以使用 `64` 位有符号的 `Swoole\Atomic\Long` 类。
* [多线程模式下](/zh/thread/create.html)，只能使用 `Swoole\Thread\Atomic` 类（32 位无符号整型）。如果业务需要处理负值或更大范围的整数，可以使用 `64` 位有符号的 `Swoole\Thread\Atomic\Long` 类。
* `Swoole\Atomic`，`Swoole\Atomic\Long`，`Swoole\Thread\Atomic`和`Swoole\Thread\Atomic\Long`除了命名空间不同，接口完全一致。

## __construct
- 构造函数。创建一个原子计数对象。

```php
Swoole\Atomic::__construct(int $value = 0)
```

* **参数**
    * **`int $value`**
        * **功能**：指定原子计数初始化的数值
        * **默认值**：`0`
        * **其它值**：无


* **示例**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(1);
```

> [!IMPORTANT]
> 只能操作`32`位无符号整数，最大支持`42`亿，不支持负数。

## add
- 增加计数。

```php
Swoole\Atomic->add(int $value = 1): int
```

* **参数**
    * **`int $add_value`**
        * **功能**：要增加的数值【必须为正整数】
        * **默认值**：`1`
        * **其它值**：无

* **返回值**
    * 操作成功后返回结果数值。

* **示例**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(1);
$atomic->add(100);
```

> [!WARNING]
> 与原值相加如果超过`42`亿，将会溢出，高位数值会被丢弃。

## sub
- 减少计数。

```php
Swoole\Atomic->sub(int $value = 1): int
```

* **参数**
    * **`int $value`**
        * **功能**：要减少的数值【必须为正整数】
        * **默认值**：`1`
        * **其它值**：无

* **返回值**
    * 操作成功后返回结果数值

* **示例**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(100);
$atomic->sub(50);
```

> [!WARNING]
> 与原值相减如果小于`0`将会溢出，高位数值会被丢弃。


## get
- 获取当前计数的值。

```php
Swoole\Atomic->get(): int
```

* **返回值**
    * 返回当前的数值。

* **示例**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(100);
var_dump($atomic->get());
```

## set
- 将当前值设置为指定的数字。

```php
Swoole\Atomic->set(int $value): void
```

* **参数**
    * **`int $value`**
        * **功能**：指定要设置的目标数值
        * **默认值**：无
        * **其它值**：无

* **示例**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(100);
$atomic->set(1000);
var_dump($atomic->get());
```

## cmpset
- 如果当前值等于参数`$cmpValue`，则将当前数值设置为参数`$setValue`。

```php
Swoole\Atomic->cmpset(int $cmpValue, int $setValue): bool
```

* **参数**
    * **`int $cmpValue`**
        * **功能**：需要比较的数值，必须为小于`42`亿的整数。
        * **默认值**：无
        * **其它值**：无

    * **`int $setValue`**
        * **功能**：需要设置的数值，必须为小于`42`亿的整数。
        * **默认值**：无
        * **其它值**：无

* **返回值**
    * 如果当前值等于 `$cmpValue`，则将其设为 `$setValue` 并返回 `true`；否则返回 `false`。

* **示例**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(100);
$atomic->cmpset(100, 1000);
var_dump($atomic->get());
```

## wait
- 当原子计数的值为`0`时进程进入等待状态，该方法和[`Swoole\Atomic->wakeup()`](#wakeup)配套使用，常用于多进程同步。

```php
Swoole\Atomic->wait(float $timeout = 1.0): bool
```

* **参数**
    * **`float $timeout`**
        * **功能**：指定超时时间，设置为`-1`时表示永不超时，会持续等待直到有其他进程唤醒。单位为秒，支持传入浮点型，如`1.5`表示`1s`+`500ms`。
        * **默认值**：`1`
        * **其它值**：无

* **返回值**
    * 超时返回`false`，可使用`swoole_errno`函数获取错误码`EAGAIN`。
    * 成功返回`true`，表示有其他进程通过`Swoole\Atomic->wakeup()`成功唤醒了当前的进程。

> [!INFO]
> 调用 `Swoole\Atomic->wait()` 的进程会**先判断原子计数是否`1`，是的话尝试将原子计数设置为 `0`**。如果设置失败，进程将进入休眠状态，等待被其他进程唤醒。被唤醒后会**再次尝试设为 `0`**，直到成功为止。

> [!WARNING]
> `Swoole\Atomic\Long`和`Swoole\Thread\Atomic\Long`没有`wait`方法。

> [!DANGER]
> `Swoole\Atomic->wait()`会阻塞整个进程而不是协程，因此请勿在协程环境中使用`Swoole\Atomic->wait()`避免引起进程挂起。

## wakeup
- 唤醒处于休眠状态的其他进程，该方法和[`Swoole\Atomic->wait()`](#wait)配套使用，常用于多进程同步。

```php
Swoole\Atomic->wakeup(int $count = 1): bool
```

* **参数**
    * **`int $count`**
        * **功能**：唤醒的进程数量
        * **默认值**：`1`
        * **其它值**：无
* **返回值**
    * 成功返回`true`，失败返回`false`。

> [!INFO]
> 调用 `Swoole\Atomic->wakeup()` 的进程会**先判断原子计数是否 `0`，是的话尝试将原子计数设置为 `1`**，成功后随机唤醒`$count`个休眠中的进程。

> [!WARNING]
> `Swoole\Atomic\Long`和`Swoole\Thread\Atomic\Long`没有`wakeup`方法。

## 通知与原子锁
* `Swoole\Atomic->wait()`和`Swoole\Atomic->wakeup()`配合，可以仅用`4`字节内存实现一个进程/线程间等待、通知、锁的功能。
* 构造函数中传入的原子计数初始化的值必须是`1`，否则将无法正常工作。

```php
<?php
use Swoole\Atomic;
use Swoole\Process;

$atomic = new Atomic(1); // 必须是1，否则将无法正常工作

for ($i = 0; $i < 10; $i++) {
    $process = new Process(function ($process) use ($atomic, $i) {
        usleep(mt_rand(200000, 800000)); // 打乱进程执行顺序
        $atomic->wait(); // 10个进程同时将值设置为0，但是只有一个进程会执行成功
        echo "进程 $i 操作成功，退出前准备唤醒睡眠中的一个进程" . PHP_EOL;
        usleep(mt_rand(200000, 800000)); // 模拟原子操作
        $atomic->wakeup(); // 执行成功的进程将值设置为1，同时唤醒睡眠中的一个进程
    });
    $process->start();
}

for ($n = 10; $n--;) {
    Process::wait(true);
}
```

> [!NOTE]
> `Swoole\Atomic->wait()`和`Swoole\Atomic->wakeup()`底层基于`Linux Futex`特性实现，在不支持`Futex`的平台下，底层会使用循环`usleep(1000)`模拟实现。

## 注意
* 请不要在[事件回调](/zh/server/events.html)中实例化原子计数器，否则内存会持续增长，造成内存泄漏。

```php
<?php
use Swoole\Atomic;
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) {
    $atomic = new Atomic(0); // [!code error]
    $atomic->add(1);
    $response->end('Hello World');
});

$http->start();
```

* 在`多进程`或`多线程`环境中使用原子计数器时，务必在创建任何`子进程`或`子线程`之前完成计数器对象的实例化。

```php
<?php
use Swoole\Atomic;
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$atomic = new Atomic(0);

$http = new Server('127.0.0.1', 9501);
$http->on('request', function(Request $request, Response $response) use ($atomic) {
    $atomic->add(1);
    $response->end('Hello World');
});

$http->start();
```
