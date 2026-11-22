# Async File Operations

`Swoole`'s [one-click coroutine hook](/en/coroutine/hook.html) conveniently turns `PHP` file operations from synchronous blocking into async execution. `Swoole` has two different built-in async file strategies in total.

## Thread Pool

- The `thread pool` is `Swoole`'s default async file processing strategy. When a user initiates a file operation, `Swoole` dispatches this operation directly to the `thread pool`, where a worker thread is responsible for completing the file operation, and then switches back to the coroutine after execution.
- All `PHP` file operation functions can be made async via the `thread pool`, for example `file_get_contents`, `fopen`, etc.
- No dependency libraries are required; compatibility is high and it can be used out of the box.

## io_uring

- `io_uring` is a strategy built in since `Swoole v6.0`, implementing async based on `io_uring` and `epoll`.
- High throughput; it can handle large numbers of async file operations.
- `io_uring` has high requirements on the Linux kernel version. It is recommended to use it on systems with Linux 5.12+ and liburing 2.8+; some operating systems cannot use this feature.
- Because file async is implemented based on `file descriptors`, only some `PHP` file operation functions are supported.

> [!IMPORTANT]
> It can only be used when [`liburing`](/en/start/install.html#installing-liburing) is installed on the system and `Swoole` is compiled with [`--enable-iouring`](/en/start/install.html#general-feature-options) enabled.

> [!IMPORTANT]
> Enabling `io_uring` does not replace the `thread pool` mode. Some functions that `io_uring` cannot make coroutine-based are still handled by the `thread pool`.

> [!IMPORTANT]
> `io_uring` only supports the `file_get_contents`, `file_put_contents`, `fopen`, `fclose`, `fread`, `fwrite`, `mkdir`, `unlink`, `fsync`, `fdatasync`, `rename`, `fstat`, `lstat`, `filesize`, and `ftruncate` functions.

## Configuration

`Swoole` provides several key parameters that affect the behavior of `async` file operations. They can be set via `swoole_async_set` or [`Swoole\Server->set()`](/en/server/methods.html#set).

**Example**

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

Sets the minimum number of threads in the thread pool. The default is `number of CPU cores`.

### aio_worker_num

Sets the maximum number of threads in the thread pool. The default is `number of CPU cores * 8`.

### aio_max_wait_time

Sets the maximum wait time of threads in the thread pool. The default is `0`.

### aio_max_idle_time

Sets the idle time of threads in the thread pool. The default is `1s`.

### iouring_entries

Sets the queue size of `io_uring`. The default is `8192`. If the value passed is not a `power of 2`, the kernel adjusts it to the nearest `power of 2` greater than that value.

> [!TIP]
> If the value passed is too large, the kernel throws an exception and terminates the program.

### iouring_workers

Sets the number of `io_uring` worker threads. The default is `number of CPU cores * 4`.

> [!TIP]
> If the value passed is too large, the kernel throws an exception and terminates the program.

### iouring_flag

Sets the working mode of `io_uring`. The default is `SWOOLE_IOURING_DEFAULT`.

- `SWOOLE_IOURING_DEFAULT`: interrupt-driven mode. `I/O` requests are submitted via the `io_uring_enter` system call, and then the completion queue status is checked directly to determine whether they are complete.
- `SWOOLE_IOURING_SQPOLL`: kernel polling mode. The kernel creates kernel threads to submit and reap `I/O` requests, almost completely eliminating user-mode/kernel-mode context switches, with better performance.

> [!TIP]
> If an invalid mode is passed, the kernel uniformly uses the `SWOOLE_IOURING_DEFAULT` interrupt-driven mode.
>
> `SWOOLE_IOURING_SQPOLL` trades some CPU performance for higher disk read/write performance (IOPS), so its QPS is worse than the default mode.
>
> If the service is under low load, you can use `SWOOLE_IOURING_DEFAULT` for higher QPS; if you are sure the service's performance bottleneck is the disk, you can use `SWOOLE_IOURING_SQPOLL`.