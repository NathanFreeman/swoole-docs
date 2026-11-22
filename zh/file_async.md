# 异步文件处理

`Swoole` 的 [一键协程化](/zh/coroutine/hook.html) 可以很方便的将 `PHP` 的文件操作由同步阻塞变为异步执行，`Swoole` 一共内置了两种不同的文件异步策略。

## 线程池

- `线程池` 是 `Swoole` 默认的异步文件处理，用户发起文件操作时，`Swoole` 会将这个操作直接投递到 `线程池` 中，由子线程负责完成文件操作，执行完毕后再将协程切换回来。
- `PHP` 的文件操作函数都可以通过 `线程池` 实现异步操作，例如 `file_get_contents`，`fopen` 等。
- 无需任何依赖库，兼容性高，可直接上手使用。

## io_uring

- `io_uring` 是 `Swoole v6.0` 之后内置的策略，基于 `io_uring` 和 `epoll` 实现异步。
- 吞吐量高，可以处理大量异步文件操作。
- `io_uring` 对 linux 内核版本要求较高，建议在 linux 5.12+，liburing 2.8+ 以上的系统使用，有些操作系统没法使用这个特性。
- 由于是基于 `文件描述符` 实现文件异步，只支持一些 `PHP` 的文件操作函数。

> [!IMPORTANT]
> 当系统安装了 [`liburing`](/zh/start/install.html#安装-liburing) 和编译 `Swoole` 开启了 [`--enable-iouring`](/zh/start/install.html#通用功能选项) 之后才能使用。

> [!IMPORTANT]
> 开启了 `io_uring` 之后并不会替换掉 `线程池` 模式，有些 `io_uring` 没法协程化的函数还是会让 `线程池` 处理。

> [!IMPORTANT]
> `io_uring` 只支持 `file_get_contents`，`file_put_contents`，`fopen`，`fclose`，`fread`，`fwrite`，`mkdir`，`unlink`，`fsync`，`fdatasync`，`rename`，`fstat`，`lstat`，`filesize` 和 `ftruncate` 函数。

## 配置

`Swoole` 设置了几个关键参数影响 `异步` 文件操作的特性，可以通过 `swoole_async_set` 或者 [`Swoole\Server->set()`](/zh/server/methods.html#set) 来设置。

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

设置线程池的最小线程数，默认值为 `CPU核数`。

### aio_worker_num

设置线程池的最大线程数，默认值为 `CPU核数 * 8`。

### aio_max_wait_time

设置线程池中的线程的最大等待时间，默认值为 `0`。

### aio_max_idle_time

设置线程池中的线程的空闲时间，默认值为 `1s`。

### iouring_entries

设置 `io_uring` 的队列大小，默认为 `8192`，如果传入的值不是 `2的次方数`，内核会修改为最接近的，大于该值的 `2的次方数`。

> [!TIP]
> 如果传入的值过大，内核会抛出异常并且终止程序。

### iouring_workers

设置 `io_uring` 的工作线程数，默认值是 `CPU 核数 * 4`。

> [!TIP]
> 如果传入的值过大，内核会抛出异常并且终止程序。

### iouring_flag

设置 `io_uring` 的工作模式，默认值为 `SWOOLE_IOURING_DEFAULT`。

- `SWOOLE_IOURING_DEFAULT`，中断驱动模式，可通过系统调用 `io_uring_enter` 提交 `I/O` 请求，然后直接检查完成队列状态判断是否完成。
- `SWOOLE_IOURING_SQPOLL`，内核轮询模式，内核会创建内核线程用于提交和收割 `I/O` 请求，几乎完全消除用户态内核态上下文切换，性能较好。

> [!TIP]
> 如果传入的模式不正确，内核会统一使用 `SWOOLE_IOURING_DEFAULT` 中断驱动模式。
>
> `SWOOLE_IOURING_SQPOLL` 是通过牺牲一部分 CPU 性能换取更高的磁盘读写性能（IOPS），因此 QPS 会比默认模式差。
>
> 如果服务压力不大，可以使用 `SWOOLE_IOURING_DEFAULT` 获取更高的 QPS，如果确定服务性能瓶颈是在磁盘，可以使用 `SWOOLE_IOURING_SQPOLL`。
