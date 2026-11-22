# 異步文件處理

`Swoole` 的 [一鍵協程化](/zh-hant/coroutine/hook.html) 可以很方便的將 `PHP` 的文件操作由同步阻塞變爲異步執行，`Swoole` 一共內置了兩種不同的文件異步策略。

## 線程池

- `線程池` 是 `Swoole` 默認的異步文件處理，用戶發起文件操作時，`Swoole` 會將這個操作直接投遞到 `線程池` 中，由子線程負責完成文件操作，執行完畢後再將協程切換回來。
- `PHP` 的文件操作函數都可以通過 `線程池` 實現異步操作，例如 `file_get_contents`，`fopen` 等。
- 無需任何依賴庫，兼容性高，可直接上手使用。

## io_uring

- `io_uring` 是 `Swoole v6.0` 之後內置的策略，基於 `io_uring` 和 `epoll` 實現異步。
- 吞吐量高，可以處理大量異步文件操作。
- `io_uring` 對 linux 內核版本要求較高，建議在 linux 5.12+，liburing 2.8+ 以上的系統使用，有些操作系統沒法使用這個特性。
- 由於是基於 `文件描述符` 實現文件異步，只支持一些 `PHP` 的文件操作函數。

> [!IMPORTANT]
> 當系統安裝了 [`liburing`](/zh-hant/start/install.html#安裝-liburing) 和編譯 `Swoole` 開啓了 [`--enable-iouring`](/zh-hant/start/install.html#通用功能選項) 之後才能使用。

> [!IMPORTANT]
> 開啓了 `io_uring` 之後並不會替換掉 `線程池` 模式，有些 `io_uring` 沒法協程化的函數還是會讓 `線程池` 處理。

> [!IMPORTANT]
> `io_uring` 只支持 `file_get_contents`，`file_put_contents`，`fopen`，`fclose`，`fread`，`fwrite`，`mkdir`，`unlink`，`fsync`，`fdatasync`，`rename`，`fstat`，`lstat`，`filesize` 和 `ftruncate` 函數。

## 配置

`Swoole` 設置了幾個關鍵參數影響 `異步` 文件操作的特性，可以通過 `swoole_async_set` 或者 [`Swoole\Server->set()`](/zh-hant/server/methods.html#set) 來設置。

**示例**

```php
<?php
swoole_async_set([
    'aio_worker_num' => 20,
    'aio_max_wait_time' => 60,
    'aio_max_idle_time' => 60,
    'iouring_entries' => 1024,
    'iouring_workers' => 16,
    'iouring_flag' => SWOOLE_IOURING_SQPOLL
]);

$server = new Swoole\Server('127.0.0.1', 9501);
$server->set([
    'aio_worker_num' => 20,
    'aio_max_wait_time' => 60,
    'aio_max_idle_time' => 60,
    'iouring_entries' => 1024,
    'iouring_workers' => 16,
    'iouring_flag' => SWOOLE_IOURING_SQPOLL
]);
```

### aio_core_worker_num

設置線程池的最小線程數，默認值爲 `CPU核數`。

### aio_worker_num

設置線程池的最大線程數，默認值爲 `CPU核數 * 8`。

### aio_max_wait_time

設置線程池中的線程的最大等待時間，默認值爲 `0`。

### aio_max_idle_time

設置線程池中的線程的空閒時間，默認值爲 `1s`。

### iouring_entries

設置 `io_uring` 的隊列大小，默認爲 `8192`，如果傳入的值不是 `2的次方數`，內核會修改爲最接近的，大於該值的 `2的次方數`。

> [!TIP]
> 如果傳入的值過大，內核會拋出異常並且終止程序。

### iouring_workers

設置 `io_uring` 的工作線程數，默認值是 `CPU 核數 * 4`。

> [!TIP]
> 如果傳入的值過大，內核會拋出異常並且終止程序。

### iouring_flag

設置 `io_uring` 的工作模式，默認值爲 `SWOOLE_IOURING_DEFAULT`。

- `SWOOLE_IOURING_DEFAULT`，中斷驅動模式，可通過系統調用 `io_uring_enter` 提交 `I/O` 請求，然後直接檢查完成隊列狀態判斷是否完成。
- `SWOOLE_IOURING_SQPOLL`，內核輪詢模式，內核會創建內核線程用於提交和收割 `I/O` 請求，幾乎完全消除用戶態內核態上下文切換，性能較好。

> [!TIP]
> 如果傳入的模式不正確，內核會統一使用 `SWOOLE_IOURING_DEFAULT` 中斷驅動模式。
>
> `SWOOLE_IOURING_SQPOLL` 是通過犧牲一部分 CPU 性能換取更高的磁盤讀寫性能（IOPS），因此 QPS 會比默認模式差。
>
> 如果服務壓力不大，可以使用 `SWOOLE_IOURING_DEFAULT` 獲取更高的 QPS，如果確定服務性能瓶頸是在磁盤，可以使用 `SWOOLE_IOURING_SQPOLL`。
