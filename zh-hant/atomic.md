# 無鎖計數器
* `Swoole` 底層提供了**原子計數**操作類，利用 `gcc/clang` 的 `CPU 原子指令`實現無鎖的整數增減操作，並基於共享內存支持跨進程計數，無需加鎖。該機制常用於`多進程 / 多線程`環境下的同步場景。
* 多進程模式下，只能使用 `Swoole\Atomic` 類（32 位無符號整型）。如果業務需要處理負值或更大範圍的整數，可以使用 `64` 位有符號的 `Swoole\Atomic\Long` 類。
* [多線程模式下](/zh-hant/thread/create.html)，只能使用 `Swoole\Thread\Atomic` 類（32 位無符號整型）。如果業務需要處理負值或更大範圍的整數，可以使用 `64` 位有符號的 `Swoole\Thread\Atomic\Long` 類。
* `Swoole\Atomic`，`Swoole\Atomic\Long`，`Swoole\Thread\Atomic`和`Swoole\Thread\Atomic\Long`除了命名空間不同，接口完全一致。

## __construct
- 構造函數。創建一個原子計數對象。

```php
Swoole\Atomic::__construct(int $value = 0)
```

* **參數**
    * **`int $value`**
        * **功能**：指定原子計數初始化的數值
        * **默認值**：`0`
        * **其它值**：無


* **示例**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(1);
```

> [!IMPORTANT]
> 只能操作`32`位無符號整數，最大支持`42`億，不支持負數。

## add
- 增加計數。

```php
Swoole\Atomic->add(int $value = 1): int
```

* **參數**
    * **`int $add_value`**
        * **功能**：要增加的數值【必須爲正整數】
        * **默認值**：`1`
        * **其它值**：無

* **返回值**
    * 操作成功後返回結果數值。

* **示例**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(1);
$atomic->add(100);
```

> [!WARNING]
> 與原值相加如果超過`42`億，將會溢出，高位數值會被丟棄。

## sub
- 減少計數。

```php
Swoole\Atomic->sub(int $value = 1): int
```

* **參數**
    * **`int $value`**
        * **功能**：要減少的數值【必須爲正整數】
        * **默認值**：`1`
        * **其它值**：無

* **返回值**
    * 操作成功後返回結果數值

* **示例**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(100);
$atomic->sub(50);
```

> [!WARNING]
> 與原值相減如果小於`0`將會溢出，高位數值會被丟棄。


## get
- 獲取當前計數的值。

```php
Swoole\Atomic->get(): int
```

* **返回值**
    * 返回當前的數值。

* **示例**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(100);
var_dump($atomic->get());
```

## set
- 將當前值設置爲指定的數字。

```php
Swoole\Atomic->set(int $value): void
```

* **參數**
    * **`int $value`**
        * **功能**：指定要設置的目標數值
        * **默認值**：無
        * **其它值**：無

* **示例**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(100);
$atomic->set(1000);
var_dump($atomic->get());
```

## cmpset
- 如果當前值等於參數`$cmpValue`，則將當前數值設置爲參數`$setValue`。

```php
Swoole\Atomic->cmpset(int $cmpValue, int $setValue): bool
```

* **參數**
    * **`int $cmpValue`**
        * **功能**：需要比較的數值，必須爲小於`42`億的整數。
        * **默認值**：無
        * **其它值**：無

    * **`int $setValue`**
        * **功能**：需要設置的數值，必須爲小於`42`億的整數。
        * **默認值**：無
        * **其它值**：無

* **返回值**
    * 如果當前值等於 `$cmpValue`，則將其設爲 `$setValue` 並返回 `true`；否則返回 `false`。

* **示例**

```php
<?php
use Swoole\Atomic;
$atomic = new Atomic(100);
$atomic->cmpset(100, 1000);
var_dump($atomic->get());
```

## wait
- 當原子計數的值爲`0`時進程進入等待狀態，該方法和[`Swoole\Atomic->wakeup()`](#wakeup)配套使用，常用於多進程同步。

```php
Swoole\Atomic->wait(float $timeout = 1.0): bool
```

* **參數**
    * **`float $timeout`**
        * **功能**：指定超時時間，設置爲`-1`時表示永不超時，會持續等待直到有其他進程喚醒。單位爲秒，支持傳入浮點型，如`1.5`表示`1s`+`500ms`。
        * **默認值**：`1`
        * **其它值**：無

* **返回值**
    * 超時返回`false`，可使用`swoole_errno`函數獲取錯誤碼`EAGAIN`。
    * 成功返回`true`，表示有其他進程通過`Swoole\Atomic->wakeup()`成功喚醒了當前的進程。

> [!INFO]
> 調用 `Swoole\Atomic->wait()` 的進程會**先判斷原子計數是否`1`，是的話嘗試將原子計數設置爲 `0`**。如果設置失敗，進程將進入休眠狀態，等待被其他進程喚醒。被喚醒後會**再次嘗試設爲 `0`**，直到成功爲止。

> [!WARNING]
> `Swoole\Atomic\Long`和`Swoole\Thread\Atomic\Long`沒有`wait`方法。

> [!DANGER]
> `Swoole\Atomic->wait()`會阻塞整個進程而不是協程，因此請勿在協程環境中使用`Swoole\Atomic->wait()`避免引起進程掛起。

## wakeup
- 喚醒處於休眠狀態的其他進程，該方法和[`Swoole\Atomic->wait()`](#wait)配套使用，常用於多進程同步。

```php
Swoole\Atomic->wakeup(int $count = 1): bool
```

* **參數**
    * **`int $count`**
        * **功能**：喚醒的進程數量
        * **默認值**：`1`
        * **其它值**：無
* **返回值**
    * 成功返回`true`，失敗返回`false`。

> [!INFO]
> 調用 `Swoole\Atomic->wakeup()` 的進程會**先判斷原子計數是否 `0`，是的話嘗試將原子計數設置爲 `1`**，成功後隨機喚醒`$count`個休眠中的進程。

> [!WARNING]
> `Swoole\Atomic\Long`和`Swoole\Thread\Atomic\Long`沒有`wakeup`方法。

## 通知與原子鎖
* `Swoole\Atomic->wait()`和`Swoole\Atomic->wakeup()`配合，可以僅用`4`字節內存實現一個進程/線程間等待、通知、鎖的功能。
* 構造函數中傳入的原子計數初始化的值必須是`1`，否則將無法正常工作。

```php
<?php
use Swoole\Atomic;
use Swoole\Process;

$atomic = new Atomic(1); // 必須是1，否則將無法正常工作

for ($i = 0; $i < 10; $i++) {
    $process = new Process(function ($process) use ($atomic, $i) {
        usleep(mt_rand(200000, 800000)); // 打亂進程執行順序
        $atomic->wait(); // 10個進程同時將值設置爲0，但是隻有一個進程會執行成功
        echo "進程 $i 操作成功，退出前準備喚醒睡眠中的一個進程" . PHP_EOL;
        usleep(mt_rand(200000, 800000)); // 模擬原子操作
        $atomic->wakeup(); // 執行成功的進程將值設置爲1，同時喚醒睡眠中的一個進程
    });
    $process->start();
}

for ($n = 10; $n--;) {
    Process::wait(true);
}
```

> [!NOTE]
> `Swoole\Atomic->wait()`和`Swoole\Atomic->wakeup()`底層基於`Linux Futex`特性實現，在不支持`Futex`的平臺下，底層會使用循環`usleep(1000)`模擬實現。

## 注意
* 請不要在[事件回調](/zh-hant/server/events.html)中實例化原子計數器，否則內存會持續增長，造成內存泄漏。

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

* 在`多進程`或`多線程`環境中使用原子計數器時，務必在創建任何`子進程`或`子線程`之前完成計數器對象的實例化。

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
