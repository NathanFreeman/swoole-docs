---
outline: 2
---

# Version Updates

## Version Types

* `alpha` feature preview release, indicating that the tasks in the development plan are complete and an open preview is available; it may contain many `BUG`s
* `beta` testing release, indicating that it can be used for testing in development environments; it may contain `BUG`s
* `rc[1-n]` release candidate, indicating that the release cycle has begun and broad testing is underway; `BUG`s may still be found during this period
* No suffix means a stable release, indicating that development of this version is complete and it is ready for production use

## Checking the Current Version

```shell
php --ri swoole
```

## v6.2.1
### Bug Fixes
- Fixed a timeout configuration error: resolved the issue where the write timeout incorrectly used the read timeout value when `max_idle_time` was set.
- Fixed async reload warnings: eliminated invalid warnings triggered by old processes exiting during async reload.
- Refactored process management: reworked the server process management logic.
- Improved handling of fork failures: improved the response mechanism after a child process `fork` fails. Added retry logic that waits 1 second before each retry to avoid generating excessive error logs.
- Fixed a data race: changed the `closed` field in the underlying `Connection` struct to atomic operations, resolving a potential data race risk.
- Fixed an integer overflow: fixed an integer overflow issue in the Redis server.
- Changed the communication mechanism: switched communication between worker threads and the main thread in the thread pool from `Pipe` to `UnixSocket`.
- Supported curl coroutine hooks: file upload and download operations in `curl` coroutine-hook scenarios are now replaced with coroutine-based implementations.
- Improved blocking function detection: enhanced the ability of `tracker observer` to detect blocking functions.
- Adapted unit tests: updated the IP address lookup functionality in unit tests for different operating systems.
- Added a PDO async method: added the async method `PQsendClosePrepared` to `pdo_pgsql` for closing existing prepared statements.
- Database connection pool improvements: added recognition and handling of various error messages indicating a broken database connection that requires reconnection.

## v6.2.0
### New Features
- Added a coroutine-based `FTP` client. Adding the `--enable-swoole-ftp` option at compile time enables coroutine support for `FTP` operations, avoiding network blocking
- Added a coroutine-based `SSH` client. Adding the `--with-swoole-ssh2` option at compile time enables coroutine support for `SSH` operations, improving concurrency efficiency
- Added `io_uring` support for the coroutine `HTTP` server. The coroutine `HTTP` server can now use the high-performance `io_uring` event mechanism. Add the `--enable-uring-socket` option at compile time to enable it for better I/O performance
- Added the `Swoole\RemoteObject\Server` module, providing transparent coroutine operation support for `MongoDB`
- Added the `Swoole\Coroutine::setTimeLimit()` function to control coroutine execution timeouts and prevent coroutines from occupying resources for too long
- Added `URL` rewrite support for the `HTTP` static file server
- Added coroutine support for `pdo_firebird`
- Support for `PHP 8.5`
- Support for coroutine hooks on the `gethostbyname` function
- Improved the implementation of `Server::shutdown()`, replacing signal communication with pipe communication in `Process` mode
- In the callbacks of Swoole's HTTP servers (including Swoole\Http\Server, Swoole\Http2\Server, and Swoole\Coroutine\Http\Server), the server property of the Swoole\Http\Request object now includes a server_addr field identifying the server's IP address
- Swoole\Coroutine::cancel now supports canceling all `iouring` operations

> The `SSH` and `FTP` coroutine clients cannot coexist with `PHP`'s `ext-ssh` and `ext-ftp`. To enable this feature, the `ssh` and `ftp` extensions of `PHP` must be disabled

### Bug Fixes
- Fixed HTTP2 server sessions being freed multiple times in a multithreaded environment
- Fixed a crash in version `8.5` caused by the need to run `refresh_memory_manager()` after a child process `fork` or child thread creation
- Fixed the `swoole_get_local_mac` function not working properly on `macOS`
- Fixed a crash that could occur when users manually suspended coroutines in a multithreaded environment
- Fixed compilation errors on Alpine
- Fixed a memory leak when function hook calls fail
- Fixed thread-safety issues in the coroutine implementations of `pdo_sqlite` and `pdo_oci`
- Fixed the `sw_php_print_backtrace` function so its output format matches the backtrace format of PHP's built-in function
- Fixed compilation failures caused by enabling --enable-uring-socket, --enable-trace-log, and --enable-error-log
- Fixed `pdo_firebird` failing to compile due to a missing macro definition

### Improvements
- Running `php --ri swoole` now outputs the `libpq` version information
- Improved the `io_uring` related logic in coroutine file operations
- Output the PHP call stack when adding an event fails
- Improved the implementation code of the `swoole_get_local_ip` and `swoole_get_local_mac` functions
- Improved coroutine wait times for file locks, avoiding exponentially increasing sleep times that made locks progressively harder to acquire
- Improved compatibility with the `Android` platform

### Notes
- Removed the `--enable-openssl` build option; `OpenSSL` support is now included by default
- `--enable-uring-socket` requires explicitly specifying either `--enable-iouring` or `--with-liburing-dir`
- `PHP8.1` is no longer supported
- The minimum required version of `liburing` is 2.8

## v6.2.0-rc2
### New Features
- Added a coroutine-based `FTP` client. Adding the `--enable-swoole-ftp` option at compile time enables coroutine support for `FTP` operations, avoiding network blocking
- Added a coroutine-based `SSH` client. Adding the `--with-swoole-ssh2` option at compile time enables coroutine support for `SSH` operations, improving concurrency efficiency
- Added `io_uring` support for the coroutine `HTTP` server. The coroutine `HTTP` server can now use the high-performance `io_uring` event mechanism. Add the `--enable-uring-socket` option at compile time to enable it for better I/O performance
- Added the `Swoole\RemoteObject\Server` module, providing transparent coroutine operation support for `MongoDB`
- Added the `Swoole\Coroutine::setTimeLimit()` function to control coroutine execution timeouts and prevent coroutines from occupying resources for too long
- Added `URL` rewrite support for the `HTTP` static file server
- Added coroutine support for `pdo_firebird`
- Support for `PHP 8.5`
- Support for coroutine hooks on the `gethostbyname` function
- Improved the implementation of `Server::shutdown()`, replacing signal communication with pipe communication in `Process` mode
- In the callbacks of Swoole's HTTP servers (including Swoole\Http\Server, Swoole\Http2\Server, and Swoole\Coroutine\Http\Server), the server property of the Swoole\Http\Request object now includes a server_addr field identifying the server's IP address
- Swoole\Coroutine::cancel now supports canceling all `iouring` operations

> The `SSH` and `FTP` coroutine clients cannot coexist with `PHP`'s `ext-ssh` and `ext-ftp`. To enable this feature, the `ssh` and `ftp` extensions of `PHP` must be disabled

### Bug Fixes
- Fixed HTTP2 server sessions being freed multiple times in a multithreaded environment
- Fixed a crash in version `8.5` caused by the need to run `refresh_memory_manager()` after a child process `fork` or child thread creation
- Fixed the `swoole_get_local_mac` function not working properly on `macOS`
- Fixed a crash that could occur when users manually suspended coroutines in a multithreaded environment
- Fixed compilation errors on Alpine
- Fixed a memory leak when function hook calls fail
- Fixed thread-safety issues in the coroutine implementations of `pdo_sqlite` and `pdo_oci`
- Fixed the `sw_php_print_backtrace` function so its output format matches the backtrace format of PHP's built-in function
- Fixed compilation failures caused by enabling --enable-uring-socket, --enable-trace-log, and --enable-error-log
- Fixed `pdo_firebird` failing to compile due to a missing macro definition

### Improvements
- Running `php --ri swoole` now outputs the `libpq` version information
- Improved the `io_uring` related logic in coroutine file operations
- Output the PHP call stack when adding an event fails
- Improved the implementation code of the `swoole_get_local_ip` and `swoole_get_local_mac` functions
- Improved coroutine wait times for file locks, avoiding exponentially increasing sleep times that made locks progressively harder to acquire
- Improved compatibility with the `Android` platform

### Notes
- Removed the `--enable-openssl` build option; `OpenSSL` support is now included by default
- `--enable-uring-socket` requires explicitly specifying either `--enable-iouring` or `--with-liburing-dir`
- `PHP8.1` is no longer supported
- `Swoole6.2.0RC2` is currently a testing release; it may only be used in testing environments and must not be used in production

## v6.2.0-rc1
### New Features
- Added a coroutine-based `FTP` client. Adding the `--enable-swoole-ftp` option at compile time enables coroutine support for `FTP` operations, avoiding network blocking
- Added a coroutine-based `SSH` client. Adding the `--with-swoole-ssh2` option at compile time enables coroutine support for `SSH` operations, improving concurrency efficiency
- Added `io_uring` support for the coroutine `HTTP` server. The coroutine `HTTP` server can now use the high-performance `io_uring` event mechanism. Add the `--enable-uring-socket` option at compile time to enable it for better I/O performance
- Added the `Swoole\RemoteObject\Server` module, providing transparent coroutine operation support for `MongoDB`
- Added the `Swoole\Coroutine::setTimeLimit()` function to control coroutine execution timeouts and prevent coroutines from occupying resources for too long
- Added `URL` rewrite support for the `HTTP` static file server
- Added coroutine support for `pdo_firebird`
- Support for `PHP 8.5`
- Support for coroutine hooks on the `gethostbyname` function
- Improved the implementation of `Server::shutdown()`, replacing signal communication with pipe communication in `Process` mode
- In the callbacks of Swoole's HTTP servers (including Swoole\Http\Server, Swoole\Http2\Server, and Swoole\Coroutine\Http\Server), the server property of the Swoole\Http\Request object now includes a server_addr field identifying the server's IP address

> The `SSH` and `FTP` coroutine clients cannot coexist with `PHP`'s `ext-ssh` and `ext-ftp`. To enable this feature, the `ssh` and `ftp` extensions of `PHP` must be disabled

### Bug Fixes
- Fixed HTTP2 server sessions being freed multiple times in a multithreaded environment
- Fixed a crash in version `8.5` caused by the need to run `refresh_memory_manager()` after a child process `fork` or child thread creation
- Fixed the `swoole_get_local_mac` function not working properly on `macOS`
- Fixed a crash that could occur when users manually suspended coroutines in a multithreaded environment
- Fixed compilation errors on Alpine
- Fixed a memory leak when function hook calls fail
- Fixed thread-safety issues in the coroutine implementations of `pdo_sqlite` and `pdo_oci`
- Fixed the `sw_php_print_backtrace` function so its output format matches the backtrace format of PHP's built-in function

### Improvements
- Running `php --ri swoole` now outputs the `libpq` version information
- Improved the `io_uring` related logic in coroutine file operations
- Output the PHP call stack when adding an event fails
- Improved the implementation code of the `swoole_get_local_ip` and `swoole_get_local_mac` functions
- Improved coroutine wait times for file locks, avoiding exponentially increasing sleep times that made locks progressively harder to acquire
- Improved compatibility with the `Android` platform

### Notes
- Removed the `--enable-openssl` build option; `OpenSSL` support is now included by default
- `--enable-uring-socket` requires explicitly specifying either `--enable-iouring` or `--with-liburing-dir`
- `PHP8.1` is no longer supported
- `Swoole6.2.0RC1` is currently a testing release; it may only be used in testing environments and must not be used in production

## v6.1.8
### Bug Fixes
- Fixed the issue where the write timeout incorrectly used the read timeout value when `max_idle_time` was set.
- Fixed invalid warnings caused by old processes exiting during async reload.
- Refactored the server process management logic.
- Improved handling after a process fork failure: added a retry mechanism that waits 1 second before retrying to avoid generating excessive error logs.
- Changed the `closed` field of the underlying `Connection` struct to atomic operations, resolving a potential data race.
- Fixed an integer overflow issue in the Redis server.

## v6.1.7
### Bug Fixes
- Fixed an issue where a misconfigured exponential backoff algorithm prevented some coroutines from acquiring a lock for a long time.
- Added a timeout control mechanism to the pdo_pgsql-based coroutine implementation to improve the stability of database operations.
- Fixed an issue where clearing a cookie with specified Domain and Path parameters did not include those two attributes in the actual response, preventing the cookie from expiring properly.

## v6.1.6
### Bug Fixes
- Fixed the `finish` property always being `false` when `websocket` receives continuation frames.
- Fixed compilation warnings produced when using the `--enable-swoole-sqlite` build option.
- When the ext-sockets extension is detected as not enabled, HOOK_SOCKETS is now automatically removed from the runtime hook flags.

## v6.1.5
### Bug Fixes
- Fixed a crash when users manually suspended coroutines in a multithreaded environment
- Fixed the `System::socket_poll()` function incorrectly closing the socket after failing to add an event
- Fixed decompression failures when `WebSocket` compressed message frames were produced with `MAX_MEM_LEVEL=9`, which some server environments do not support
- Fixed incorrect subsequent data reception when `WebSocket` receives decompressed continuation data frames, caused by the buffer not being cleared in time
- Fixed a `data race` in the `pdo_oci` coroutine client when handling non-`PDO_PARAM_LOB` data
### Improvements
- In `Http Server`, when the developer sets the `Content-Encoding` header, `Swoole` will no longer automatically compress the response body; the developer must implement the compression logic and output the corresponding content themselves.
### Removals
- Removed `PDO::sqliteCreateAggregate()`, `PDO::sqliteCreateCollation()`, and `PDO::sqliteCreateFunction()` in coroutine environments. Their implementation calls `PHP` functions as callbacks inside the `sqlite3` engine; these features are only usable in single-threaded synchronous blocking mode, while in `Swoole` coroutine mode the `C` functions of `sqlite3` must run in asynchronous `AIO` threads. In `ZTS` builds this caused null pointer reads, and under `NTS` it caused `data race`s leading to occasional crashes
- Removed support for the `open_basedir` setting in the `pdo_sqlite` coroutine client; `PG(open_basedir)` cannot be safely read in a multithreaded environment. Make sure the `sqlite3` database file path is a constant or another safe path; never use user-supplied parameters as part of the `sqlite` database file path

## v6.1.4
### Bug Fixes
- Fixed a memory leak in the curl module.

## v6.1.3
### Bug Fixes
#### HTTP/2 Server
- **Fixed a Safari browser compatibility issue**: resolved a flow-control compatibility issue when the HTTP/2 server sends large files to Safari browsers
- **Fixed a data race in the Date response header cache**: resolved a data race in the `Date` response header cache of the HTTP/2 server in multithreaded mode
- **Fixed the `package_max_length` setting not taking effect**:
    - When the `Content-Length` in a received `Header` frame exceeds the configured value, the server returns a `413 Payload Too Large` error
    - When the total length of consecutively received `Data` frames exceeds the configured value, the server sends an `HTTP/2 RST_STREAM` frame to terminate the stream
- **Fixed out-of-bounds memory access in multithreaded coroutine mode**: resolved an out-of-bounds memory access in the multithreaded coroutine `HTTP/2` server when `enable_reuse_port` is enabled
- **Fixed a `TLS` variable destruction issue**: resolved a `double free` when destroying `TLS (Thread Local Storage)` variables on thread exit in the multithreaded `HTTP/2` server

#### Redis Server
- Fixed a packing exception in `Redis\Server::format()` when handling large strings

#### WebSocket Server
- **Fixed control frame data contamination**: resolved an issue where `ping`/`pong`/`close` control frames automatically sent by the `WebSocket` server carried leftover data from the previous text or binary frame because the buffer was not cleared

#### Multithreading
- **Fixed a data race in `swoole_get_task_tmpdir()`**: resolved a data race when calling this function in a multithreaded environment
- **Fixed out-of-bounds memory access in runtime hooks**: resolved an out-of-bounds memory access triggered when setting runtime hooks in a multithreaded environment
    - ⚠️ **Important change**: runtime hooks may now only be set in the main thread, and must be set before any child threads are created

#### Platform Compatibility
- **Fixed FreeBSD compilation failures**: resolved compilation failures on FreeBSD

#### Feature Enhancements
- **Added Android platform support**: improved compatibility on the Android platform; running under Termux is now supported
- **Synced PHP 8.x curl module updates**: adapted to the relevant `curl` extension updates in PHP 8.1, 8.2, and 8.3


**Notes**: this update contains several critical fixes for multithreaded mode; users of multithreaded mode are advised to upgrade as soon as possible.

## v6.1.2
### Bug Fixes
- No longer throws a warning when setting the `socket` receive/send buffer size fails
- Fixed a use-after-free issue where the `onClose` callback could run before `onRequest` when `Swoole\Http\Server` handles `HTTP2` requests
- Improved the `getSocket()` method: the file descriptor is duplicated when exporting a `php sockets` resource object, so closing the `php sockets` resource does not affect the `socket` held by `Swoole`
- Fixed a memory leak in `Swoole\Async\Client`
- Fixed `IPv6` `Swoole\Coroutine\Http\Client` being unable to use a `Socks5` proxy
- Synced and adapted to the relevant `CURL` extension updates in `PHP 8.4`
- Added the `async.file://` file protocol, enabling coroutine scheduling for specific file operations when global file coroutine hooks are not enabled

```php
use function Swoole\Coroutine\run;

// Disable global file coroutine hooks, but enable coroutine operations for specific files via the `async.file://` protocol
Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL & ~SWOOLE_HOOK_FILE);

run(function() {
    $fp = fopen("async.file:///home/test", "w");
    fwrite($fp, "data");
    fclose($fp);

   $content = file_get_contents("async.file:///home/test");
});
```

This feature is intended for scenarios where global file system coroutine `HOOK`s are disabled but some file operations still need asynchronous read/write calls.

## v6.1.1
### Bug Fixes
- Fixed compilation failures caused by a missing `zlib` dependency.
- Improved resource management logic in the `curl` module to avoid use-after-free risks.
- Fixed the absence of `fdatasync` on `macos`.
- Improved the log output format of coroutine deadlock detection.

## v6.1.0
### The Biggest Changes in Swoole 6.1.0

**1. Introducing the "standard library extension" — a revolutionary syntax enhancement**
This is the most striking language-level feature of this update, allowing primitive types to be manipulated in an object-oriented way.
- **Primitive types as objects**: methods can be called directly on variables of primitive types such as `string`, `array`, and `stream` (e.g. `$text->length()->lower()`), greatly improving code readability and the writing experience.
- **Strongly-typed arrays**: introduced the `typed_array` syntax, which can define key/value type constraints (e.g. `<int, string>`) and performs type checks on writes, making code more robust.

**2. A giant leap in underlying architecture and stability**
This version invested heavily in code quality and stability, laying a solid foundation for future development.
- **Test coverage significantly increased to 86%**: systematically adding test cases greatly reduced potential errors and improved the reliability and maintainability of the entire project.
- **Large-scale code refactoring and static analysis**: refactored several core modules including Reactor, SSL, and Socket, and used `clang-tidy` for code cleanup, significantly improving code quality and performance.

**3. Major simplification and unification of the lock API**
The lock — a core component of concurrent programming — underwent a disruptive refactor.
- **Streamlined API**: removed methods such as `lockwait` and `trylock`, keeping only the three core methods `__construct`, `lock`, and `unlock` for `Swoole\Coroutine\Lock`, `Swoole\Lock`, and `Swoole\Thread\Lock`.
- **Unified behavior**: the new API design is closer to PHP's native `flock` function, lowering the learning curve, and uses standard constants such as `LOCK_EX | LOCK_NB` to achieve advanced functionality like non-blocking mode.

**4. Stronger coroutine capabilities and fine-grained control**
More flexible coroutine operation capabilities.
- **Coroutine cancellation mechanism**: `Swoole\Coroutine::cancel()` adds a `$throw_exception` parameter, allowing a catchable `Swoole\Coroutine\CanceledException` to be thrown into the target coroutine when canceling it, enabling safer and more controllable coroutine lifecycle management.
- **Coroutine state isolation for serialization operations**: fixed global state isolation for serialize/unserialize in coroutine environments. Related global variables are now automatically saved and restored on coroutine switches, ensuring serialization contexts of different coroutines do not interfere with each other.

**5. Default HTTP parser upgrade, WebSocket enhancements, and platform compatibility improvements**
Important improvements in performance and compatibility.
- **llHTTP enabled by default**: replaced the old `http_parser` with the higher-performance, more modern `llhttp`, improving the efficiency and reliability of HTTP processing.
- **WebSocket enhancements**: both client and server now support receiving fragmented messages, actively disconnecting (`disconnect`), and sending Ping frames (`ping`), making the WebSocket protocol implementation more complete.
- **Deprecating Select, embracing Poll**: completely deprecated the seriously flawed `select` event mechanism; on platforms without `epoll/kqueue` support (such as Cygwin), `poll` is used by default, so these platforms can also support large numbers of concurrent connections.

### Standard Library Extension

In version `6.1`, `Swoole-Cli` adds `PHP` standard library extension syntax, providing some additional new syntax while remaining fully compatible with official `PHP` syntax. These new extension syntaxes are all optional and do not affect existing `PHP` code. The standard library extension syntax is implemented in the `stdext` module of `ext-swoole`.

- `swoole-cli` users can use it directly without setting any extra parameters
- `ext-swoole` users need to add `--enable-swoole-stdext` at compile time to enable it
- `stdext` can be used in `php-cli`, `php-fpm`, `cli-http-server`, and `swoole` modes

### Primitive Types as Objects

Version `6.1` implements object-oriented wrappers for the `array`/`string`/`stream` primitive types, supporting object-oriented method calls; built-in methods can be called directly on variables of these types.

The built-in methods of primitive types still call the `PHP` standard library under the hood. Built-in methods correspond one-to-one with `PHP`'s `str_` or `array_` family of functions; for example, `$text->replace()` corresponds to `str_replace`. Under the hood only the function names were adjusted, a few methods had their parameter order changed, and a few methods had their parameter and return types adjusted. See the [Swoole documentation](https://wiki.swoole.com/) for details.

```php
$text = 'Hello Swoole';
var_dump($text->length());
echo $text->lower()->replace("swoole", "php");
echo fopen("/tmp/test.log")->read(1024);
```
### Typed-Array: Strongly-Typed Arrays

Array types can be constrained, such as `Map` or `ArrayList`, along with the types of `key` and `value`. Multi-level nested formats are supported. A `typed array` is actually still an `array`; the underlying layer only performs parameter checks on writes. A `typed array` can be passed to other functions or class methods as an `array`.

```php
$array = typed_array('<int, string>');
$array[1000] = "hello"; // Correct
$array[2000] = 2025; // Wrong, throws an exception
```

### New Features
- **llHTTP default parser**: since v6.1.0, Swoole uses the higher-performance `llhttp` instead of `http_parser` as the default HTTP message parser.
- **Coroutine-based file downloads**: `Swoole\Coroutine\Http\Client` now supports fully coroutine-based file download operations.
- **Async file truncation**: added `iouring ftruncate` support, extending async file operation capabilities.
- `Swoole\Coroutine::cancel()` adds a `$throw_exception` parameter, supporting throwing an exception when canceling a coroutine.
- `Swoole\Coroutine\Http\Client` and `Swoole\Coroutine\Http\Server` now support receiving fragmented WebSocket messages.
- Added `disconnect` and `ping` methods to `Swoole\Coroutine\Http\Client` and `Swoole\Coroutine\Http\Server`.
- Refactored `Swoole\Coroutine\Lock`, `Swoole\Lock`, and `Swoole\Thread\Lock`, keeping only the `__construct`, `lock`, and `unlock` methods, making usage closer to `php flock`.

### Bug Fixes
- **Thread mode improvements**:
    - Fixed `hook_flags` settings not taking effect in `SWOOLE_THREAD` mode.
    - Fixed an issue where, after a worker thread restarted upon reaching the `max_request` limit, the heartbeat thread held a stale pointer and accessed freed memory.
    - Fixed the inability to restart `Task` processes individually.
    - Fixed `Swoole\Websocket\Server` still possibly triggering the `onMessage` callback after a failed handshake or closed connection.
    - Fixed execution errors in `Swoole\Coroutine\Http\Server` caused by function return types inconsistent with their signatures.
    - Fixed `Swoole\Coroutine\Http\Server` not supporting enabling HTTP/2.
    - Fixed a timeout precision conversion issue in `Swoole\Lock::lockwait()`.
    - Fixed `ReactorEpoll::add(): failed to add event` warnings when using the coroutine `curl` module, caused by `PHP 8` compatibility adjustments and incomplete `keepalive` connection cleanup.
    - Fixed `Swoole\Server::taskWaitMulti()` being unusable in multithreaded mode.
    - Fixed a resource race in `Swoole\Server::taskCo()` in multithreaded mode.
- **Stability improvements**:
    - Fixed synchronous processes (including the manager process and task processes) being unable to use `process::signal()` properly.
    - Corrected the resource cleanup mechanism when worker processes exit abnormally.
    - Resolved compilation failures on the Cygwin platform.
    - Fixed curl being unable to reuse sockets when keepalive is enabled.
    - Improved the logging component to resolve data consistency issues in multithreaded mode.
    - Fixed compilation failures of the `io_uring` `futex` feature on `ubuntu24.04`.
    - Fixed compilation failures of positional struct initialization on older Linux systems.
    - Fixed the uninitialized `id` property of directly instantiated `Swoole\Process` objects.
    - Fixed the missing `--enable-zstd` option in composer.json when building swoole with `PIE`.
    - Fixed `worker` processes being unable to send signals to the `manager` process due to insufficient permissions after a user group was specified.
- **Compatibility improvements**:
    - Fixed a `php_swoole_register_shutdown_function` compatibility issue under PHP 8.5.
    - Corrected the handling of null parameters in `Swoole\Table::get()`.
- **Protocol handling**:
    - Improved the handling of duplicate fields in `HTTP` request and response headers to ensure they are merged correctly.
    - Fixed unknown compression method warnings triggered when handling a client's `Accept-Encoding: zlib` request header on systems without `zlib`.

### Deprecations
- The `select` event mechanism is no longer supported. `select` only supports event monitoring for `1024` handles and has serious flaws; platforms without `epoll/kqueue` support will use `poll` as the event polling mechanism, which also allows the `Cygwin` platform to support massive concurrency.
- The second parameter `$waitEvent` of the `Swoole\Server::stop()` method has been deprecated; please use the `reload_async` parameter instead.

### Architecture Improvements

Version `6.1` added a large number of unit tests for core modules, raising test coverage to **86%**. By systematically adding test cases and refactoring the underlying code logic, combined with full static code analysis using the `clang-tidy` toolchain, automated code formatting and redundancy cleanup were achieved, significantly improving code readability and maintainability.

- Improved the underlying `SSL` module.
- Improved the underlying `Socket` module.
- Refactored the underlying synchronous signal module.
- Refactored the underlying `reactor` and `string` modules.
- Refactored dynamic log file reloading based on the `SIGRTMIN` signal.
- Improved the underlying static file server, removing C-style code in favor of uniform C++-style code.
- Improved thread initialization logic to boost multithreaded performance; struct memory is managed independently, so thread creation and exit no longer require locking.
- Removed the deprecated `socket_dontwait` option from the underlying `async` module.
- Improved test coverage of `WebSocket` mask handling.
- Improved the `sendfile` feature: the `tcp_cork` option is not set when the file is smaller than `64KB`.
- Added unit tests for `aarch64` and `macOS` environments.
- Improved underlying client network address resolution and configuration.
- Added `ssl_cafile/ssl_capath` configuration options to the `Server` module.
- Added the `print_backtrace_on_error` configuration, which prints the C function stack when an unknown error occurs.
- Added the `Address Sanitizer` debugging tool.
- Added `Cygwin` tests, significantly improving compatibility and stability on the `Cygwin` platform
- On `macOS`, the `kqueue` event mechanism does not support cross-process pipe event monitoring, making `SWOOLE_PROCESS` mode and `Task` process functionality unusable. The system therefore uses `poll` as the underlying event mechanism by default. To enable `kqueue`, it can be turned on manually via `Swoole\Server::set(['enable_kqueue' => true])` and `swoole_async_set(['enable_kqueue' => true])`.
- Upgraded the `Swoole library` version.
- Disabled the `-Wdate-time` warning to resolve errors when compiling with Zig/Clang.
- Removed PHP 8.0 compatibility code.
- Added the `SWOOLE_ODBC_LIBS` variable in `config.m4`.
- Ensured `timespec.tv_nsec` values are less than `1,000,000,000` to comply with the POSIX standard.
- Refactored `swoole`'s underlying coroutine `curl` code to improve compatibility with the synchronous blocking version.

### Notes

- Since Swoole 6.1, `Swoole\Coroutine\Http\Client` and `Swoole\Coroutine\Http\Server` automatically handle WebSocket control frames unless `open_websocket_ping_frame`, `open_websocket_pong_frame`, or `open_websocket_close_frame` is explicitly set.
- `Swoole\Coroutine::cancel()` cannot cancel coroutine file operations; canceling file operations could cause segmentation faults, so it is now prohibited in the new version.
- If `--enable-iouring` is enabled, a warning is emitted when the detected kernel version or `liburing` version does not meet the requirements.
- The `Swoole\Websocket\Server::push` method does not automatically close the connection after sending a close frame; to close the connection, use the `Swoole\Websocket\Server::disconnect()` method.
- When handling control frames, the `Swoole` protocol actively sets the FIN flag to 1 and ensures compression is not enabled (i.e. the RSV1 bit is 0); user settings for these are ignored.
- When compressing and sending continuation frames, `Swoole` delegates compression and data chunking to the application layer; users must implement the related logic manually. See the examples at the bottom for details.
- Automatic `HTTP 100 Continue` responses are enabled by default.
- During coroutine switches, global variables related to `serialize` and `unserialize` operations are saved and restored.


### API Changes

#### New Lock API
```php
namespace Swoole\Coroutine {
    class Lock {
        public function __construct(bool $shared = false) {}
        public function lock(int $operation = LOCK_EX): bool {}
        public function unlock(): bool {}
    }
}

namespace Swoole {
    class Lock {
        public function __construct(int $type = SWOOLE_MUTEX) {}
        public function lock(int $operation = LOCK_EX, float $timeout = -1): bool {}
        public function unlock(): bool {}
    }
}

namespace Swoole\Thread {
    class Lock {
        public function __construct(int $type = SWOOLE_MUTEX) {}
        public function lock(int $operation = LOCK_EX, float $timeout = -1): bool {}
        public function unlock(): bool {}
    }
}
```

#### Usage Example
```php
$lock = new Swoole\Lock;
$lock->lock(LOCK_EX | LOCK_NB, 0.5);
$lock->unlock();
```

### Coroutine Cancellation
```php
use Swoole\Coroutine as Co;
use Swoole\Coroutine\System;

Co\run(function () {
    $cid = Co\go(function () {
        try {
            while (true) {
                System::sleep(0.1);
                echo "co 2 running\n";
            }
            var_dump('end');
        } catch (Swoole\Coroutine\CanceledException $e) {
            var_dump('cancelled');
        }
    });

    System::sleep(0.3);
    Co::cancel($cid, true);

    System::sleep(0.2);
    echo "co 1 end\n";
});
```

### WebSocket Compression and Continuation Frames

#### Async Server
```php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9502);
$server->set(['websocket_compression' => true]);
$server->on('message', function (Server $server, Frame $frame) {
    $data1 = bin2hex(random_bytes(10 * 1024));
    $data2 = bin2hex(random_bytes(20 * 2048));
    $data3 = bin2hex(random_bytes(40 * 4096));
    $context = deflate_init(ZLIB_ENCODING_RAW); // Streaming compression
    $server->push($frame->fd, deflate_add($context, $data1, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_TEXT, SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1);
    $server->push($frame->fd, deflate_add($context, $data2, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, 0);
    $server->push($frame->fd, deflate_add($context, $data3, ZLIB_FINISH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, SWOOLE_WEBSOCKET_FLAG_FIN);
});
$server->start();
```

#### Coroutine Server
```php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\Http\Server;

run(function() {
    $server = new Server("127.0.0.1", 9502);
    $server->set(['websocket_compression' => true]);
    $server->handle('/', function ($request, $response) {
        $response->upgrade();
        $data1 = bin2hex(random_bytes(10 * 1024));
        $data2 = bin2hex(random_bytes(20 * 2048));
        $data3 = bin2hex(random_bytes(40 * 4096));
        $context = deflate_init(ZLIB_ENCODING_RAW);
        $response->push(deflate_add($context, $data1, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_TEXT, SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1);
        $response->push(deflate_add($context, $data2, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, 0);
        $response->push(deflate_add($context, $data3, ZLIB_FINISH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, SWOOLE_WEBSOCKET_FLAG_FIN);
    });
});
```

#### Coroutine Client
```php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\Http\Client;

run(function() {
    $client = new Client('127.0.0.1', 9502);
    $client->set(['websocket_compression' => true]);
    $ret = $client->upgrade('/');
    $data1 = bin2hex(random_bytes(10 * 1024));
    $data2 = bin2hex(random_bytes(20 * 2048));
    $data3 = bin2hex(random_bytes(40 * 4096));
    $context = deflate_init(ZLIB_ENCODING_RAW);
    $client->push(deflate_add($context, $data1, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_TEXT, SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1);
    $client->push(deflate_add($context, $data2, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, 0);
    $client->push(deflate_add($context, $data3, ZLIB_FINISH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, SWOOLE_WEBSOCKET_FLAG_FIN);
});
```

## v6.1.0-rc2
### New Features
- `Swoole\Coroutine::cancel()` adds a `$throw_exception` parameter, supporting throwing an exception when canceling a coroutine.
- `Swoole\Coroutine\Http\Client` and `Swoole\Coroutine\Http\Server` now support receiving fragmented WebSocket messages.
- Added `disconnect` and `ping` methods to `Swoole\Coroutine\Http\Client` and `Swoole\Coroutine\Http\Server`.
- Refactored `Swoole\Coroutine\Lock`, `Swoole\Lock`, and `Swoole\Thread\Lock`, keeping only the `__construct`, `lock`, and `unlock` methods, making usage closer to `php flock`.

### Bug Fixes
- Fixed `Swoole\Websocket\Server` still possibly triggering the `onMessage` callback after a failed handshake or closed connection.
- Fixed execution errors in `Swoole\Coroutine\Http\Server` caused by function return types inconsistent with their signatures.
- Fixed `Swoole\Coroutine\Http\Server` not supporting enabling HTTP/2.
- Fixed a timeout precision conversion issue in `Swoole\Lock::lockwait()`.
- Fixed `ReactorEpoll::add(): failed to add event` warnings when using the coroutine `curl` module, caused by `PHP 8` compatibility adjustments and incomplete `keepalive` connection cleanup.

### Internal Improvements
- Upgraded the `Swoole library` version.
- Disabled the `-Wdate-time` warning to resolve errors when compiling with Zig/Clang.
- Removed PHP 8.0 compatibility code.
- Added the `SWOOLE_ODBC_LIBS` variable in `config.m4`.
- Ensured `timespec.tv_nsec` values are less than `1,000,000,000` to comply with the POSIX standard.

### Notes
- This is an RC (release candidate) version; please use it only in testing environments and do not deploy it in production.
- Since Swoole 6.1, `Swoole\Coroutine\Http\Client` and `Swoole\Coroutine\Http\Server` automatically handle WebSocket control frames unless `open_websocket_ping_frame`, `open_websocket_pong_frame`, or `open_websocket_close_frame` is explicitly set.
- `Swoole\Coroutine::cancel()` cannot cancel coroutine file operations; forcibly canceling them may cause segmentation faults.
- If `--enable-iouring` is enabled, a warning is emitted when the detected kernel version or `liburing` version does not meet the requirements.
- The `Swoole\Websocket\Server::push` method does not automatically close the connection after sending a close frame; to close the connection, use the `Swoole\Websocket\Server::disconnect()` method.
- When handling control frames, the `Swoole` protocol actively sets the FIN flag to 1 and ensures compression is not enabled (i.e. the RSV1 bit is 0); user settings for these are ignored.
- When compressing and sending continuation frames, `Swoole` delegates compression and data chunking to the application layer; users must implement the related logic manually. See the examples at the bottom for details.

### API Changes
#### New Lock API
```php
namespace Swoole\Coroutine {
    class Lock {
        public function __construct(bool $shared = false) {}
        public function lock(int $operation = LOCK_EX): bool {}
        public function unlock(): bool {}
    }
}

namespace Swoole {
    class Lock {
        public function __construct(int $type = SWOOLE_MUTEX) {}
        public function lock(int $operation = LOCK_EX, float $timeout = -1): bool {}
        public function unlock(): bool {}
    }
}

namespace Swoole\Thread {
    class Lock {
        public function __construct(int $type = SWOOLE_MUTEX) {}
        public function lock(int $operation = LOCK_EX, float $timeout = -1): bool {}
        public function unlock(): bool {}
    }
}
```

#### Usage Example
```php
$lock = new Swoole\Lock;
$lock->lock(LOCK_EX | LOCK_NB, 0.5);
$lock->unlock();
```

### Coroutine Cancellation
```php
use Swoole\Coroutine as Co;
use Swoole\Coroutine\System;

Co\run(function () {
    $cid = Co\go(function () {
        try {
            while (true) {
                System::sleep(0.1);
                echo "co 2 running\n";
            }
            var_dump('end');
        } catch (Swoole\Coroutine\CanceledException $e) {
            var_dump('cancelled');
        }
    });

    System::sleep(0.3);
    Co::cancel($cid, true);

    System::sleep(0.2);
    echo "co 1 end\n";
});
```

### WebSocket Compression and Continuation Frames

#### Async Server
```php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9502);
$server->set(['websocket_compression' => true]);
$server->on('message', function (Server $server, Frame $frame) {
    $data1 = bin2hex(random_bytes(10 * 1024));
    $data2 = bin2hex(random_bytes(20 * 2048));
    $data3 = bin2hex(random_bytes(40 * 4096));
    $context = deflate_init(ZLIB_ENCODING_RAW); // Streaming compression
    $server->push($frame->fd, deflate_add($context, $data1, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_TEXT, SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1);
    $server->push($frame->fd, deflate_add($context, $data2, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, 0);
    $server->push($frame->fd, deflate_add($context, $data3, ZLIB_FINISH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, SWOOLE_WEBSOCKET_FLAG_FIN);
});
$server->start();
```

#### Coroutine Server
```php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\Http\Server;

run(function() {
    $server = new Server("127.0.0.1", 9502);
    $server->set(['websocket_compression' => true]);
    $server->handle('/', function ($request, $response) {
        $response->upgrade();
        $data1 = bin2hex(random_bytes(10 * 1024));
        $data2 = bin2hex(random_bytes(20 * 2048));
        $data3 = bin2hex(random_bytes(40 * 4096));
        $context = deflate_init(ZLIB_ENCODING_RAW);
        $response->push(deflate_add($context, $data1, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_TEXT, SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1);
        $response->push(deflate_add($context, $data2, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, 0);
        $response->push(deflate_add($context, $data3, ZLIB_FINISH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, SWOOLE_WEBSOCKET_FLAG_FIN);
    });
});
```

#### Coroutine Client
```php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\Http\Client;

run(function() {
    $client = new Client('127.0.0.1', 9502);
    $client->set(['websocket_compression' => true]);
    $ret = $client->upgrade('/');
    $data1 = bin2hex(random_bytes(10 * 1024));
    $data2 = bin2hex(random_bytes(20 * 2048));
    $data3 = bin2hex(random_bytes(40 * 4096));
    $context = deflate_init(ZLIB_ENCODING_RAW);
    $client->push(deflate_add($context, $data1, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_TEXT, SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1);
    $client->push(deflate_add($context, $data2, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, 0);
    $client->push(deflate_add($context, $data3, ZLIB_FINISH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, SWOOLE_WEBSOCKET_FLAG_FIN);
});
```

## v6.1.0-rc1
### New Features
- **llHTTP default parser**: since v6.1.0, Swoole uses the higher-performance `llhttp` instead of `http_parser` as the default HTTP message parser.
- **Coroutine-based file downloads**: `Swoole\Coroutine\Http\Client` now supports fully coroutine-based file download operations.
- **Async file truncation**: added `iouring ftruncate` support, extending async file operation capabilities.

### Bug Fixes
- **Thread mode improvements**:
    - Fixed `hook_flags` settings not taking effect in `SWOOLE_THREAD` mode.
    - Fixed an issue where, after a worker thread restarted upon reaching the `max_request` limit, the heartbeat thread held a stale pointer and accessed freed memory.
    - Fixed the inability to restart `Task` processes individually.
- **Stability improvements**:
    - Fixed synchronous processes (including the manager process and task processes) being unable to use `process::signal()` properly.
    - Corrected the resource cleanup mechanism when worker processes exit abnormally.
    - Resolved compilation failures on the Cygwin platform.
    - Fixed curl being unable to reuse sockets when keepalive is enabled.
    - Improved the logging component to resolve data consistency issues in multithreaded mode.
    - Fixed compilation failures of the `io_uring` `futex` feature on `ubuntu24.04`.
    - Fixed compilation failures of positional struct initialization on older Linux systems.
    - Fixed the uninitialized `id` property of directly instantiated `Swoole\Process` objects.
-  Fixed the missing `--enable-zstd` option in composer.json when building swoole with `PIE`.
- **Compatibility improvements**:
    - Fixed a `php_swoole_register_shutdown_function` compatibility issue under PHP 8.5.
    - Corrected the handling of null parameters in `Swoole\Table::get()`.
- **Protocol handling**:
    - Improved the handling of duplicate fields in `HTTP` request and response headers to ensure they are merged correctly.
    - Fixed unknown compression method warnings triggered when handling a client's `Accept-Encoding: zlib` request header on systems without `zlib`.

### Deprecations
- The `select` event mechanism is no longer supported. `select` only supports event monitoring for `1024` handles and has serious flaws; platforms without `epoll/kqueue` support will use `poll` as the event polling mechanism, which also allows the `Cygwin` platform to support massive concurrency.
- The second parameter `$waitEvent` of the `Swoole\Server::stop()` method has been deprecated; please use the `reload_async` parameter instead.

### Architecture Improvements
- Version `6.1` added a large number of unit tests for core modules, raising test coverage to **86%**. By systematically adding test cases and refactoring the underlying code logic, combined with full static code analysis using the `clang-tidy` toolchain, automated code formatting and redundancy cleanup were achieved, significantly improving code readability and maintainability.

- Improved the underlying `SSL` module.
- Improved the underlying `Socket` module.
- Refactored the underlying synchronous signal module.
- Refactored the underlying `reactor` and `string` modules.
- Refactored dynamic log file reloading based on the `SIGRTMIN` signal.
- Improved the underlying static file server, removing C-style code in favor of uniform C++-style code.
- Improved thread initialization logic to boost multithreaded performance; struct memory is managed independently, so thread creation and exit no longer require locking.
- Removed the deprecated `socket_dontwait` option from the underlying `async` module.
- Improved test coverage of `WebSocket` mask handling.
- Improved the `sendfile` feature: the `tcp_cork` option is not set when the file is smaller than `64KB`.
- Added unit tests for `aarch64` and `macOS` environments.
- Improved underlying client network address resolution and configuration.
- Added `ssl_cafile/ssl_capath` configuration options to the `Server` module.
- Added the `print_backtrace_on_error` configuration, which prints the C function stack when an unknown error occurs.
- Added the `Address Sanitizer` debugging tool.
- Added `Cygwin` tests, significantly improving compatibility and stability on the `Cygwin` platform
- On `macOS`, the `kqueue` event mechanism does not support cross-process pipe event monitoring, making `SWOOLE_PROCESS` mode and `Task` process functionality unusable. The system therefore uses `poll` as the underlying event mechanism by default. To enable `kqueue`, it can be turned on manually via `Swoole\Server::set(['enable_kqueue' => true])` and `swoole_async_set(['enable_kqueue' => true])`.

## v6.0.2

### New Features
- Added the `Swoole\Thread::yield()`, `Swoole\Thread::activeCount()`, and `Swoole\Thread::isAlive()` methods.

### Bug Fixes
- Fixed exceptions caused by using single-thread mode and setting a heartbeat in `SWOOLE_THREAD` mode.
- Fixed a segmentation fault after enabling `swoole.enable_fiber_mock`.
- Fixed an integer overflow issue in the Redis server.

### Notes
- The Redis server now only supports the `RESP2` protocol; formatting a string that does not conform to this protocol will throw an exception instead of logging.

## v6.0.1

### Bug Fixes
- Fixed processes being unable to exit normally in `SWOOLE_THREAD` mode because listening events were not removed.
- Fixed large file uploads failing when the `single_thread` configuration is enabled.
- Fixed the build process being unable to find specific file paths when the same variables were already defined in `config.m4`.
- Fixed processes in `Swoole\Process\Pool` being unable to exit normally on timeout.
- Fixed crashes caused by calling `putenv` in `SWOOLE_THREAD` mode.
- Fixed the inability to set event callbacks for individual ports in `SWOOLE_THREAD` mode.
- Fixed runtime parameters being unavailable in events such as `onWorkerStart` in `SWOOLE_THREAD` mode.
- Fixed Postgresql degrading to synchronous mode when receiving large amounts of data under coroutine hooks.
- Improved the parameter validation logic of the `swoole_substr_json_decode`/`swoole_substr_unserialize` functions.
- Fixed CPU affinity settings in `config.m4`.
- Fixed heartbeat detection not working in `SWOOLE_THREAD` mode.

### Notes
- In the Http server, when a process restarts, the underlying layer sends 500 Internal Server to requests waiting in the queue, then closes the connection and discards those requests once sending is complete.
- Because the runtime configuration that PHP's underlying `stream factory` and `stream ops` depend on is not thread-safe, in multithreaded mode only the main thread may modify these runtime settings, and only before any child threads are created.
- Upgraded nghttp2 to the latest version.

## v5.1.8
### Bug Fixes
- Fixed compatibility issues when compiling Swoole with older GCC versions while thread context is enabled.
- Fixed CPU affinity support detection failing with newer GCC versions due to a missing _GNU_SOURCE macro definition.
- Fixed synchronous processes (including the manager process and task processes) being unable to use process::signal() properly.
- Fixed the HTTP2 coroutine client missing the serverLastStreamId property.
- Fixed unknown compression method warnings triggered when a client request's Accept-Encoding contains zlib on systems without zlib support.
- Fixed the Swoole\Process class missing the id property.

## v5.1.7

### Bug Fixes
- Fixed Postgresql degrading to synchronous mode when receiving large amounts of data under coroutine hooks.
- Fixed exceptions thrown for dynamically created class properties on `Swoole\Http2\Request`.
- Fixed fatal errors during coroutine hooks causing memory errors.

## v6.0.0

### New Features
- `Swoole` supports multithreaded mode: when `php` is in `zts` mode and `Swoole` is compiled with `--enable-swoole-thread`, multithreaded mode can be used.
- Added the thread creation class `Swoole\Thread`. @matyhtf
- Added the thread lock `Swoole\Thread\Lock`. @matyhtf
- Added thread atomic counters `Swoole\Thread\Atomic` and `Swoole\Thread\Atomic\Long`. @matyhtf
- Added safe concurrent containers `Swoole\Thread\Map`, `Swoole\Thread\ArrayList`, and `Swoole\Thread\Queue`. @matyhtf
- Async file operations now support using `iouring as the underlying engine for async file operations`. With `liburing` installed and `--enable-iouring` enabled when compiling `Swoole`, the async operations of `file_get_contents`, `file_put_contents`, `fopen`, `fclose`, `fread`, `fwrite`, `mkdir`, `unlink`, `fsync`, `fdatasync`, `rename`, `fstat`, `lstat`, and `filesize` will be implemented by `iouring`. @matyhtf @NathanFreeman
- Upgraded `Boost Context` to version 1.84. Loongson CPUs can now support coroutines too. @NathanFreeman
- Added the `Swoole\Thread\Map::find()` method. @matyhtf
- Added the `Swoole\Thread\ArrayList::find()` method. @matyhtf
- Added the `Swoole\Thread\ArrayList::offsetUnset()` method. @matyhtf
- Added the `Swoole\Process::getAffinity()` method. @matyhtf
- Added the `Swoole\Thread::setName()` method. @matyhtf
- Added the `Swoole\Thread::setAffinity()` method. @matyhtf
- Added the `Swoole\Thread::getAffinity()` method. @matyhtf
- Added the `Swoole\Thread::setPriority()` method. @matyhtf
- Added the `Swoole\Thread::getPriority()` method. @matyhtf
- Added the `Swoole\Thread::gettid()` method.
- The `iouring` async file engine supports the multithreaded polling mode `IORING_SETUP_SQPOLL`. @NathanFreeman
- Added `iouring_workers` to change the number of `iouring` threads. @NathanFreeman
- Added `iouring_flags` to support changing the `iouring` working mode. @NathanFreeman
- Added the `Swoole\Thread\Barrier` multithreaded synchronization barrier. @matyhtf
- Added new functions for setting cookies. @matyhtf @NathanFreeman
- Added a non-blocking, reentrant mutual-exclusion coroutine lock that can be used across processes/threads without blocking the process/thread. @NathanFreeman
- `Swoole\Coroutine\Socket::getOption()` now supports the `TCP_INFO` option. @matyhtf
- The `Swoole\Client` synchronous blocking client supports `http` proxies. @matyhtf
- Added the async non-blocking `TCP/UDP/Unixsocket` client `Swoole\Async\Client`. @matyhtf
- Improved the `Swoole\Redis\Server::format`() method with zero-copy memory support and support for nested `redis` structures. @matyhtf
- Support for the high-performance compression tool `Zstd`: just add `--enable-zstd` when compiling `Swoole`, and `http` clients and servers can use `zstd` to compress or decode responses. @NathanFreeman

### Bug Fixes
- Fixed installation via `pecl` failing. @remicollet
- Fixed the `Swoole\Coroutine\FastCGI\Client` client being unable to set keepalive. @NathanFreeman
- Fixed errors thrown when request parameters exceed `max_input_vars`, causing processes to restart repeatedly. @NathanFreeman
- Fixed unknown issues caused by using `Swoole\Event::wait()` in a coroutine. @matyhtf
- Fixed `proc_open` not supporting pty under coroutine hooks. @matyhtf
- Fixed segmentation faults with `pdo_sqlite` on PHP8.3. @NathanFreeman
- Fixed useless warnings when compiling `Swoole`. @Appla @NathanFreeman
- Fixed errors thrown by the underlying zend_fetch_resource2_ex call when `STDOUT/STDERR` are already closed. @Appla @matyhtf
- Fixed the ineffective `set_tcp_nodelay` configuration. @matyhtf
- Fixed an unreachable branch occasionally triggered during file uploads. @NathanFreeman
- Fixed errors thrown by PHP's underlying layer when `dispatch_func` is set. @NathanFreeman
- Fixed AC_PROG_CC_C99 being obsolete in autoconf >= 2.70. @petk
- Catch the exception thrown when thread creation fails. @matyhtf
- Fixed the undefined `_tsrm_ls_cache` issue. @jingjingxyk
- Fixed fatal errors when compiling with `GCC 14`. @remicollet
- Fixed dynamic property issues on `Swoole\Http2\Request`. @guandeng
- Fixed occasional resource-unavailable issues in the `pgsql` coroutine client. @NathanFreeman
- Fixed 503 errors caused by related parameters not being reset on process restart. @matyhtf
- Fixed `$request->server['request_method']` and `$request->getMethod()` returning inconsistent results when `HTTP2` is enabled. @matyhtf
- Fixed incorrect `content-type` when uploading files. @matyhtf
- Fixed code errors in the `http2` coroutine client. @matyhtf
- Fixed `Swoole\Server` missing the `worker_id` property. @cjavad
- Fixed `brotli`-related errors in `config.m4`. @fundawang
- Fixed `Swoole\Http\Response::create` not working in multithreaded mode. @matyhtf
- Fixed compilation errors on `macos`. @matyhtf
- Fixed threads being unable to exit safely. @matyhtf
- Fixed the static variable holding the response time in `Swoole\Http\Response` not being generated separately for each thread in multithreaded mode. @matyhtf @NathanFreeman
- Fixed `Fatal error` issues caused by the `timeout` feature of `PHP-8.4` in ZTS mode. @matyhtf
- Fixed the `exit()` function `hook` for `PHP-8.4`. @remicollet
- Fixed `Swoole\Thread::getNativeId()` not working on `cygwin`. @matyhtf
- Fixed the `Swoole\Coroutine::getaddrinfo()` method causing `SIGSEGV`. @matyhtf
- Fixed the `runtime tcp` module not supporting dynamically enabling SSL encryption. @matyhtf
- Fixed incorrect timeout values when the http client runs for a long time. @matyhtf
- Fixed the `Swoole\Table` mutex becoming unusable before process exit. @matyhtf
- Fixed `Swoole\Server::stop()` failing when called with named arguments. @matyhtf
- Fixed crashes caused by `Swoole\Thread\Map::toArray()` not copying the `key`. @matyhtf
- Fixed `Swoole\Thread\Map` being unable to delete nested numeric keys. @matyhtf

### Core Improvements
- Removed useless checks for `socket structs`. @petk
- Upgraded the swoole Library. @deminy
- Added support for the 451 status code to `Swoole\Http\Response`. @abnegate
- Synced `file` operation code across PHP versions. @NathanFreeman
- Synced `pdo` operation code across PHP versions. @NathanFreeman
- Improved the code of `Socket::ssl_recv()`. @matyhtf
- Improved config.m4; some dependencies can now have their library locations set via `pkg-config`. @NathanFreeman
- Improved the use of dynamic arrays when `parsing request headers`. @NathanFreeman
- Improved the lifecycle of the file descriptor `fd` in multithreaded mode. @matyhtf
- Improved some basic coroutine logic. @matyhtf
- Upgraded the oracle database version used in CI tests. @gvenzl
- Improved the underlying `sendfile` logic. @matyhtf
- Replaced `PHP_DEF_HAVE` with `AC_DEFINE_UNQUOTED` in `config.m4`. @petk
- Improved the server's `heartbeat`, `shutdown`, and `stop` logic in multithreaded mode. @matyhtf
- No longer links `librt` when the `glibc` version is higher than 2.17. @matyhtf
- Enhanced the `http` client to accept duplicate request headers. @matyhtf
- Improved `Swoole\Http\Response::write()`. @matyhtf
- `Swoole\Http\Response::write()` can now send the `http2` protocol. @matyhtf
- Compatibility with `PHP8.4`. @matyhtf @NathanFreeman
- Added async write capability to the underlying `socket`. @matyhtf
- Improved `Swoole\Http\Response`. @NathanFreeman
- Support for sharing native php `socket`s in multithreaded mode. @matyhtf
- Improved the static file service and fixed incorrect static file paths. @matyhtf
- The async `Server` in multithreaded mode supports restarting worker threads. @matyhtf
- The async `Server` in multithreaded mode supports starting timers in the `Manager` thread. @matyhtf
- Compatibility with the `curl` extension of `PHP-8.4`. @matyhtf @NathanFreeman
- Re-encapsulated `Swoole`'s underlying `iouring` code. @matyhtf @NathanFreeman
- Improved timers so that synchronous processes no longer depend on signals. @matyhtf
- Improved the `Swoole\Coroutine\System::waitSignal()` method to allow listening for multiple signals simultaneously. @matyhtf

### Deprecations
- `PHP 8.0` is no longer supported.
- The `Swoole\Coroutine\MySQL` coroutine client is no longer supported.
- The `Swoole\Coroutine\Redis` coroutine client is no longer supported.
- The `Swoole\Coroutine\PostgreSQL` coroutine client is no longer supported.
- Removed the `Swoole\Coroutine\System::fread()`, `Swoole\Coroutine\System::fwrite()`, and `Swoole\Coroutine\System::fgets()` methods

## v5.1.5

### Bug Fixes
- Fixed the need to use `zend_ini_parse_quantity` to parse numeric strings on php versions greater than 8.2. @matyhtf
- Fixed occasional resource-unavailable issues when `pdo_pgsql` is under coroutine hooks. @NathanFreeman
- Fixed header file inclusion issues when `pdo_pgsql` is under coroutine hooks. @NathanFreeman
- Fixed incorrect relative path checks to prevent bypassing path validation. @matyhtf
- Fixed incorrect concurrency counts caused by process restarts under high concurrency. @matyhtf

### Core Improvements
- Synced some related code from `php8.3 curl`. @NathanFreeman
- Fixed core test errors in the `process` module. @NathanFreeman
- In `SWOOLE_BASE` mode, all connections should be closed during the `PHP RSHUTDOWN` phase. @matyhtf
- Improved core code. @matyhtf

## v6.0.0-beta

### New Features
- Added the `Swoole\Thread\Map::find()` method. @matyhtf
- Added the `Swoole\Thread\ArrayList::find()` method. @matyhtf
- Added the `Swoole\Thread\ArrayList::offsetUnset()` method. @matyhtf
- Added the `Swoole\Process::getAffinity()` method. @matyhtf
- Added the `Swoole\Thread::setName()` method. @matyhtf
- Added the `Swoole\Thread::setAffinity()` method. @matyhtf
- Added the `Swoole\Thread::getAffinity()` method. @matyhtf
- Added the `Swoole\Thread::setPriority()` method. @matyhtf
- Added the `Swoole\Thread::getPriority()` method. @matyhtf
- Added the `Swoole\Thread::gettid()` method.
- The `iouring` async file engine supports the multithreaded polling mode `IORING_SETUP_SQPOLL`. @NathanFreeman
- Added `iouring_workers` to change the number of `iouring` threads. @NathanFreeman
- Added `iouring_flags` to support changing the `iouring` working mode. @NathanFreeman
- Added the `Swoole\Thread\Barrier` multithreaded synchronization barrier. @matyhtf
- Added new functions for setting cookies. @matyhtf @NathanFreeman

### Bug Fixes
- Fixed dynamic property issues on `Swoole\Http2\Request`. @guandeng
- Fixed occasional resource-unavailable issues in the `pgsql` coroutine client. @NathanFreeman
- Fixed 503 errors caused by related parameters not being reset on process restart. @matyhtf
- Fixed $request->server['request_method'] and $request->getMethod() returning inconsistent results when `HTTP2` is enabled. @matyhtf
- Fixed incorrect `content-type` when uploading files. @matyhtf
- Fixed code errors in the `http2` coroutine client. @matyhtf
- Fixed `Swoole\Server` missing the `worker_id` property. @cjavad
- Fixed `brotli`-related errors in `config.m4`. @fundawang
- Fixed `Swoole\Http\Response::create` not working in multithreaded mode. @matyhtf
- Fixed compilation errors on `macos`. @matyhtf
- Fixed threads being unable to exit safely. @matyhtf
- Fixed the static variable holding the response time in `Swoole\Http\Response` not being generated separately for each thread in multithreaded mode. @matyhtf @NathanFreeman

### Core Improvements
- Upgraded the oracle database version used in CI tests. @gvenzl
- Refactored and improved `swoole`'s underlying code. @matyhtf
- Improved the underlying `sendfile` logic. @matyhtf
- Improved parameter parsing. @matyhtf
- Replaced `PHP_DEF_HAVE` with `AC_DEFINE_UNQUOTED` in `config.m4`. @petk
- Improved the server's `heartbeat`, `shutdown`, and `stop` logic in multithreaded mode. @matyhtf
- No longer links `librt` when the `glibc` version is higher than 2.17. @matyhtf
- Enhanced the `http` client to accept duplicate request headers. @matyhtf
- Improved `Swoole\Http\Response::write()`. @matyhtf
- `Swoole\Http\Response::write()` can now send the `http2` protocol. @matyhtf
- Compatibility with `PHP8.4`. @matyhtf @NathanFreeman
- Added async write capability to the underlying `socket`. @matyhtf
- Improved `Swoole\Http\Response`. @NathanFreeman
- Improved underlying error messages. @matyhtf
- Support for sharing native php `socket`s in multithreaded mode. @matyhtf
- Improved the static file service and fixed incorrect static file paths. @matyhtf

### Deprecations
- Removed the `Swoole\Coroutine\System::fread()`, `Swoole\Coroutine\System::fwrite()`, and `Swoole\Coroutine\System::fgets()` methods

## v6.0.0-alpha

### New Features
- `Swoole` supports multithreaded mode: when `php` is in `zts` mode and `Swoole` is compiled with `--enable-swoole-thread`, multithreaded mode can be used.
- Added the thread management class `Swoole\Thread`. @matyhtf
- Added the thread lock `Swoole\Thread\Lock`. @matyhtf
- Added thread atomic counters `Swoole\Thread\Atomic` and `Swoole\Thread\Atomic\Long`. @matyhtf
- Added safe concurrent containers `Swoole\Thread\Map`, `Swoole\Thread\ArrayList`, and `Swoole\Thread\Queue`. @matyhtf
- Async file operations support `iouring` as the underlying engine. With `liburing` installed and `--enable-iouring` enabled when compiling `Swoole`, the async operations of `file_get_contents`, `file_put_contents`, `fopen`, `fclose`, `fread`, `fwrite`, `mkdir`, `unlink`, `fsync`, `fdatasync`, `rename`, `fstat`, `lstat`, and `filesize` will be implemented by `iouring`. @matyhtf @NathanFreeman
- Upgraded `Boost Context` to version 1.84. Loongson CPUs can now use coroutines too. @NathanFreeman

### Bug Fixes
- Fixed installation via `pecl` failing. @remicollet
- Fixed the `Swoole\Coroutine\FastCGI\Client` client being unable to set keepalive. @NathanFreeman
- Fixed errors thrown when request parameters exceed `max_input_vars`, causing processes to restart repeatedly. @NathanFreeman
- Fixed unknown issues caused by using `Swoole\Event::wait()` in a coroutine. @matyhtf
- Fixed `proc_open` not supporting pty under coroutine hooks. @matyhtf
- Fixed segmentation faults with `pdo_sqlite` on PHP8.3. @NathanFreeman
- Fixed useless warnings when compiling `Swoole`. @Appla @NathanFreeman
- Fixed errors thrown by the underlying zend_fetch_resource2_ex call when `STDOUT/STDERR` are already closed. @Appla @matyhtf
- Fixed the ineffective `set_tcp_nodelay` configuration. @matyhtf
- Fixed an unreachable branch occasionally triggered during file uploads. @NathanFreeman
- Fixed errors thrown by PHP's underlying layer when `dispatch_func` is set. @NathanFreeman
- Fixed AC_PROG_CC_C99 being obsolete in autoconf >= 2.70. @petk
- Catch the exception thrown when thread creation fails. @matyhtf
- Fixed the undefined `_tsrm_ls_cache` issue. @jingjingxyk
- Fixed fatal errors when compiling with `GCC 14`. @remicollet

### Core Improvements
- Removed useless checks for `socket structs`. @petk
- Upgraded the swoole Library. @deminy
- Added support for the 451 status code to `Swoole\Http\Response`. @abnegate
- Synced `file` operation code across PHP versions. @NathanFreeman
- Synced `pdo` operation code across PHP versions. @NathanFreeman
- Improved the code of `Socket::ssl_recv()`. @matyhtf
- Improved config.m4; some dependencies can now have their library locations set via `pkg-config`. @NathanFreeman
- Improved the use of dynamic arrays when `parsing request headers`. @NathanFreeman
- Improved the lifecycle of the file descriptor `fd` in multithreaded mode. @matyhtf
- Improved some basic coroutine logic. @matyhtf

### Deprecations
- `PHP 8.0` is no longer supported.
- The `Swoole\Coroutine\MySQL` coroutine client is no longer supported.
- The `Swoole\Coroutine\Redis` coroutine client is no longer supported.
- The `Swoole\Coroutine\PostgreSQL` coroutine client is no longer supported.

## v5.1.3
### Bug Fixes
- Fixed installation via `pecl` failing.
- Fixed the `Swoole\Coroutine\FastCGI\Client` client being unable to set keepalive.
- Fixed errors thrown when request parameters exceed `max_input_vars`, causing processes to restart repeatedly.
- Fixed unknown issues caused by using `Swoole\Event::wait()` in a coroutine.
- Fixed `proc_open` not supporting pty under coroutine hooks.
- Fixed segmentation faults with `pdo_sqlite` on PHP8.3.
- Fixed useless warnings when compiling `Swoole`.
- Fixed errors thrown by the underlying zend_fetch_resource2_ex call when `STDOUT/STDERR` are already closed.
- Fixed the ineffective `set_tcp_nodelay` configuration.
- Fixed an unreachable branch occasionally triggered during file uploads.
- Fixed errors thrown by PHP's underlying layer when `dispatch_func` is set.
- Fixed AC_PROG_CC_C99 being obsolete in autoconf >= 2.70.

### Core Improvements
- Removed useless checks for `socket structs`.
- Upgraded the swoole Library.
- Added support for the 451 status code to `Swoole\Http\Response`.
- Synced `file` operation code across PHP versions.
- Synced `pdo` operation code across PHP versions.
- Improved the code of `Socket::ssl_recv()`.
- Improved config.m4; some dependencies can now have their library locations set via `pkg-config`.
- Improved the use of dynamic arrays when `parsing request headers`.

## v5.1.2

### Bug Fixes
- Support for embedded sapi.
- Fixed a ZEND_CHECK_STACK_LIMIT compatibility issue in PHP 8.3.
- Fixed the missing Content-Range response header when a range request returns the entire file content.
- Fixed truncated cookies.
- Fixed native-curl crashes on PHP 8.3.
- Fixed invalid errno errors after Server::Manager::wait().
- Fixed an HTTP2 typo.

### Improvements
- Improved HTTP server performance.
- Added CLOSE_SERVICE_RESTART, CLOSE_TRY_AGAIN_LATER, and CLOSE_BAD_GATEWAY as valid websocket close reasons

## v5.1.1
### Bug Fixes
- Fixed a memory leak in the `http coroutine client`.
- Fixed `pdo_odbc` being unable to use coroutine hooks.
- Fixed execution errors in `socket_import_stream()`.
- Fixed `Context::parse_multipart_data()` being unable to handle empty request bodies.
- Fixed parameters not taking effect in the `PostgreSQL coroutine client`.
- Fixed a bug where `curl` crashes during destruction.
- Fixed incompatibility between `Swoole5.x` and newer versions of `xdebug`.
- Fixed "class not found" errors caused by coroutine switches during class `autoloading`.
- Fixed `swoole` being unable to compile on `OpenBSD`.

## v5.1.0

### New Features
- Added coroutine support for `pdo_pgsql`
- Added coroutine support for `pdo_odbc`
- Added coroutine support for `pdo_oci`
- Added coroutine support for `pdo_sqlite`
- Added connection pool configuration for `pdo_pgsql`, `pdo_odbc`, `pdo_oci`, and `pdo_sqlite`

### Enhancements
- Improved the performance of `Http\Server`, by up to `60%` in extreme cases

### Fixes
- Fixed a memory leak caused by each request in the `WebSocket` coroutine client
- Fixed clients not exiting due to graceful shutdown of the `http coroutine server`
- Fixed `Process::signal()` not working when compiled with the `--enable-thread-context` option
- Fixed incorrect connection counts when a process exits abnormally in `SWOOLE_BASE` mode
- Fixed an incorrect `stream_select()` function signature
- Fixed case-sensitivity errors in file MIME information
- Fixed warnings thrown under PHP8.2 due to the misspelling of `Http2\Request::$usePipelineRead`
- Fixed a memory leak in `SWOOLE_BASE` mode
- Fixed a memory leak caused by setting a cookie expiration time in `Http\Response::cookie()`
- Fixed a connection leak in `SWOOLE_BASE` mode

### Core
- Fixed the php_url_encode function signature issue for swoole under php8.3
- Fixed unit test option issues
- Optimizations and code refactoring
- Compatibility with PHP8.3
- Compilation on 32-bit operating systems is not supported

##  v5.0.3

### Enhancements
- Added the `--with-nghttp2_dir` option for using the system's `nghttp2` library
- Support for options related to byte length or size
- Added the `Process\Pool::sendMessage()` function
- `Http\Response:cookie()` supports `max-age`

### Fixes
- Fixed memory leaks caused by `Server task/pipemessage/finish` events

### Core
- `http` response header conflicts will no longer throw errors
- `Server` connection closes will no longer throw errors

## v5.0.2

### Enhancements
- Support for configuring the default settings of `http2`
- Support for `xdebug` 8.1 or higher
- Refactored native curl to support curl handles with multiple sockets, such as the curl ftp protocol
- Added the `who` parameter to `Process::setPriority/getPriority`
- Added the `Coroutine\Socket::getBoundCid()` method
- Changed the default value of the `length` parameter of the `Coroutine\Socket::recvLine/recvWithBuffer` methods to `65536`
- Refactored the cross-coroutine exit feature to make memory release safer and resolve crashes when fatal errors occur
- Added the `socket` property to `Coroutine\Client`, `Coroutine\Http\Client`, and `Coroutine\Http2\Client`, allowing direct manipulation of the `socket` resource
- Support for `Http\Server` sending empty files to `http2` clients
- Support for graceful restarts of `Coroutine\Http\Server`. When the server shuts down, client connections are no longer forcibly closed; it only stops listening for new requests
- Added `pcntl_rfork` and `pcntl_sigwaitinfo` to the list of unsafe functions, which are disabled when the coroutine container starts
- Refactored the `SWOOLE_BASE` mode process manager so shutdown and reload behavior is consistent with `SWOOLE_PROCESS`

##  v5.0.1

### Enhancements
- Support for `PHP-8.2`, improved coroutine exception handling, compatibility with `ext-soap`
- Added `LOB` support to the `pgsql` coroutine client
- Improved the `websocket` client: the upgrade header contains `websocket` instead of using `=`
- Improved the `http client`: disables `keep-alive` when the server sends `connection close`
- Improved the `http client`: no longer adds the `Accept-Encoding` header when no compression library is available
- Improved debug information: passwords are marked as sensitive parameters under `PHP-8.2`
- Enhanced `Server::taskWaitMulti()` so it does not block in coroutine environments
- Improved the logging functions: no longer prints to the screen when writing to the log file fails


### Fixes
- Fixed parameter compatibility issues with `Coroutine::printBackTrace()` and `debug_print_backtrace()`
- Fixed `Event::add()` support for socket resources
- Fixed compilation errors without `zlib`
- Fixed crashes when unpacking server tasks that parse into unexpected strings
- Fixed timers shorter than `1ms` being forcibly set to `0`
- Fixed crashes caused by using `Table::getMemorySize()` before adding columns
- Renamed the expiration parameter of the `Http\Response::setCookie()` method to `expires`

## v5.0.0

### New Features
- Added the `max_concurrency` option for `Server`
- Added the `max_retries` option for `Coroutine\Http\Client`
- Added the `name_resolver` global option. Added the `upload_max_filesize` option for `Server`
- Added the `Coroutine::getExecuteTime()` method
- Added the `SWOOLE_DISPATCH_CONCURRENT_LB` `dispatch_mode` for `Server `
- Strengthened the type system: added types to the parameters and return values of all functions
- Improved error handling: all constructors now throw exceptions on failure
- Changed the default mode of `Server` to `SWOOLE_BASE` mode
- Migrated the `pgsql` coroutine client into the core library. Includes all `bug` fixes from the `4.8.x` branch

### Removals
- Removed `PSR-0` style class names
- Removed the automatic addition of `Event::wait()` in shutdown functions
- Removed the aliases `Server::tick/after/clearTimer/defer`
- Removed `--enable-http2/--enable-swoole-json`; they are now enabled by default

### Deprecations
- The coroutine clients `Coroutine\Redis` and `Coroutine\MySQL` are deprecated by default

## v4.8.13

### Enhancements
- Refactored native curl to support curl handles with multiple sockets, such as the curl FTP protocol
- Support for manually setting `http2` settings
- Improved the `WebSocket client`: the upgrade header contains `websocket` instead of `equal`
- Improved the HTTP client: disables `keep-alive` when the server sends connection close
- Improved debug information: passwords are marked as sensitive parameters under PHP-8.2
- Support for `HTTP Range Requests`

### Fixes
- Fixed parameter compatibility issues with `Coroutine::printBackTrace()` and `debug_print_backtrace()`
- Fixed incorrect length parsing when a `WebSocket` server has both `HTTP2` and `WebSocket` protocols enabled
- Fixed memory leaks when `send_yield` occurs in `Server::send()`, `Http\Response::end()`, `Http\Response::write()`, and `WebSocket/Server::push()`
- Fixed crashes caused by using `Table::getMemorySize()` before adding columns.

## v4.8.12

### Enhancements
- Support for PHP8.2
- The `Event::add()` function supports `sockets resources`
- `Http\Client::sendfile()` supports files larger than 4G
- `Server::taskWaitMulti()` supports coroutine environments

### Fixes
- Fixed error messages thrown when receiving an invalid `multipart body`
- Fixed errors caused by timer timeouts shorter than `1ms`
- Fixed deadlocks caused by a full disk

## v4.8.11

### Enhancements
- Support for the `Intel CET` security defense mechanism
- Added the `Server::$ssl` property
- Added the `enable-cares` attribute when compiling `swoole` with `pecl`
- Refactored the `multipart_parser` parser

### Fixes
- Fixed segmentation faults caused by exceptions thrown by `pdo` persistent connections
- Fixed segmentation faults caused by using coroutines in destructors
- Fixed incorrect error messages from `Server::close()`

## v4.8.10

### Fixes

- Reset the timeout parameter of `stream_select` to `0` when it is less than `1ms`
- Fixed compilation failures when adding `-Werror=format-security` at compile time
- Fixed segmentation faults in `Swoole\Coroutine\Http\Server` caused by using `curl`

## v4.8.9

### Enhancements

- Support for the `http_autoindex` option under the `Http2` server

### Fixes

- Improved the `Cookie` parser to support passing the `HttpOnly` option
- Fixed #4657, a return type issue in the hooked `socket_create` method
- Fixed a `stream_select` memory leak

### CLI Updates

- `CygWin` now ships with the SSL certificate chain, resolving SSL authentication errors
- Updated to `PHP-8.1.5`

## v4.8.8

### Improvements

- Reduced SW_IPC_BUFFER_MAX_SIZE to 64k
- Improved the http2 header_table_size setting

### Fixes

- Fixed numerous socket errors when downloading static files with enable_static_handler
- Fixed http2 server NPN errors

## v4.8.7

### Enhancements

- Added curl_share support

### Fixes

- Fixed undefined symbol errors on the arm32 architecture
- Fixed `clock_gettime()` compatibility
- Fixed send failures in PROCESS mode servers when the kernel lacks large memory blocks

## v4.8.6

### Fixes

- Added prefixes to boost/context API names
- Improved configuration options

## v4.8.5

### Fixes

- Reverted the parameter types of Table
- Fixed crashes when receiving invalid data with the Websocket protocol

## v4.8.4

### Fixes

- Fixed sockets hook compatibility with PHP-8.1
- Fixed Table compatibility with PHP-8.1
- Fixed the coroutine-style HTTP server parsing `POST` parameters with `Content-Type` of `application/x-www-form-urlencoded` unexpectedly in some cases

## v4.8.3

### New APIs

- Added the `Coroutine\Socket::isClosed()` method

### Fixes

- Fixed curl native hook compatibility issues under php8.1
- Fixed sockets hook compatibility issues under php8
- Fixed incorrect return values of sockets hook functions
- Fixed Http2Server sendfile being unable to set content-type
- Improved the performance of the HttpServer date header by adding a cache

## v4.8.2

### Fixes

- Fixed a memory leak in the proc_open hook
- Fixed curl native hook compatibility issues with PHP-8.0 and PHP-8.1
- Fixed connections being unable to close properly in the Manager process
- Fixed the Manager process being unable to use sendMessage
- Fixed parsing exceptions in `Coroutine\Http\Server` when receiving oversized POST data
- Fixed the inability to exit directly on fatal errors under PHP8
- Adjusted the coroutine `max_concurrency` configuration option so it can only be used in `Co::set()`
- Adjusted `Coroutine::join()` to ignore non-existent coroutines

## v4.8.1

### New APIs

- Added the `swoole_error_log_ex()` and `swoole_ignore_error()` functions (#4440) (@matyhtf)

### Enhancements

- Migrated the admin api from ext-swoole_plus into ext-swoole (#4441) (@matyhtf)
- Added the get_composer_packages command to the admin server (swoole/library@07763f46) (swoole/library@8805dc05) (swoole/library@175f1797) (@sy-records) (@yunbaoi)
- Added POST method request restrictions for write operations (swoole/library@ac16927c) (@yunbaoi)
- The admin server supports retrieving class method information (swoole/library@690a1952) (@djw1028769140) (@sy-records)
- Improved admin server code (swoole/library#128) (swoole/library#131) (@sy-records)
- The admin server supports concurrent requests to multiple targets and concurrent requests to multiple APIs (swoole/library#124) (@sy-records)
- The admin server supports retrieving interface information (swoole/library#130) (@sy-records)
- SWOOLE_HOOK_CURL supports CURLOPT_HTTPPROXYTUNNEL (swoole/library#126) (@sy-records)

### Fixes

- The join method forbids concurrent calls on the same coroutine (#4442) (@matyhtf)
- Fixed the Table atomic lock being released unexpectedly (#4446) (@Txhua) (@matyhtf)
- Fixed missing helper options (swoole/library#123) (@sy-records)
- Fixed incorrect parameters in the get_static_property_value command (swoole/library#129) (@sy-records)

## v4.8.0

### Backward-Incompatible Changes

- In base mode, the onStart callback will always fire when the first worker process (worker id 0) starts, before onWorkerStart runs (#4389) (@matyhtf)

### New APIs

- Added the `Co::getStackUsage()` method (#4398) (@matyhtf) (@twose)
- Added some APIs to `Coroutine\Redis` (#4390) (@chrysanthemum)
- Added the `Table::stats()` method (#4405) (@matyhtf)
- Added the `Coroutine::join()` method (#4406) (@matyhtf)

### New Features

- Support for server command (#4389) (@matyhtf)
- Support for the `Server::onBeforeShutdown` event callback (#4415) (@matyhtf)

### Enhancements

- Set an error code when Websocket pack fails (swoole/swoole-src@d27c5a5) (@matyhtf)
- Added the `Timer::exec_count` field (#4402) (@matyhtf)
- hook mkdir supports the open_basedir ini setting (#4407) (@NathanFreeman)
- Added the vendor_init.php script to the library (swoole/library@6c40b02) (@matyhtf)
- SWOOLE_HOOK_CURL supports CURLOPT_UNIX_SOCKET_PATH (swoole/library#121) (@sy-records)
- Client supports setting the ssl_ciphers configuration option (#4432) (@amuluowin)
- Added some new information to `Server::stats()` (#4410) (#4412) (@matyhtf)

### Fixes

- Fixed unnecessary URL decoding of file names during file uploads (swoole/swoole-src@a73780e) (@matyhtf)
- Fixed the HTTP2 max_frame_size issue (#4394) (@twose)
- Fixed curl_multi_select bug #4393 (#4418) (@matyhtf)
- Fixed missing coroutine options (#4425) (@sy-records)
- Fixed connections being unable to close when the send buffer is full (swoole/swoole-src@2198378) (@matyhtf)

## v4.7.1

### Enhancements

- `System::dnsLookup` supports querying `/etc/hosts` (#4341) (#4349) (@zmyWL) (@NathanFreeman)
- Added boost context support for mips64 (#4358) (@dixyes)
- `SWOOLE_HOOK_CURL` supports the `CURLOPT_RESOLVE` option (swoole/library#107) (@sy-records)
- `SWOOLE_HOOK_CURL` supports the `CURLOPT_NOPROGRESS` option (swoole/library#117) (@sy-records)
- Added boost context support for riscv64 (#4375) (@dixyes)

### Fixes

- Fixed memory errors produced by PHP-8.1 on shutdown (#4325) (@twose)
- Fixed non-serializable classes in 8.1.0beta1 (#4335) (@remicollet)
- Fixed failures when multiple coroutines recursively create directories (#4337) (@NathanFreeman)
- Fixed occasional timeouts when native curl sends large files over external networks, and crashes when using coroutine file APIs inside CURL WRITEFUNCTION (#4360) (@matyhtf)
- Fixed `PDOStatement::bindParam()` expecting parameter 1 to be a string (swoole/library#116) (@sy-records)

## v4.7.0

### New APIs

- Added the `Process\Pool::detach()` method (#4221) (@matyhtf)
- `Server` supports the `onDisconnect` callback function (#4230) (@matyhtf)
- Added the `Coroutine::cancel()` and `Coroutine::isCanceled()` methods (#4247) (#4249) (@matyhtf)
- `Http\Client` supports the `http_compression` and `body_decompression` options (#4299) (@matyhtf)

### Enhancements

- Support for strict field types in the coroutine MySQL client during `prepare` (#4238) (@Yurunsoft)
- DNS supports the `c-ares` library (#4275) (@matyhtf)
- `Server` supports configuring different heartbeat check intervals for different ports when listening on multiple ports (#4290) (@matyhtf)
- The `dispatch_mode` of `Server` supports the `SWOOLE_DISPATCH_CO_CONN_LB` and `SWOOLE_DISPATCH_CO_REQ_LB` modes (#4318) (@matyhtf)
- `ConnectionPool::get()` supports the `timeout` parameter (swoole/library#108) (@leocavalcante)
- Hook Curl supports the `CURLOPT_PRIVATE` option (swoole/library#112) (@sy-records)
- Improved the function declaration of the `PDOStatementProxy::setFetchMode()` method (swoole/library#109) (@yespire)

### Fixes

- Fixed exceptions about being unable to create threads when creating large numbers of coroutines with thread context enabled (8ce5041) (@matyhtf)
- Fixed the missing php_swoole.h header file when installing Swoole (#4239) (@sy-records)
- Fixed the backward incompatibility of EVENT_HANDSHAKE (#4248) (@sy-records)
- Fixed the SW_LOCK_CHECK_RETURN macro potentially calling the function twice (#4302) (@zmyWL)
- Fixed issues with `Atomic\Long` on M1 chips (e6fae2e) (@matyhtf)
- Fixed `Coroutine\go()` losing its return value (swoole/library@1ed49db) (@matyhtf)
- Fixed `StringObject` return type issues (swoole/library#111) (swoole/library#113) (@leocavalcante) (@sy-records)

### Core

- Forbid hooking functions already disabled by PHP (#4283) (@twose)

### Tests

- Added builds for the `Cygwin` environment (#4222) (@sy-records)
- Added compilation tests for `alpine 3.13` and `3.14` (#4309) (@limingxinleo)

## v4.6.7

### Enhancements

- The Manager process and Task synchronous processes support calling the `Process::signal()` function (#4190) (@matyhtf)

### Fixes

- Fixed signals being unable to be registered repeatedly (#4170) (@matyhtf)
- Fixed compilation failures on OpenBSD/NetBSD (#4188) (#4194) (@devnexen)
- Fixed the onClose event being lost in special cases when listening for writable events (#4204) (@matyhtf)
- Fixed issues with Symfony HttpClient using native curl (#4204) (@matyhtf)
- Fixed the `Http\Response::end()` method always returning true (swoole/swoole-src@66fcc35) (@matyhtf)
- Fixed PDOExceptions produced by PDOStatementProxy (swoole/library#104) (@twose)

### Core

- Refactored the worker buffer, adding a msg id flag to event data (#4163) (@matyhtf)
- Changed the Request Entity Too Large log level to warning (#4175) (@sy-records)
- Replaced the inet_ntoa and inet_aton functions (#4199) (@remicollet)
- Changed the default value of output_buffer_size to UINT_MAX (swoole/swoole-src@46ab345) (@matyhtf)

## v4.6.6

### Enhancements

- Support for sending a SIGTERM signal to the Manager process after the Master process exits on FreeBSD (#4150) (@devnexen)
- Support for statically compiling Swoole into PHP (#4153) (@matyhtf)
- Support for SNI with HTTP proxies (#4158) (@matyhtf)

### Fixes

- Fixed errors with async connections in the synchronous client (#4152) (@matyhtf)
- Fixed memory leaks caused by hooking native curl multi (swoole/swoole-src@91bf243) (@matyhtf)

## v4.6.5

### New APIs

- Added the count method to WaitGroup (swoole/library#100) (@sy-records) (@deminy)

### Enhancements

- Support for native curl multi (#4093) (#4099) (#4101) (#4105) (#4113) (#4121) (#4147) (swoole/swoole-src@cd7f51c) (@matyhtf) (@sy-records) (@huanghantao)
- Allow setting headers with an array in the Response when using HTTP/2

### Fixes

- Fixed NetBSD builds (#4080) (@devnexen)
- Fixed OpenBSD builds (#4108) (@devnexen)
- Fixed illumos/solaris builds, member aliases only (#4109) (@devnexen)
- Fixed heartbeat checks not taking effect for SSL connections before the handshake completes (#4114) (@matyhtf)
- Fixed errors caused by `host` containing `host:port` when Http\Client uses a proxy (#4124) (@Yurunsoft)
- Fixed header and cookie settings in Swoole\Coroutine\Http::request (swoole/library#103) (@leocavalcante) (@deminy)

### Core

- Support for asm context on BSD (#4082) (@devnexen)
- Use arc4random_buf to implement getrandom on FreeBSD (#4096) (@devnexen)
- Improved the darwin arm64 context: removed the workaround and used labels (#4127) (@devnexen)

### Tests

- Added the alpine build script (#4104) (@limingxinleo)

## v4.6.4

### New APIs

- Added the Coroutine\Http::request, Coroutine\Http::post, and Coroutine\Http::get functions (swoole/library#97) (@matyhtf)

### Enhancements

- Support for ARM 64 builds (#4057) (@devnexen)
- Support for setting open_http_protocol in the Swoole TCP server (#4063) (@matyhtf)
- Support for ssl clients setting only the certificate (91704ac) (@matyhtf)
- Support for the tcp_defer_accept option on FreeBSD (#4049) (@devnexen)

### Fixes

- Fixed missing proxy authorization when using Coroutine\Http\Client (edc0552) (@matyhtf)
- Fixed memory allocation issues in Swoole\Table (3e7770f) (@matyhtf)
- Fixed crashes when Coroutine\Http2\Client makes concurrent connections (630536d) (@matyhtf)
- Fixed the enable_ssl_encrypt issue with DTLS (842733b) (@matyhtf)
- Fixed a Coroutine\Barrier memory leak (swoole/library#94) (@Appla) (@FMiS)
- Fixed offset errors caused by the order of CURLOPT_PORT and CURLOPT_URL (swoole/library#96) (@sy-records)
- Fixed errors in `Table::get($key, $field)` when the field type is float (08ea20c) (@matyhtf)
- Fixed a Swoole\Table memory leak (d78ca8c) (@matyhtf)

## v4.4.24

### Fixes

- Fixed crashes when the http2 client makes concurrent connections (#4079)

## v4.6.3

### New APIs

- Added the Swoole\Coroutine\go function (swoole/library@82f63be) (@matyhtf)
- Added the Swoole\Coroutine\defer function (swoole/library@92fd0de) (@matyhtf)

### Enhancements

- Added the compression_min_length option for the HTTP server (#4033) (@matyhtf)
- Allow setting the Content-Length HTTP header at the application layer (#4041) (@doubaokun)

### Fixes

- Fixed coredumps when the program reaches the open file limit (swoole/swoole-src@709813f) (@matyhtf)
- Fixed JIT being disabled (#4029) (@twose)
- Fixed parameter errors in `Response::create()` (swoole/swoole-src@a630b5b) (@matyhtf)
- Fixed incorrect task_worker_id reports when dispatching tasks on the ARM platform (#4040) (@doubaokun)
- Fixed coredumps with the native curl hook enabled on PHP8 (#4042)(#4045) (@Yurunsoft) (@matyhtf)
- Fixed out-of-bounds memory errors during the shutdown phase on fatal error (#4050) (@matyhtf)

### Core

- Improved ssl_connect/ssl_shutdown (#4030) (@matyhtf)
- Exit the process directly when a fatal error occurs (#4053) (@matyhtf)

## v4.6.2

### New APIs

- Added the `Http\Request\getMethod()` method (#3987) (@luolaifa000)
- Added the `Coroutine\Socket->recvLine()` method (#4014) (@matyhtf)
- Added the `Coroutine\Socket->recvWithBuffer()` method (#4017) (@matyhtf)

### Enhancements

- Enhanced the `Response\create()` method so it can be used independently of Server (#3998) (@matyhtf)
- Support for `Coroutine\Redis->hExists` returning a bool type when compatibility_mode is set (swoole/swoole-src@b8cce7c) (@matyhtf)
- Support for setting the PHP_NORMAL_READ option in `socket_read` (swoole/swoole-src@b1a0dcc) (@matyhtf)

### Fixes

- Fixed `Coroutine::defer` coredumps under PHP8 (#3997) (@huanghantao)
- Fixed `Coroutine\Socket::errCode` being set incorrectly when using thread context (swoole/swoole-src@004d08a) (@matyhtf)
- Fixed Swoole compilation failures on the latest macos (#4007) (@matyhtf)
- Fixed the php stream context being a null pointer when a url is passed as the md5_file parameter (#4016) (@ZhiyangLeeCN)

### Core

- Use the AIO thread pool to hook stdio (resolving multi-coroutine read/write issues caused by previously treating stdio as a socket) (#4002) (@matyhtf)
- Refactored HttpContext (#3998) (@matyhtf)
- Refactored `Process::wait()` (#4019) (@matyhtf)

## v4.6.1

### Enhancements

- Added the `--enable-thread-context` build option (#3970) (@matyhtf)
- Check whether the connection exists when operating on session_id (#3993) (@matyhtf)
- Enhanced CURLOPT_PROXY (swoole/library#87) (@sy-records)

### Fixes

- Fixed the minimum PHP version in pecl installation (#3979) (@remicollet)
- Fixed the missing `--enable-swoole-json` and `--enable-swoole-curl` options in pecl installation (#3980) (@sy-records)
- Fixed openssl thread-safety issues (b516d69f) (@matyhtf)
- Fixed enableSSL coredumps (#3990) (@huanghantao)

### Core

- Improved ipc writev to avoid coredumps when the event data is empty (9647678) (@matyhtf)

## v4.5.11

### Enhancements

- Improved Swoole\Table (#3959) (@matyhtf)
- Enhanced CURLOPT_PROXY (swoole/library#87) (@sy-records)

### Fixes

- Fixed Table incr and decr not being able to clear all columns (#3956) (@matyhtf) (@sy-records)
- Fixed `clock_id_t` errors produced at compile time (49fea171) (@matyhtf)
- Fixed fread bugs (#3972) (@matyhtf)
- Fixed ssl multithreaded crashes (7ee2c1a0) (@matyhtf)
- Handle invalid uri formats that caused Invalid argument supplied for foreach errors (swoole/library#80) (@sy-records)
- Fixed trigger_error parameter errors (swoole/library#86) (@sy-records)

## v4.6.0

### Backward-Incompatible Changes

- Removed the maximum limit on `session id`; it no longer repeats (#3879) (@matyhtf)
- Disable unsafe functions when using coroutines, including `pcntl_fork`/`pcntl_wait`/`pcntl_waitpid`/`pcntl_sigtimedwait` (#3880) (@matyhtf)
- Enable coroutine hooks by default (#3903) (@matyhtf)

### Removals

- PHP7.1 is no longer supported (4a963df) (9de8d9e) (@matyhtf)

### Deprecations

- Marked `Event::rshutdown()` as deprecated; please use Coroutine\run instead (#3881) (@matyhtf)

### New APIs

- Support for setPriority/getPriority (#3876) (@matyhtf)
- Support for the native-curl hook (#3863) (@matyhtf) (@huanghantao)
- Support for passing object-style parameters to Server event callbacks; object-style parameters are not passed by default (#3888) (@matyhtf)
- Support for hooking the sockets extension (#3898) (@matyhtf)
- Support for duplicate headers (#3905) (@matyhtf)
- Support for SSL sni (#3908) (@matyhtf)
- Support for hooking stdio (#3924) (@matyhtf)
- Support for the capture_peer_cert option of stream_socket (#3930) (@matyhtf)
- Added Http\Request::create/parse/isCompleted (#3938) (@matyhtf)
- Added Http\Response::isWritable (db56827) (@matyhtf)

### Enhancements

- All time precisions in Server changed from int to double (#3882) (@matyhtf)
- Check for EINTR from the poll function inside the swoole_client_select function (#3909) (@shiguangqi)
- Added coroutine deadlock detection (#3911) (@matyhtf)
- Support for closing connections from another process in SWOOLE_BASE mode (#3916) (@matyhtf)
- Improved the performance of communication between the Server master process and worker processes, reducing memory copies (#3910) (@huanghantao) (@matyhtf)

### Fixes

- Pop all data out of a Coroutine\Channel when it is closed (960431d) (@matyhtf)
- Fixed memory errors when using JIT (#3907) (@twose)
- Fixed `port->set()` dtls compilation errors (#3947) (@Yurunsoft)
- Fixed connection_list errors (#3948) (@sy-records)
- Fixed ssl verify (#3954) (@matyhtf)
- Fixed Table incr and decr not being able to clear all columns (#3956) (@matyhtf) (@sy-records)
- Fixed compilation failures with LibreSSL 2.7.5 (#3962) (@matyhtf)
- Fixed the undefined constants CURLOPT_HEADEROPT and CURLOPT_PROXYHEADER (swoole/library#77) (@sy-records)

### Core

- Ignore the SIGPIPE signal by default (9647678) (@matyhtf)
- Support for running PHP coroutines and C coroutines simultaneously (c94bfd8) (@matyhtf)
- Added the get_elapsed test (#3961) (@luolaifa000)
- Added the get_init_msec test (#3964) (@luffluo)

## v4.5.10

### Fixes

- Fixed coredumps when using Event::cycle (93901dc) (@matyhtf)
- Compatibility with PHP8 (f0dc6d3) (@matyhtf)
- Fixed connection_list errors (#3948) (@sy-records)

## v4.4.23

### Fixes

- Fixed incorrect data when Swoole\Table decrements (bcd4f60d)(0d5e72e7) (@matyhtf)
- Fixed synchronous client error messages (#3784)
- Fixed memory overflow when parsing form data boundaries (#3858)
- Fixed a channel bug where existing data could not be popped after closing

## v4.5.9

### Enhancements

- Added the SWOOLE_HTTP_CLIENT_ESTATUS_SEND_FAILED constant to Coroutine\Http\Client (#3873) (@sy-records)

### Fixes

- Compatibility with PHP8 (#3868) (#3869) (#3872) (@twose) (@huanghantao) (@doubaokun)
- Fixed the undefined constants CURLOPT_HEADEROPT and CURLOPT_PROXYHEADER (swoole/library#77) (@sy-records)
- Fixed CURLOPT_USERPWD (swoole/library@7952a7b) (@twose)

## v4.5.8

### New APIs

- Added the swoole_error_log function and improved log_rotation (swoole/swoole-src@67d2bff) (@matyhtf)
- readVector and writeVector support SSL (#3857) (@huanghantao)

### Enhancements

- Let System::wait stop blocking after the child process exits (#3832) (@matyhtf)
- DTLS supports 16K packets (#3849) (@matyhtf)
- The Response::cookie method supports the priority parameter (#3854) (@matyhtf)
- Support for more CURL options (swoole/library#71) (@sy-records)
- Handle CURL HTTP headers being overwritten due to case-insensitive name handling (swoole/library#76) (@filakhtov) (@twose) (@sy-records)

### Fixes

- Fixed EAGAIN handling errors in readv_all and writev_all (#3830) (@huanghantao)
- Fixed PHP8 compilation warnings (swoole/swoole-src@03f3fb0) (@matyhtf)
- Fixed binary-safety issues in Swoole\Table (#3842) (@twose)
- Fixed System::writeFile overwriting instead of appending files on MacOS (swoole/swoole-src@a71956d) (@matyhtf)
- Fixed CURL's CURLOPT_WRITEFUNCTION (swoole/library#74) (swoole/library#75) (@sy-records)
- Fixed memory overflow when parsing HTTP form-data (#3858) (@twose)
- Fixed `is_callable()` being unable to access private class methods in PHP8 (#3859) (@twose)

### Core

- Refactored memory allocation functions to use SwooleG.std_allocator (#3853) (@matyhtf)
- Refactored pipes (#3841) (@matyhtf)

## v4.5.7

### New APIs

- Added the writeVector, writeVectorAll, readVector, and readVectorAll methods to the Coroutine\Socket client (#3764) (@huanghantao)

### Enhancements

- Added task_worker_num and dispatch_count to server->stats (#3771) (#3806) (@sy-records) (@matyhtf)
- Added extension dependencies, including json, mysqlnd, and sockets (#3789) (@remicollet)
- Limited the minimum uid of server->bind to INT32_MIN (#3785) (@sy-records)
- Added a build option for swoole_substr_json_decode to support negative offsets (#3809) (@matyhtf)
- Support for CURL's CURLOPT_TCP_NODELAY option (swoole/library#65) (@sy-records) (@deminy)

### Fixes

- Fixed incorrect synchronous client connection information (#3784) (@twose)
- Fixed issues with the hooked scandir function (#3793) (@twose)
- Fixed errors in the coroutine barrier (swoole/library#68) (@sy-records)

### Core

- Use boost.stacktrace to improve print-backtrace (#3788) (@matyhtf)

## v4.5.6

### New APIs

- Added `swoole_substr_unserialize` and `swoole_substr_json_decode` (#3762) (@matyhtf)

### Enhancements

- Changed the `onAccept` method of `Coroutine\Http\Server` to private (dfcc83b) (@matyhtf)

### Fixes

- Fixed coverity issues (#3737) (#3740) (@matyhtf)
- Fixed some issues in the Alpine environment (#3738) (@matyhtf)
- Fixed swMutex_lockwait (0fc5665) (@matyhtf)
- Fixed PHP-8.1 installation failures (#3757) (@twose)

### Core

- Added liveness checks to `Socket::read/write/shutdown` (#3735) (@matyhtf)
- Changed the types of session_id and task_id to int64 (#3756) (@matyhtf)

## v4.5.5

> [!NOTE]
> This version adds [configuration option](/en/server/setting.html) validation: setting an option not provided by Swoole will produce a Warning.

```shell
PHP Warning:  unsupported option [foo] in @swoole-src/library/core/Server/Helper.php 
```

```php
$http = new Swoole\Http\Server('0.0.0.0', 9501);

$http->set(['foo' => 'bar']);

$http->on('request', function ($request, $response) {
    $response->header("Content-Type", "text/html; charset=utf-8");
    $response->end("<h1>Hello Swoole. #".rand(1000, 9999)."</h1>");
});

$http->start();
```

### New APIs

- Added Process\Manager and changed Process\ProcessManager to an alias (swoole/library#eac1ac5) (@matyhtf)
- Support for HTTP2 server GOAWAY (#3710) (@doubaokun)
- Added the `Co\map()` function (swoole/library#57) (@leocavalcante)

### Enhancements

- Support for the http2 unix socket client (#3668) (@sy-records)
- Set the worker process state to SW_WORKER_EXIT after the worker process exits (#3724) (@matyhtf)
- Added send_queued_bytes and recv_queued_bytes to the return value of `Server::getClientInfo()` (#3721) (#3731) (@matyhtf) (@Yurunsoft)
- Server supports the stats_file configuration option (#3725) (@matyhtf) (@Yurunsoft)

### Fixes

- Fixed compilation issues under PHP8 (zend_compile_string change) (#3670) (@twose)
- Fixed compilation issues under PHP8 (ext/sockets compatibility) (#3684) (@twose)
- Fixed compilation issues under PHP8 (php_url_encode_hash_ex change) (#3713) (@remicollet)
- Fixed the incorrect type conversion from 'const char*' to 'char*' (#3686) (@remicollet)
- Fixed the HTTP2 client not working behind an HTTP proxy (#3677) (@matyhtf) (@twose)
- Fixed data corruption during PDO reconnection after disconnection (swoole/library#54) (@sy-records)
- Fixed port parsing errors when the UDP Server uses ipv6
- Fixed the Lock::lockwait timeout not taking effect

## v4.5.4

### Backward-Incompatible Changes

- SWOOLE_HOOK_ALL includes SWOOLE_HOOK_CURL (#3606) (@matyhtf)
- Removed ssl_method and added ssl_protocols (#3639) (@Yurunsoft)

### New APIs

- Added the firstKey and lastKey methods for arrays (swoole/library#51) (@sy-records)

### Enhancements

- Added the open_websocket_ping_frame and open_websocket_pong_frame configuration options for the Websocket server (#3600) (@Yurunsoft)

### Fixes

- Fixed incorrect fseek ftell behavior when files are larger than 2G (#3619) (@Yurunsoft)
- Fixed Socket barrier issues (#3627) (@matyhtf)
- Fixed http proxy handshake issues (#3630) (@matyhtf)
- Fixed HTTP Header parsing errors when the peer sends chunked data (#3633) (@matyhtf)
- Fixed zend_hash_clean assertion failures (#3634) (@twose)
- Fixed broken fds being unable to be removed from the event loop (#3650) (@matyhtf)
- Fixed coredumps caused by receiving invalid packets (#3653) (@matyhtf)
- Fixed an array_key_last bug (swoole/library#46) (@sy-records)

### Core

- Code improvements (#3615) (#3617) (#3622) (#3635) (#3640) (#3641) (#3642) (#3645) (#3658) (@matyhtf)
- Reduced unnecessary memory operations when writing data to Swoole Table (#3620) (@matyhtf)
- Refactored AIO (#3624) (@Yurunsoft)
- Support for readlink/opendir/readdir/closedir hooks (#3628) (@matyhtf)
- Improved swMutex_create with SW_MUTEX_ROBUST support (#3646) (@matyhtf)

## v4.5.3

### New APIs

- Added `Swoole\Process\ProcessManager` (swoole/library#88f147b) (@huanghantao)
- Added ArrayObject::append and StringObject::equals (swoole/library#f28556f) (@matyhtf)
- Added [Coroutine\parallel](/en/coroutine/coroutine_api.html#parallel) (swoole/library#6aa89a9) (@matyhtf)
- Added [Coroutine\Barrier](/en/coroutine/barrier.html) (swoole/library#2988b2a) (@matyhtf)

### Enhancements

- Added usePipelineRead to support http2 client streaming (#3354) (@twose)
- The http client no longer creates the file before receiving data when downloading files (#3381) (@twose)
- The http client supports the `bind_address` and `bind_port` settings (#3390) (@huanghantao)
- The http client supports the `lowercase_header` setting (#3399) (@matyhtf)
- `Swoole\Server` supports the `tcp_user_timeout` setting (#3404) (@huanghantao)
- Added an event barrier to `Coroutine\Socket` to reduce coroutine switches (#3409) (@matyhtf)
- Added a `memory allocator` for specific swStrings (#3418) (@matyhtf)
- cURL supports `__toString` (swoole/library#38) (@twose)
- Support for setting the `wait count` directly in the WaitGroup constructor (swoole/library#2fb228b8) (@matyhtf)
- Added `CURLOPT_REDIR_PROTOCOLS` (swoole/library#46) (@sy-records)
- The http1.1 server supports trailers (#3485) (@huanghantao)
- Coroutine sleep times shorter than 1ms will yield the current coroutine (#3487) (@Yurunsoft)
- The http static handler supports symlinked files (#3569) (@LeiZhang-Hunter)
- Close the WebSocket connection immediately after Server calls the close method (#3570) (@matyhtf)
- Support for hooking stream_set_blocking (#3585) (@Yurunsoft)
- The async HTTP2 server supports flow control (#3486) (@huanghantao) (@matyhtf)
- Release the socket buffer after the onPackage callback finishes executing (#3551) (@huanghantao) (@matyhtf)

### Fixes

- Fixed WebSocket coredumps by handling protocol error states (#3359) (@twose)
- Fixed null pointer errors in the swSignalfd_setup function and the wait_signal function (#3360) (@twose)
- Fixed errors when calling `Swoole\Server::close` with dispatch_func set (#3365) (@twose)
- Fixed format_buffer initialization in the `Swoole\Redis\Server::format` function (#3369) (@matyhtf) (@twose)
- Fixed mac addresses being unavailable on MacOS (#3372) (@twose)
- Fixed MySQL test cases (#3374) (@qiqizjl)
- Fixed multiple PHP8 compatibility issues (#3384) (#3458) (#3578) (#3598) (@twose)
- Fixed the hooked socket write missing php_error_docref, timeout_event, and the return value (#3383) (@twose)
- Fixed the async Server being unable to shut down the Server inside the `WorkerStart` callback (#3382) (@huanghantao)
- Fixed possible coredumps when the heartbeat thread operates on conn->socket (#3396) (@huanghantao)
- Fixed logic issues in send_yield (#3397) (@twose) (@matyhtf)
- Fixed compilation issues on Cygwin64 (#3400) (@twose)
- Fixed the WebSocket finish property not taking effect (#3410) (@matyhtf)
- Fixed a missed MySQL transaction error state (#3429) (@twose)
- Fixed the hooked `stream_select` returning values inconsistently with its pre-hook behavior (#3440) (@Yurunsoft)
- Fixed lost `SIGCHLD` signals when using `Coroutine\System` to create child processes (#3446) (@huanghantao)
- Fixed `sendwait` not supporting SSL (#3459) (@huanghantao)
- Fixed several issues with `ArrayObject` and `StringObject` (swoole/library#44) (@matyhtf)
- Fixed incorrect mysqli exception messages (swoole/library#45) (@sy-records)
- Fixed `Swoole\Client` being unable to get the correct `errCode` when `open_eof_check` is set (#3478) (@huanghantao)
- Fixed several issues with `atomic->wait()`/`wakeup()` on MacOS (#3476) (@Yurunsoft)
- Fixed `Client::connect` returning a success status when the connection is refused (#3484) (@matyhtf)
- Fixed nullptr_t not being declared in the alpine environment (#3488) (@limingxinleo)
- Fixed double-free issues when the HTTP Client downloads files (#3489) (@Yurunsoft)
- Fixed memory leaks caused by `Server\Port` not being released when `Server` is destroyed (#3507) (@twose)
- Fixed MQTT protocol parsing issues (318e33a) (84d8214) (80327b3) (efe6c63) (@GXhua) (@sy-records)
- Fixed coredumps caused by the `Coroutine\Http\Client->getHeaderOut` method (#3534) (@matyhtf)
- Fixed error messages being lost after SSL verification failures (#3535) (@twose)
- Fixed the incorrect `Swoole benchmark` link in the README (#3536) (@sy-records) (@santalex)
- Fixed `header` injection caused by using `CRLF` in `HTTP header/cookie` (#3539) (#3541) (#3545) (@chromium1337) (@huanghantao)
- Fixed the variable error mentioned in issue #3463 (#3547) (chromium1337) (@huanghantao)
- Fixed the typo mentioned in pr #3463 (#3547) (@deminy)
- Fixed empty frame->fd in the coroutine WebSocket server (#3549) (@huanghantao)
- Fixed connection leaks caused by the heartbeat thread misjudging connection states (#3534) (@matyhtf)
- Fixed blocked signals in `Process\Pool` (#3582) (@huanghantao) (@matyhtf)
- Fixed issues with sending headers in `SAPI` (#3571) (@twose) (@sshymko)
- Fixed `errCode` and `errMsg` not being set when `CURL` execution fails (swoole/library#1b6c65e) (@sy-records)
- Fixed `swoole_socket_coro` accept coredumps after calling the `setProtocol` method (#3591) (@matyhtf)

### Core

- Use C++ style (#3349) (#3351) (#3454) (#3479) (#3490) (@huanghantao) (@matyhtf)
- Added `Swoole known strings` to improve the performance of reading properties on `PHP` objects (#3363) (@huanghantao)
- Multiple code improvements (#3350) (#3356) (#3357) (#3423) (#3426) (#3461) (#3463) (#3472) (#3557) (#3583) (@huanghantao) (@twose) (@matyhtf)
- Multiple test code improvements (#3416) (#3481) (#3558) (@matyhtf)
- Simplified the `int` type of `Swoole\Table` (#3407) (@matyhtf)
- Added `sw_memset_zero` and replaced the `bzero` function (#3419) (@CismonX)
- Improved the logging module (#3432) (@matyhtf)
- Multiple libswoole refactorings (#3448) (#3473) (#3475) (#3492) (#3494) (#3497) (#3498) (#3526) (@matyhtf)
- Multiple header include refactorings (#3457) (@matyhtf) (@huanghantao)
- Added `Channel::count()` and `Channel::get_bytes()` (f001581) (@matyhtf)
- Added `scope guard` (#3504) (@huanghantao)
- Added libswoole coverage tests (#3431) (@huanghantao)
- Added lib-swoole/ext-swoole tests for the MacOS environment (#3521) (@huanghantao)
- Added lib-swoole/ext-swoole tests for the Alpine environment (#3537) (@limingxinleo)

## v4.5.2

[v4.5.2](https://github.com/swoole/swoole-src/releases/tag/v4.5.2) is a bug fix release with no backward-incompatible changes

### Enhancements

- Support for `Server->set(['log_rotation' => SWOOLE_LOG_ROTATION_DAILY])` to generate logs by date (#3311) (@matyhtf)
- Support for `swoole_async_set(['wait_signal' => true])`; the reactor will not exit while signal listeners exist (#3314) (@matyhtf)
- Support for `Server->sendfile` sending empty files (#3318) (@twose)
- Improved worker busy/idle warning messages (#3328) (@huanghantao)
- Improved the Host header configuration behind HTTPS proxies (configured using ssl_host_name) (#3343) (@twose)
- SSL uses ecdh auto mode by default (#3316) (@matyhtf)
- SSL clients exit silently when the connection is disconnected (#3342) (@huanghantao)

### Fixes

- Fixed `Server->taskWait` issues on the OSX platform (#3330) (@matyhtf)
- Fixed MQTT protocol parsing bugs (8dbf506b) (@guoxinhua) (2ae8eb32) (@twose)
- Fixed Content-Length int type overflow (#3346) (@twose)
- Fixed the missing PRI packet length check (#3348) (@twose)
- Fixed CURLOPT_POSTFIELDS being unable to be set empty (swoole/library@ed192f64) (@twose)
- Fixed the latest connection object being unable to be released before the next connection is received (swoole/library@1ef79339) (@twose)

### Core

- Socket write zero-copy feature (#3327) (@twose)
- Use swoole_get_last_error/swoole_set_last_error instead of reading and writing global variables (e25f262a) (@matyhtf) (#3315) (@huanghantao)

## v4.5.1

[v4.5.1](https://github.com/swoole/swoole-src/releases/tag/v4.5.1) is a bug fix release that adds the deprecation markers for the System file functions that should have been introduced in `v4.5.0`

### Enhancements

- Support for the bindto setting of socket_context under hooks (#3275) (#3278) (@codinghuang)
- Support for automatic dns resolution of addresses in client::sendto (#3292) (@codinghuang)
- Process->exit(0) will now cause the process to exit immediately; to run shutdown_functions before exiting, use the exit provided by PHP (a732fe56) (@matyhtf)
- Support for configuring `log_date_format` to change the log date format, and `log_date_with_microseconds` to display microsecond timestamps in logs (baf895bc) (@matyhtf)
- Support for CURLOPT_CAINFO and CURLOPT_CAPATH (swoole/library#32) (@sy-records)
- Support for CURLOPT_FORBID_REUSE (swoole/library#33) (@sy-records)

### Fixes

- Fixed build failures on 32-bit systems (#3276) (#3277) (@remicollet) (@twose)
- Fixed the coroutine Client missing the EISCONN error message on repeated connections (#3280) (@codinghuang)
- Fixed potential bugs in the Table module (d7b87b65) (@matyhtf)
- Fixed null pointers in Server caused by undefined behavior (defensive programming) (#3304) (#3305) (@twose)
- Fixed null pointer errors produced after enabling the heartbeat configuration (#3307) (@twose)
- Fixed mysqli configuration not taking effect (swoole/library#35)
- Fixed parsing of non-standard headers (missing spaces) in responses (swoole/library#27) (@Yurunsoft)

### Deprecations

- Marked methods such as Coroutine\System::(fread/fgets/fwrite) as deprecated (please use the hook feature instead and call the file functions provided by PHP directly) (c7c9bb40) (@twose)

### Core

- Use zend_object_alloc to allocate memory for custom objects (cf1afb25) (@twose)
- Some improvements; added more configuration options to the logging module (#3296) (@matyhtf)
- Extensive code improvements and added unit tests (swoole/library) (@deminy)

## v4.5.0

[v4.5.0](https://github.com/swoole/swoole-src/releases/tag/v4.5.0) is a major version update that only removes some modules already marked deprecated in v4.4.x

### New APIs

- DTLS support: this feature can now be used to build WebRTC applications (#3188) (@matyhtf)
- Built-in `FastCGI` client, which can proxy requests to FPM or call FPM applications with a single line of code (swoole/library#17) (@twose)
- `Co::wait`, `Co::waitPid` (for reaping child processes), `Co::waitSignal` (for waiting on signals) (#3158) (@twose)
- `Co::waitEvent` (for waiting on specified events occurring on a socket) (#3197) (@twose)
- `Co::set(['exit_condition' => $callable])` (for customizing the program exit condition) (#2918) (#3012) (@twose)
- `Co::getElapsed` (gets coroutine runtime for analysis/statistics or finding zombie coroutines) (#3162) (@doubaokun)
- `Socket::checkLiveness` (determines whether a connection is alive via a system call), `Socket::peek` (peeks at the read buffer) (#3057) (@twose)
- `Socket->setProtocol(['open_fastcgi_protocol' => $bool])` (built-in FastCGI unpacking support) (#3103) (@twose)
- `Server::get(Master|Manager|Worker)Pid`, `Server::getWorkerId` (gets the async Server singleton and its information) (#2793) (#3019) (@matyhtf)
- `Server::getWorkerStatus` (gets the worker process state, returning the constants SWOOLE_WORKER_BUSY or SWOOLE_WORKER_IDLE to indicate busy/idle status) (#3225) (@matyhtf)
- `Server->on('beforeReload', $callable)` and `Server->on('afterReload', $callable)` (service reload events, occurring in the manager process) (#3130) (@hantaohuang)
- The `Http\Server` static file handler now supports the `http_index_files` and `http_autoindex` settings (#3171) (@hantaohuang)
- The `Http2\Client->read(float $timeout = -1)` method supports reading streaming responses (#3011) (#3117) (@twose)
- `Http\Request->getContent` (an alias of the rawContent method) (#3128) (@hantaohuang)
- `swoole_mime_type_(add|set|delete|get|exists)()` (mime-related APIs for adding, deleting, querying, and modifying built-in mime types) (#3134) (@twose)

### Enhancements

- Improved memory copying between master and worker processes (up to four times the performance in extreme cases) (#3075) (#3087) (@hantaohuang)
- Improved WebSocket dispatch logic (#3076) (@matyhtf)
- Removed one memory copy when constructing WebSocket frames (#3097) (@matyhtf)
- Improved the SSL verification module (#3226) (@matyhtf)
- Separated SSL accept from SSL handshake, resolving coroutine servers appearing frozen due to slow SSL clients (#3214) (@twose)
- Support for the MIPS architecture (#3196) (@ekongyun)
- UDP clients can now automatically resolve passed-in domain names (#3236) (#3239) (@huanghantao)
- Coroutine\Http\Server added support for some commonly used options (#3257) (@twose)
- Support for setting cookies during the WebSocket handshake (#3270) (#3272) (@twose)
- Support for CURLOPT_FAILONERROR (swoole/library#20) (@sy-records)
- Support for CURLOPT_SSLCERTTYPE, CURLOPT_SSLCERT, CURLOPT_SSLKEYTYPE, CURLOPT_SSLKEY (swoole/library#22) (@sy-records)
- Support for CURLOPT_HTTPGET (swoole/library@d730bd08) (@shiguangqi)

### Removals

- Removed the `Runtime::enableStrictMode` method (b45838e3) (@twose)
- Removed the `Buffer` class (559a49a8) (@twose)

### Core

- New C++ API: pass a lambda to the coroutine::async function to launch an async thread task (#3127) (@matyhtf)
- Refactored the integer fd in the underlying event-API into swSocket objects (#3030) (@matyhtf)
- All core C files have been converted to C++ files (#3030) (71f987f3) (@matyhtf)
- A series of code improvements (#3063) (#3067) (#3115) (#3135) (#3138) (#3139) (#3151) (#3168) (@hantaohuang)
- Header file normalization improvements (#3051) (@matyhtf)
- Refactored the `enable_reuse_port` configuration option to make it more standard (#3192) (@matyhtf)
- Refactored Socket-related APIs to make them more standard (#3193) (@matyhtf)
- Eliminated one unnecessary system call through buffer prediction (3b5aa85d) (@matyhtf)
- Removed the underlying refresh timer swServerGS::now, using time functions directly to get the time (#3152) (@hantaohuang)
- Improved the protocol configurator (#3108) (@twose)
- More compatible C struct initialization syntax (#3069) (@twose)
- Unified bit fields to the uchar type (#3071) (@twose)
- Support for parallel tests, which are faster (#3215) (@twose)

### Fixes

- Fixed onConnect not firing when enable_delay_receive is enabled (#3221) (#3224) (@matyhtf)
- All other bug fixes have been merged into the v4.4.x branch and are reflected in its changelog, so they are not repeated here

## v4.4.22

### Fixes

- Fixed the HTTP2 client not working behind an HTTP proxy (#3677) (@matyhtf) (@twose)
- Fixed data corruption during PDO reconnection after disconnection (swoole/library#54) (@sy-records)
- Fixed swMutex_lockwait (0fc5665) (@matyhtf)
- Fixed port parsing errors when the UDP Server uses ipv6
- Fixed systemd fds issues

## v4.4.20

[v4.4.20](https://github.com/swoole/swoole-src/releases/tag/v4.4.20) is a bug fix release with no backward-incompatible changes

### Fixes

- Fixed errors when calling `Swoole\Server::close` with dispatch_func set (#3365) (@twose)
- Fixed format_buffer initialization in the `Swoole\Redis\Server::format` function (#3369) (@matyhtf) (@twose)
- Fixed mac addresses being unavailable on MacOS (#3372) (@twose)
- Fixed MySQL test cases (#3374) (@qiqizjl)
- Fixed the async Server being unable to shut down the Server inside the `WorkerStart` callback (#3382) (@huanghantao)
- Fixed a missed MySQL transaction error state (#3429) (@twose)
- Fixed double-free issues when the HTTP Client downloads files (#3489) (@Yurunsoft)
- Fixed coredumps caused by the `Coroutine\Http\Client->getHeaderOut` method (#3534) (@matyhtf)
- Fixed `header` injection caused by using `CRLF` in `HTTP header/cookie` (#3539) (#3541) (#3545) (@chromium1337) (@huanghantao)
- Fixed empty frame->fd in the coroutine WebSocket server (#3549) (@huanghantao)
- Fixed `read error on connection` issues caused by hooking phpredis (#3579) (@twose)
- Fixed MQTT protocol parsing issues (#3573) (#3517) (9ad2b455) (@GXhua) (@sy-records)

## v4.4.19

[v4.4.19](https://github.com/swoole/swoole-src/releases/tag/v4.4.19) is a bug fix release with no backward-incompatible changes

> [!NOTE]
> Note: v4.4.x is no longer the primary maintained version; bugs are fixed only when necessary

### Fixes

- Merged all bug fix patches from v4.5.2

## v4.4.18

[v4.4.18](https://github.com/swoole/swoole-src/releases/tag/v4.4.18) is a bug fix release with no backward-incompatible changes

### Enhancements

- UDP clients can now automatically resolve passed-in domain names (#3236) (#3239) (@huanghantao)
- stdout and stderr are no longer closed in CLI mode (to display error logs produced after shutdown) (#3249) (@twose)
- Coroutine\Http\Server added support for some commonly used options (#3257) (@twose)
- Support for setting cookies during the WebSocket handshake (#3270) (#3272) (@twose)
- Support for CURLOPT_FAILONERROR (swoole/library#20) (@sy-records)
- Support for CURLOPT_SSLCERTTYPE, CURLOPT_SSLCERT, CURLOPT_SSLKEYTYPE, CURLOPT_SSLKEY (swoole/library#22) (@sy-records)
- Support for CURLOPT_HTTPGET (swoole/library@d730bd08) (@shiguangqi)
- Compatibility with all PHP-Redis extension versions where possible (constructor parameters differ across versions) (swoole/library#24) (@twose)
- Forbid cloning connection objects (swoole/library#23) (@deminy)

### Fixes

- Fixed SSL handshake failures (dc5ac29a) (@twose)
- Fixed memory errors when generating error messages (#3229) (@twose)
- Fixed blank proxy authentication information (#3243) (@twose)
- Fixed Channel memory leak issues (not an actual memory leak) (#3260) (@twose)
- Fixed a one-time memory leak in Co\Http\Server with circular references (#3271) (@twose)
- Fixed a typo in `ConnectionPool->fill` (swoole/library#18) (@NHZEX)
- Fixed the curl client not updating the connection when encountering redirects (swoole/library#21) (@doubaokun)
- Fixed null pointers when ioExceptions occur (swoole/library@4d15a4c3) (@twose)
- Fixed deadlocks caused by ConnectionPool@put not returning a new connection when passed null (swoole/library#25) (@Sinute)
- Fixed write_property errors caused by the mysqli proxy implementation (swoole/library#26) (@twose)

## v4.4.17

[v4.4.17](https://github.com/swoole/swoole-src/releases/tag/v4.4.17) is a bug fix release with no backward-incompatible changes

### Enhancements

- Improved SSL server performance (#3077) (85a9a595) (@matyhtf)
- Removed the HTTP header size limit (#3187) (@twose)
- Support for MIPS (#3196) (@ekongyun)
- Support for CURLOPT_HTTPAUTH (swoole/library@570318be) (@twose)

### Fixes

- Fixed package_length_func behavior and a possible one-time memory leak (#3111) (@twose)
- Fixed incorrect behavior with HTTP status code 304 (#3118) (#3120) (@twose)
- Fixed memory errors caused by incorrect macro expansion in Trace logs (#3142) (@twose)
- Fixed OpenSSL function signatures (#3154) (#3155) (@twose)
- Fixed SSL error messages (#3172) (@matyhtf) (@twose)
- Fixed compatibility under PHP-7.4 (@twose) (@matyhtf)
- Fixed HTTP-chunk length parsing errors (19a1c712) (@twose)
- Fixed multipart request parser behavior in chunked mode (3692d9de) (@twose)
- Fixed ZEND_ASSUME assertion failures in PHP-Debug mode (fc0982be) (@twose)
- Fixed incorrect Socket addresses (d72c5e3a) (@twose)
- Fixed Socket getname (#3177) (#3179) (@matyhtf)
- Fixed the static file handler's incorrect handling of empty files (#3182) (@twose)
- Fixed Coroutine\Http\Server file upload issues (#3189) (#3191) (@twose)
- Fixed possible memory errors during shutdown (44aef60a) (@matyhtf)
- Fixed Server->heartbeat (#3203) (@matyhtf)
- Fixed the CPU scheduler possibly failing to schedule infinite loops (#3207) (@twose)
- Fixed invalid write operations on immutable arrays (#3212) (@twose)
- Fixed WaitGroup multiple wait issues (swoole/library@537a82e1) (@twose)
- Fixed handling of empty headers (consistent with cURL) (swoole/library@7c92ed5a) (@twose)
- Fixed exceptions thrown when non-IO methods return false (swoole/library@f6997394) (@twose)
- Fixed the proxy port number being added to headers multiple times when using a proxy under cURL-hook (swoole/library@5e94e5da) (@twose)

## v4.4.16

[v4.4.16](https://github.com/swoole/swoole-src/releases/tag/v4.4.16) is a bug fix release with no backward-incompatible changes

### Enhancements

- You can now view the [Swoole version support information](https://github.com/swoole/swoole-src/blob/master/SUPPORTED.md)
- Friendlier error messages (0412f442) (09a48835) (@twose)
- Prevent getting stuck in system call infinite loops on certain special systems (069a0092) (@matyhtf)
- Added driver options to PDOConfig (swoole/library#8) (@jcheron)

### Fixes

- Fixed http2_session.default_ctx memory errors (bddbb9b1) (@twose)
- Fixed uninitialized http_context (ce77c641) (@twose)
- Fixed a typo in the Table module (which could cause memory errors) (db4eec17) (@twose)
- Fixed potential task-reload issues in Server (e4378278) (@GXhua)
- Fixed incomplete raw requests in the coroutine HTTP server (#3079) (#3085) (@hantaohuang)
- Fixed the static handler (a 404 response should not be returned when the file is empty) (#3084) (@Yurunsoft)
- Fixed the http_compression_level configuration not working properly (16f9274e) (@twose)
- Fixed null pointer errors in the Coroutine HTTP2 Server caused by no registered handle (ed680989) (@twose)
- Fixed the socket_dontwait configuration not working (27589376) (@matyhtf)
- Fixed zend::eval possibly being executed multiple times (#3099) (@GXhua)
- Fixed null pointer errors in the HTTP2 server caused by responding after the connection is closed (#3110) (@twose)
- Fixed improper adaptation of PDOStatementProxy::setFetchMode (swoole/library#13) (@jcheron)