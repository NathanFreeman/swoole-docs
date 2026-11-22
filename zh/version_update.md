---
outline: 2
---

# 版本更新记录

## 版本类型

* `alpha` 特性预览版本，表示开发计划中的任务已完成，进行开放预览，可能会存在较多`BUG`
* `beta` 测试版本，表示已经可以用于开发环境测试，可能存在`BUG`
* `rc[1-n]` 候选发布版本，表示进入发布周期，正在做大范围的测试，在此期间仍可能发现`BUG`
* 无后缀即代表稳定版，表示此版本已开发完毕，可正式投入使用

## 查看当前版本信息

```shell
php --ri swoole
```

## v6.2.1
### Bug修复
- 修复超时配置错误：解决了当设置 `max_idle_time` 时，写超时误用了读超时时间的问题。
- 修复异步重载警告：消除了在异步重载期间，因旧进程退出而触发的无效警告。
- 重构进程管理：对服务器进程管理逻辑进行了重构。
- 优化 Fork 失败处理：改进了子进程 `fork` 失败后的应对机制。新增重试逻辑，在每次重试前等待 1 秒，以避免产生过多的错误日志。
- 修复数据竞争问题：将底层 `Connection` 结构体中的 `closed` 字段改为原子操作，解决了潜在的数据竞争风险。
- 修复整型溢出：修复了 Redis 服务端中的一个整型溢出问题。
- 更换通信机制：将线程池中子线程与主线程之间的通信方式从 `Pipe` 改为 `UnixSocket`。
- 支持 Curl 协程化：在 `curl` 协程化场景下，文件上传和下载操作现已被替换为协程化的实现。
- 优化阻塞函数检测：增强了 `tracker observer` 检测阻塞函数的能力。
- 适配单元测试：在单元测试中，针对不同操作系统更新了 IP 地址查询功能。
- 新增 PDO 异步方法：为 `pdo_pgsql` 增加了异步方法 `PQsendClosePrepared`，用于关闭已存在的预处理语句。
- 数据库连接池优化：新增了对多种因数据库连接断开而需重连的错误信息的识别与处理。

## v6.2.0
### 新特性
- 新增协程化`FTP`客户端，现通过编译时加入`--enable-swoole-ftp`选项，即可启用`FTP`操作的协程化支持，避免网络阻塞
- 新增协程化`SSH`客户端，现通过编译时加入`--with-swoole-ssh2`选项，即可启用`SSH`操作的协程化支持，提升并发效率
- 新增`HTTP`协程服务端支持`io_uring`，`HTTP`协程服务端现可选用高性能的`io_uring`事件机制。在编译时加入`--enable-uring_socket`选项即可启用，以获得更优的 I/O 性能
- 新增`Swoole\RemoteObject\Server`模块，为`MongoDB`提供透明化的协程操作支持
- 新增`Swoole\Coroutine::setTimeLimit()`函数，用于控制协程执行超时时间，防止协程长时间占用资源
- 为`HTTP`静态文件服务器添加`URL`重写支持
- 新增对`pdo_firebird`的协程化支持
- 支持`PHP 8.5`
- 支持协程化` gethostbyname`函数
- 优化`Server::shutdown()`的实现，在`Process`模式下将信号通信替换为管道通信
- 在 Swoole 的 HTTP 服务器（包括 Swoole\Http\Server、Swoole\Http2\Server 和 Swoole\Coroutine\Http\Server）的回调函数中，Swoole\Http\Request 对象的 server 属性新增了 server_addr 字段，该字段用于标识服务端的 IP 地址
- Swoole\Coroutine::cancel 现支持取消所有`iouring`操作

> `SSH`、`FTP`协程客户端与`PHP`的`ext-ssh`、`ext-ftp`无法共存，若要开启此项特性，需禁用`PHP`的`ssh`和`ftp`扩展

### Bug修复
- 修复 HTTP2 服务器会话（session）在多线程环境下发生多次释放的问题
- 修复在`8.5`版本中，子进程`fork`或者子线程生成后需执行`refresh_memory_manager()`，否则将导致程序崩溃的问题
- 修复`macOS`系统中`swoole_get_local_mac`函数无法正常工作的问题
- 修复了在多线程环境下用户手动挂起协程时可能引发的崩溃问题
- 修复在 Alpine 系统下的编译错误
- 修复函数钩子（hook）调用失败时的内存泄漏问题
- 修复`pdo_sqlite`和`pdo_oci`协程化过程中的线程安全问题
- 修复 `sw_php_print_backtrace` 函数，使其输出与 PHP 内置函数的回溯信息格式保持一致
- 修复因启用 --enable-uring-socket、--enable-trace-log 和 --enable-error-log 导致的编译失败问题
- 修复因为宏定义不存在的问题，导致`pdo_firebird`无法编译的问题

### 优化
- 执行`php --ri swoole`会输出`libpq`的版本信息
- 优化文件协程化操作中的`io_uring`相关逻辑
- 在添加事件失败时输出 PHP 调用堆栈信息
- 优化 `swoole_get_local_ip` 和 `swoole_get_local_mac` 函数的实现代码
- 优化文件锁的协程化等待时间，避免指数递增的睡眠时间导致锁越来越难获取
- 提升了对`Android`平台的兼容性

### 注意
- 移除了`--enable-openssl`编译选项，现在默认包含对`OpenSSL`的支持
- `--enable-uring-socket`需要明确指定`--enable-iouring`或者`--with-liburing-dir`其中一个
- 不再支持`PHP8.1`
- `liburing`要求的最低版本是2.8

## v6.2.0-rc2
### 新特性
- 新增协程化`FTP`客户端，现通过编译时加入`--enable-swoole-ftp`选项，即可启用`FTP`操作的协程化支持，避免网络阻塞
- 新增协程化`SSH`客户端，现通过编译时加入`--enable-swoole-ssh`选项，即可启用`SSH`操作的协程化支持，提升并发效率
- 新增`HTTP`协程服务端支持`io_uring`，`HTTP`协程服务端现可选用高性能的`io_uring`事件机制。在编译时加入`--enable-uring_socket`选项即可启用，以获得更优的 I/O 性能
- 新增`Swoole\RemoteObject\Server`模块，为`MongoDB`提供透明化的协程操作支持
- 新增`Swoole\Coroutine::setTimeLimit()`函数，用于控制协程执行超时时间，防止协程长时间占用资源
- 为`HTTP`静态文件服务器添加`URL`重写支持
- 新增对`pdo_firebird`的协程化支持
- 支持`PHP 8.5`
- 支持协程化` gethostbyname`函数
- 优化`Server::shutdown()`的实现，在`Process`模式下将信号通信替换为管道通信
- 在 Swoole 的 HTTP 服务器（包括 Swoole\Http\Server、Swoole\Http2\Server 和 Swoole\Coroutine\Http\Server）的回调函数中，Swoole\Http\Request 对象的 server 属性新增了 server_addr 字段，该字段用于标识服务端的 IP 地址
- Swoole\Coroutine::cancel 现支持取消所有`iouring`操作

> `SSH`、`FTP`协程客户端与`PHP`的`ext-ssh`、`ext-ftp`无法共存，若要开启此项特性，需禁用`PHP`的`ssh`和`ftp`扩展

### Bug修复
- 修复 HTTP2 服务器会话（session）在多线程环境下发生多次释放的问题
- 修复在`8.5`版本中，子进程`fork`或者子线程生成后需执行`refresh_memory_manager()`，否则将导致程序崩溃的问题
- 修复`macOS`系统中`swoole_get_local_mac`函数无法正常工作的问题
- 修复了在多线程环境下用户手动挂起协程时可能引发的崩溃问题
- 修复在 Alpine 系统下的编译错误
- 修复函数钩子（hook）调用失败时的内存泄漏问题
- 修复`pdo_sqlite`和`pdo_oci`协程化过程中的线程安全问题
- 修复 `sw_php_print_backtrace` 函数，使其输出与 PHP 内置函数的回溯信息格式保持一致
- 修复因启用 --enable-uring-socket、--enable-trace-log 和 --enable-error-log 导致的编译失败问题
- 修复因为宏定义不存在的问题，导致`pdo_firebird`无法编译的问题

### 优化
- 执行`php --ri swoole`会输出`libpq`的版本信息
- 优化文件协程化操作中的`io_uring`相关逻辑
- 在添加事件失败时输出 PHP 调用堆栈信息
- 优化 `swoole_get_local_ip` 和 `swoole_get_local_mac` 函数的实现代码
- 优化文件锁的协程化等待时间，避免指数递增的睡眠时间导致锁越来越难获取
- 提升了对`Android`平台的兼容性

### 注意
- 移除了`--enable-openssl`编译选项，现在默认包含对`OpenSSL`的支持
- `--enable-uring-socket`需要明确指定`--enable-iouring`或者`--with-liburing-dir`其中一个
- 不再支持`PHP8.1`
- `Swoole6.2.0RC2`目前是测试版本，只能在测试环境使用，禁止在生产环境使用

## v6.2.0-rc1
### 新特性
- 新增协程化`FTP`客户端，现通过编译时加入`--enable-swoole-ftp`选项，即可启用`FTP`操作的协程化支持，避免网络阻塞
- 新增协程化`SSH`客户端，现通过编译时加入`--enable-swoole-ssh`选项，即可启用`SSH`操作的协程化支持，提升并发效率
- 新增`HTTP`协程服务端支持`io_uring`，`HTTP`协程服务端现可选用高性能的`io_uring`事件机制。在编译时加入`--enable-uring_socket`选项即可启用，以获得更优的 I/O 性能
- 新增`Swoole\RemoteObject\Server`模块，为`MongoDB`提供透明化的协程操作支持
- 新增`Swoole\Coroutine::setTimeLimit()`函数，用于控制协程执行超时时间，防止协程长时间占用资源
- 为`HTTP`静态文件服务器添加`URL`重写支持
- 新增对`pdo_firebird`的协程化支持
- 支持`PHP 8.5`
- 支持协程化` gethostbyname`函数
- 优化`Server::shutdown()`的实现，在`Process`模式下将信号通信替换为管道通信
- 在 Swoole 的 HTTP 服务器（包括 Swoole\Http\Server、Swoole\Http2\Server 和 Swoole\Coroutine\Http\Server）的回调函数中，Swoole\Http\Request 对象的 server 属性新增了 server_addr 字段，该字段用于标识服务端的 IP 地址

> `SSH`、`FTP`协程客户端与`PHP`的`ext-ssh`、`ext-ftp`无法共存，若要开启此项特性，需禁用`PHP`的`ssh`和`ftp`扩展

### Bug修复
- 修复 HTTP2 服务器会话（session）在多线程环境下发生多次释放的问题
- 修复在`8.5`版本中，子进程`fork`或者子线程生成后需执行`refresh_memory_manager()`，否则将导致程序崩溃的问题
- 修复`macOS`系统中`swoole_get_local_mac`函数无法正常工作的问题
- 修复了在多线程环境下用户手动挂起协程时可能引发的崩溃问题
- 修复在 Alpine 系统下的编译错误
- 修复函数钩子（hook）调用失败时的内存泄漏问题
- 修复`pdo_sqlite`和`pdo_oci`协程化过程中的线程安全问题
- 修复 `sw_php_print_backtrace` 函数，使其输出与 PHP 内置函数的回溯信息格式保持一致

### 优化
- 执行`php --ri swoole`会输出`libpq`的版本信息
- 优化文件协程化操作中的`io_uring`相关逻辑
- 在添加事件失败时输出 PHP 调用堆栈信息
- 优化 `swoole_get_local_ip` 和 `swoole_get_local_mac` 函数的实现代码
- 优化文件锁的协程化等待时间，避免指数递增的睡眠时间导致锁越来越难获取
- 提升了对`Android`平台的兼容性

### 注意
- 移除了`--enable-openssl`编译选项，现在默认包含对`OpenSSL`的支持
- `--enable-uring-socket`需要明确指定`--enable-iouring`或者`--with-liburing-dir`其中一个
- 不再支持`PHP8.1`
- `Swoole6.2.0RC1`目前是测试版本，只能在测试环境使用，禁止在生产环境使用

## v6.1.8
### Bug 修复
- 修复当设置 `max_idle_time` 时，写超时错误地使用了读超时时间的问题。
- 修复异步重载期间因旧进程退出而导致的无效警告。
- 重构服务器进程管理逻辑。
- 优化进程 fork 失败后的处理：增加重试机制，并在重试前等待 1 秒，避免产生过多错误日志。
- 将底层 `Connection` 结构体的 `closed` 字段改为原子操作，解决潜在的数据竞争问题。
- 修复 Redis 服务端中的整型溢出问题。

## v6.1.7
### Bug 修复
- 修复了因指数退避算法配置不当，导致部分协程长期无法获取锁的问题。
- 为基于 pdo_pgsql 的协程实现增加了超时控制机制，以提升数据库操作的稳定性。
- 修复了在清空 Cookie 时，虽然指定了 Domain 和 Path 参数，但实际响应中未携带这两个属性，导致 Cookie 无法正常过期的问题。

## v6.1.6
### Bug修复
- 修复`websocket`接收连续帧时`finish`属性始终为`false`的问题。
- 修复使用`--enable-swoole-sqlite`编译选项时产生的编译警告。
- 当检测到未启用 ext-sockets 扩展时，自动从运行时钩子标志中移除 HOOK_SOCKETS。

## v6.1.5
### Bug修复
- 修复多线程环境下用户手动挂起协程的崩溃问题
- 修复`System::socket_poll()`函数添加事件失败后，错误关闭套接字的问题
- 修复`WebSocket `压缩消息帧时部分服务器环境不支持`MAX_MEM_LEVEL=9`导致解压失败的问题
- 修复`WebSocket`接收解压格式连续数据帧时，因缓冲区未及时清空而导致后续数据接收错误的问题
- 修复`pdo_oci`协程客户端处理非`PDO_PARAM_LOB`数据时的`data race`问题
### 优化
- 在`Http Server`中，当开发者设置了`Content-Encoding`头部时，`Swoole`将不再对响应体进行自动压缩，而需要由开发者自行实现压缩逻辑并输出相应内容。
### 移除
- 移除协程环境下`PDO::sqliteCreateAggregate()`、`PDO::sqliteCreateCollation()`、`PDO::sqliteCreateFunction()`函数，其实现原理是将`PHP`函数作为回调在`sqlite3`引擎中调用，这些特性仅在单线程同步阻塞模式中可用，而`Swoole`协程模式下，需要将`sqlite3`的`C`函数置于异步的`AIO`线程中运行。在`ZTS`版本中会出现读取空指针，而在`NTS`下则会出现`data race`，引起偶发崩溃的问题
- 移除`pdo_sqlite`协程客户端对`open_basedir`设置的支持，在多线程环境中无法安全读取`PG(open_basedir)`，请务必保证`sqlite3`的数据库文件路径为常量或者其他安全的路径，不可使用用户输入的参数作为`sqlite`数据库文件路径的一部分

## v6.1.4
### Bug 修复：
- 修复curl模块内存泄漏的问题。

## v6.1.3
### Bug 修复
#### HTTP/2 服务器
- **修复 Safari 浏览器兼容性问题**：解决 HTTP/2 服务器在向 Safari 浏览器发送大文件时的流量控制兼容性问题
- **修复 Date 响应头缓存的数据竞争**：解决多线程模式下 HTTP/2 服务器的 `Date` 响应头缓存存在的数据竞争问题
- **修复 `package_max_length` 配置未生效**：
    - 当接收的 `Header` 帧中 `Content-Length` 超过配置值时，服务器将返回 `413 Payload Too Large` 错误
    - 当连续接收的 `Data` 帧总长度超过配置值时,服务器将发送 `HTTP/2 RST_STREAM` 帧终止流
- **修复多线程协程模式下的内存越界**：解决多线程模式协程版 `HTTP/2` 服务器开启 `enable_reuse_port` 时发生的内存越界问题
- **修复 `TLS` 变量销毁问题**：解决多线程模式 `HTTP/2` 服务器在线程退出时 `TLS (Thread Local Storage)` 变量销毁时发生的 `double free` 问题

#### Redis 服务器
- 修复 `Redis\Server::format()` 处理大字符串出现的组包异常问题

#### WebSocket 服务器
- **修复控制帧数据污染问题**：解决 `WebSocket` 服务端自动回复的 `ping`/`pong`/`close` 控制帧因未清空缓存,导致携带前一个文本帧或二进制帧残留数据的问题

#### 多线程相关
- **修复 `swoole_get_task_tmpdir()` 数据竞争**：解决多线程环境下调用该函数时存在的数据竞争问题
- **修复运行时钩子的内存越界访问**：解决多线程环境下设置运行时钩子时触发的内存越界访问问题
    - ⚠️ **重要变更**：运行时钩子现在仅允许在主线程中设置,且必须在创建任何子线程之前完成设置

#### 平台兼容性
- **修复 FreeBSD 编译失败**：解决在 FreeBSD 系统下的编译失败问题

#### 功能增强
- **新增 Android 平台支持**：提升在 Android 平台的兼容性,现已支持在 Termux 环境下运行
- **同步 PHP 8.x curl 模块更新**：适配 PHP 8.1、8.2 及 8.3 版本中 `curl` 扩展的相关更新


**注意事项**：本次更新包含多项多线程模式下的关键修复,建议使用多线程模式的用户尽快升级。

## v6.1.2
### Bug修复：
- 设置 `socket` 接收/发送缓冲区尺寸失败时不再抛出警告
- 修复 `Swoole\Http\Server` 处理 `HTTP2` 请求时，`onClose` 回调可能先于 `onRequest` 执行，导致释放后使用（`use-after-free`）的问题
- 优化`getSocket()`方法，导出`php sockets`资源对象时复制文件描述符，避免`php sockets` 关闭时影响 `Swoole` 持有的`socket`
- 修复 `Swoole\Async\Client` 内存泄漏问题
- 修复  `IPv6` 类型 `Swoole\Coroutine\Http\Client` 无法使用 `Socks5` 代理的问题
- 同步适配 `PHP 8.4` 中 `CURL` 扩展的相关更新
- 新增 `async.file://` 文件协议，支持在未开启全局文件协程化时，对指定文件操作启用协程调度

```php
use function Swoole\Coroutine\run;

// 禁用全局文件协程化，但可通过 `async.file://` 协议对特定文件启用协程操作
Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL & ~SWOOLE_HOOK_FILE);

run(function() {
    $fp = fopen("async.file:///home/test", "r");
    fwrite($fp, "data");
    fclose($fp);

   $content = file_get_contents("async.file:///home/test.txt");
});
```

该特性用于在禁用全局文件系统协程 `HOOK`后，对部分文件操作进行异步读写调用的场景。

## v6.1.1
### Bug修复：
- 修复因为缺少`zlib`依赖导致编译失败的问题。
- 优化`curl`模块的资源管理逻辑，以规避释放后再次使用的风险。
- 修复`macos`系统没有`fdatasync`的问题。
- 优化协程死锁检测日志输出格式。

## v6.1.0
### Swoole 6.1.0 最大的几个变更

**1. 引入“标准库扩展” - 革命性的语法增强**
这是本次更新在语言层面最引人注目的特性，它允许以面向对象的方式操作基础类型。
- **基础类型对象化**：可以直接对 `string`、`array`、`stream` 等基础类型的变量调用方法（如 `$text->length()->lower()`），这极大地提升了代码的可读性和编写体验。
- **强类型数组**：引入了 `typed_array` 语法，可以定义键值类型的约束（如 `<int, string>`），在写入时进行类型检查，增强了代码的健壮性。

**2. 底层架构与稳定性的巨大飞跃**
本次版本在代码质量和稳定性上投入巨大，为未来的发展奠定了坚实基础。
- **测试覆盖率大幅提升至86%**：通过系统性地补充测试用例，极大地减少了潜在的错误，提高了整个项目的可靠性和可维护性。
- **大规模代码重构与静态分析**：重构了 Reactor、SSL、Socket 等多个核心模块，并使用 `clang-tidy` 进行代码规整，显著提升了代码质量和性能。

**3. 锁 API 的重大简化与统一**
对并发编程的核心组件——锁，进行了颠覆性的重构。
- **API 精简**：移除了 `lockwait`、`trylock` 等方法，只为 `Swoole\Coroutine\Lock`、`Swoole\Lock` 和 `Swoole\Thread\Lock` 保留 `__construct`、`lock` 和 `unlock` 三个核心方法。
- **行为统一**：新的 API 设计更贴近 PHP 原生的 `flock` 函数，降低了学习成本，并使用 `LOCK_EX | LOCK_NB` 等标准常量来实现非阻塞等高级功能。

**4. 协程能力的强化与精细化控制**
更加灵活的协程操作能力。
- **协程取消机制**：`Swoole\Coroutine::cancel()` 新增 `$throw_exception` 参数，允许在取消协程时向目标协程内抛出一个可捕获的 `Swoole\Coroutine\CanceledException`，实现了更安全、更可控的协程生命周期管理。
- **实现序列化操作的协程状态隔离**：修复协程环境下 serialize/unserialize 的全局状态隔离问题。现已在协程切换时自动保存和恢复相关全局变量，确保各协程序列化上下文互不干扰。

**5. 默认 HTTP 解析器升级，Websocket功能增强和平台兼容性改进**
在性能和兼容性方面的重要提升。
- **默认启用 llHTTP**：用性能更优、更现代的 `llhttp` 替代了旧的 `http_parser`，提升了 HTTP 处理的效率和可靠性。
- **WebSocket 功能增强**：客户端和服务端均支持了接收分块消息、主动断开连接(`disconnect`)和发送 Ping 帧(`ping`)等能力，使 WebSocket 协议的实现更加完整。
- **废弃 Select，拥抱 Poll**：彻底废弃了有严重缺陷的 `select` 事件机制，在不支持 `epoll/kqueue` 的平台上（如 Cygwin）默认使用 `poll`，从而在这些平台上也能支持大量并发连接。

### 标准库扩展

`6.1` 版本 `Swoole-Cli` 将增加 `PHP` 标准库扩展语法，在保持对 `PHP` 官方语法完整兼容的同时，提供一些额外的新语法。这些新的扩展语法均是可选的，不影响现有的`PHP`代码。标准库扩展语法将在`ext-swoole`的`stdext`模块中实现。

- `swoole-cli` 用户，可直接使用，无需设置任何额外的参数
- `ext-swoole` 的用户，需在编译时添加`--enable-swoole-stdext`来启用
- `stdext` 在 `php-cli`、`php-fpm`、`cli-http-server`、`swoole` 模式均可使用

### 础类型对象化

`6.1` 版本实现了`array`/`string`/`stream`基础类型的对象化封装，支持面向对象风格的方法调用，可直接对这些类型的变量调用内置方法。

基础类型的内置方法实际上仍然是调用`PHP`标准库实现的，内置方法与`PHP`的`str_`或`array_`系列函数是一一对应关系，例如`$text->replace()`对应的函数是`str_replace`。底层仅调整了函数名称，少量方法调整了参数顺序，还有几个方法调整了参数和返回值类型，详情请查看 [Swoole 文档](https://wiki.swoole.com/)。

```php
$text = 'Hello Swoole';
var_dump($text->length());
echo $text->lower()->replace("swoole", "php");
echo fopen("/tmp/test.log")->read(1024);
```
### Typed-Array 强类型数组

可限制数组类型，如：`Map`或`ArrayList`，以及限制`key`与`value`的类型。支持多层嵌套格式。`typed array`实际上依然是`array`类型，底层仅在写入时进行参数检查。`typed array`可作为`array`传递给其他函数或类方法。

```php
$array = typed_array('<int, string>');
$array[1000] = "hello"; // 正确
$array[2000] = 2025; // 错误，抛出异常
```

### 新特性
- **llHTTP 默认解析器**：自 v6.1.0 起，Swoole 采用性能更优的 `llhttp` 替代 `http_parser` 作为默认 HTTP 报文解析器。
- **协程化文件下载**：`Swoole\Coroutine\Http\Client` 现支持完整的协程化文件下载操作。
- **异步文件截断**：新增 `iouring ftruncate` 支持，扩展异步文件操作能力。
- `Swoole\Coroutine::cancel()` 新增 `$throw_exception` 参数，支持在取消协程时抛出异常。
- `Swoole\Coroutine\Http\Client` 与 `Swoole\Coroutine\Http\Server` 现已支持接收 WebSocket 分块消息。
- 为 `Swoole\Coroutine\Http\Client` 和 `Swoole\Coroutine\Http\Server` 新增 `disconnect` 与 `ping` 方法。
- 重构`Swoole\Coroutine\Lock`，`Swoole\Lock`和，`Swoole\Thread\Lock`，只保留`__construct`，`lock`和`unlock`方法，使用上更加贴近`php flock`。

### Bug 修复
- **线程模式优化**：
    - 修复 `SWOOLE_THREAD` 模式下 `hook_flags` 设置失效问题。
    - 修复因工作线程达到`max_request`限制重启后，导致心跳线程持有失效指针并访问已释放内存的问题。
    - 修复不支持单独重启`Task`进程的问题。
    - 修复 `Swoole\Websocket\Server` 在握手失败或连接关闭后，仍可能触发 `onMessage` 回调的问题。
    - 修复 `Swoole\Coroutine\Http\Server` 因函数返回值类型与签名不一致导致的执行错误。
    - 修复 `Swoole\Coroutine\Http\Server` 不支持启用 HTTP/2 的问题。
    - 修复 `Swoole\Lock::lockwait()` 超时时间精度转换问题。
    - 修复因`PHP 8`兼容性调整及`keepalive`连接清理不彻底，导致使用协程化 `curl` 模块时出现 `ReactorEpoll::add(): failed to add event` 警告的问题。
    - 修复`Swoole\Server::taskWaitMulti()`在多线程模式下无法使用的问题。
    - 修复`Swoole\Server::taskCo()`在多线程模式下资源竞争问题。
- **稳定性提升**：
    - 修复同步进程（含 manager 进程和 task 进程）无法正常使用`process::signal()`的问题。
    - 修正工作进程异常退出时的资源清理机制。
    - 解决 Cygwin 平台编译失败问题。
    - 修复curl开启keepalive无法复用socket的问题。
    - 改进日志组件以解决多线程模式下的数据一致性问题。
    - 修复`io_uring`的`futex`特性在`ubuntu24.04`编译失败的问题。
    - 修复结构体顺序赋值在低版本的linux系统会编译失败的问题。
    - 修复直接实例化的`Swoole\Process`对象其`id`属性未初始化的问题。
    - 修复使用`PIE`编译swoole时，composer.json文件缺少`--enable-zstd`的选项的问题。
    - 修复了指定用户组后，`worker`进程因权限不足而无法向`manager`进程发送信号的问题。
- **兼容性改进**：
    - 修复 PHP 8.5 下 `php_swoole_register_shutdown_function` 兼容性问题。
    - 修正 `Swoole\Table::get()` 对 null 参数的处理。
- **协议处理**：
    - 优化`HTTP`请求头与响应头中重复字段的处理机制，确保其正确合并。
    - 修复当系统没有`zlib`时，处理客户端`Accept-Encoding: zlib`请求头会触发未知压缩方法警告的问题。

### 废弃
- 不再支持`select`事件机制，`select`仅支持`1024`个句柄的事件监听，存在严重缺陷，在不支持`epoll/kqueue`的平台将使用`poll`作为事件轮训机制，这使得`Cygwin`平台下也可以支持大量并发。
- 在`Swoole\Server::stop()`方法中，第二个参数`$waitEvent`已被废弃，请使用`reload_async`参数。

### 架构优化

`6.1`版本增加了大量核心模块的单元测试，测试覆盖率提升至**86%**。通过系统性地补充测试用例并重构底层代码逻辑，同时结合`clang-tidy`工具链开展全量静态代码分析，实现了代码的自动化格式规整与冗余清理，使得代码可读性与可维护性得到显著提升。

- 优化底层`SSL`模块。
- 优化底层`Socket`模块。
- 重构底层同步信号模块。
- 重构底层`reactor`和`string`模块。
- 重构底层基于`SIGRTMIN`信号实现日志文件动态重载。
- 优化底层静态文件服务器，移除C风格代码，统一为C++风格的代码。
- 优化线程初始化逻辑，提高多线程性能，独立管理结构内存，线程创建和退出不需要再加锁。
- 移除底层`async`模块中的`socket_dontwait`选项，该选项已废弃。
- 完善`WebSocket`掩码处理的测试覆盖。
- 优化`sendfile`功能，当文件小于`64KB`时不设置`tcp_cork`选项。
- 增加`aarch64`和`macOS`环境下的单元测试。
- 优化底层客户端网络地址解析和设置。
- 为 `Server`模块增加`ssl_cafile/ssl_capath`配置项。
- 增加`print_backtrace_on_error`配置，此配置可以在发生位置错误时候，打印C函数的堆栈。
- 增加`Address Sanitizer`调试工具。
- 增加`Cygwin`测试，显著提升`Cygwin`平台下的兼容性和稳定性
- 在 `macOS` 系统中，由于 `kqueue` 事件机制不支持跨进程管道事件监听，导致无法使用 `SWOOLE_PROCESS` 模式和 `Task` 进程功能。因此，系统将默认采用 `poll` 作为底层事件机制。如需启用 `kqueue`，可以通过`Swoole\Server::set(['enable_kqueue' => true])`和`swoole_async_set(['enable_kqueue' => true])`方法手动开启。
- 升级 `Swoole library` 版本。
- 禁用 `-Wdate-time` 警告，解决使用 Zig/Clang 编译时的错误。
- 移除 PHP 8.0 相关兼容代码。
- 在 `config.m4` 中新增 `SWOOLE_ODBC_LIBS` 变量。
- 确保 `timespec.tv_nsec` 取值小于 `1,000,000,000`，以符合 POSIX 标准规范。
- 重构`swoole`协程化`curl`底层代码，提高与同步阻塞版本的兼容性。

### 注意事项

- 自 Swoole 6.1 起，`Swoole\Coroutine\Http\Client` 与 `Swoole\Coroutine\Http\Server` 将自动处理 WebSocket 控制帧，除非显式设置 `open_websocket_ping_frame`、`open_websocket_pong_frame` 或 `open_websocket_close_frame`。
- `Swoole\Coroutine::cancel()` 无法取消文件协程化操作，取消文件操作可能导致段错误，因此在新版本中禁止了。
- 若启用 `--enable-iouring`，在检测到内核版本或 `liburing` 版本不满足要求时，将抛出警告信息。
- `Swoole\Websocket\Server::push` 方法在发送关闭帧后不会自动关闭连接，如需关闭连接，请使用 `Swoole\Websocket\Server::disconnect()` 方法。
- `Swoole`协议在处理控制帧时，会主动设置 FIN 标志位为 1，并确保不启用压缩（即 RSV1 位为 0），用户对此的设置将被忽略。
- 当处理连续帧的压缩和发送时，`Swoole`将压缩与数据分块的职责移交至应用层，用户需手动实现相关逻辑。具体请看最下面的例子。
- 系统默认启用了自动`HTTP 100 Continue`响应功能。
- 在协程切换期间，将会保存并恢复`serialize`与`unsealize`操作相关的全局变量。


### API变更

#### 新的锁 API
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

#### 使用示例
```php
$lock = new Swoole\Lock;
$lock->lock(LOCK_EX | LOCK_NB, 0.5);
$lock->unlock();
```

### 取消协程
```php
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

### WebSocket 压缩和发送连续帧

#### 异步服务端
```php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = Server('127.0.0.1', 9502);
$server->set(['websocket_compression' => true]);
$server->on('message', function (Server $server, Frame $frame) {
    $data1 = bin2hex(random_bytes(10 * 1024));
    $data2 = bin2hex(random_bytes(20 * 2048));
    $data3 = bin2hex(random_bytes(40 * 4096));
    $context = deflate_init(ZLIB_ENCODING_RAW); // 流式压缩
    $server->push($frame->fd, deflate_add($context, $data1, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_TEXT, SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1);
    $server->push($frame->fd, deflate_add($context, $data2, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, 0);
    $server->push($frame->fd, deflate_add($context, $data3, ZLIB_FINISH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, SWOOLE_WEBSOCKET_FLAG_FIN);
});
$server->start();
```

#### 协程服务端
```php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\Http\Server;

run(function() {
    $server = new Server("127.0.0.1", 9502);
    $server->set(['websocket_compression' => true]);
    $server->handle('/', function ($request, $response) use ($data1, $data2, $data3) {
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

#### 协程客户端
```php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\Http\Client;

run(function() {
    $client = new Client('127.0.0.1', 9502);
    $client->set(['websocket_compression' => true]);
    $ret = $client->upgrade('/');
    $context = deflate_init(ZLIB_ENCODING_RAW);
    $client->push(deflate_add($context, $data1, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_TEXT, SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1);
    $client->push(deflate_add($context, $data2, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, 0);
    $client->push(deflate_add($context, $data3, ZLIB_FINISH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, SWOOLE_WEBSOCKET_FLAG_FIN);
});
```

## v6.1.0-rc2
### 新功能
- `Swoole\Coroutine::cancel()` 新增 `$throw_exception` 参数，支持在取消协程时抛出异常。
- `Swoole\Coroutine\Http\Client` 与 `Swoole\Coroutine\Http\Server` 现已支持接收 WebSocket 分块消息。
- 为 `Swoole\Coroutine\Http\Client` 和 `Swoole\Coroutine\Http\Server` 新增 `disconnect` 与 `ping` 方法。
- 重构`Swoole\Coroutine\Lock`，`Swoole\Lock`和，`Swoole\Thread\Lock`，只保留`__construct`，`lock`和`unlock`方法，使用上更加贴近`php flock`。

### 问题修复
- 修复 `Swoole\Websocket\Server` 在握手失败或连接关闭后，仍可能触发 `onMessage` 回调的问题。
- 修复 `Swoole\Coroutine\Http\Server` 因函数返回值类型与签名不一致导致的执行错误。
- 修复 `Swoole\Coroutine\Http\Server` 不支持启用 HTTP/2 的问题。
- 修复 `Swoole\Lock::lockwait()` 超时时间精度转换问题。
- 修复因`PHP 8`兼容性调整及`keepalive`连接清理不彻底，导致使用协程化 `curl` 模块时出现 `ReactorEpoll::add(): failed to add event` 警告的问题。

### 内部优化
- 升级 `Swoole library` 版本。
- 禁用 `-Wdate-time` 警告，解决使用 Zig/Clang 编译时的错误。
- 移除 PHP 8.0 相关兼容代码。
- 在 `config.m4` 中新增 `SWOOLE_ODBC_LIBS` 变量。
- 确保 `timespec.tv_nsec` 取值小于 `1,000,000,000`，以符合 POSIX 标准规范。

### 注意事项
- 本版本为 RC（候选发布）版本，请仅在测试环境中使用，请勿在生产环境部署。
- 自 Swoole 6.1 起，`Swoole\Coroutine\Http\Client` 与 `Swoole\Coroutine\Http\Server` 将自动处理 WebSocket 控制帧，除非显式设置 `open_websocket_ping_frame`、`open_websocket_pong_frame` 或 `open_websocket_close_frame`。
- `Swoole\Coroutine::cancel()` 无法取消文件协程化操作，强行取消可能导致段错误。
- 若启用 `--enable-iouring`，在检测到内核版本或 `liburing` 版本不满足要求时，将抛出警告信息。
- `Swoole\Websocket\Server::push` 方法在发送关闭帧后不会自动关闭连接，如需关闭连接，请使用 `Swoole\Websocket\Server::disconnect()` 方法。
- `Swoole`协议在处理控制帧时，会主动设置 FIN 标志位为 1，并确保不启用压缩（即 RSV1 位为 0），用户对此的设置将被忽略。
- 当处理连续帧的压缩和发送时，`Swoole`将压缩与数据分块的职责移交至应用层，用户需手动实现相关逻辑。具体请看最下面的例子。

### API 变更
#### 新的锁API
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

#### 使用示例
```php
$lock = new Swoole\Lock;
$lock->lock(LOCK_EX | LOCK_NB, 0.5);
$lock->unlock();
```

### 取消协程
```php
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

### WebSocket 压缩和发送连续帧

#### 异步服务端
```php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = Server('127.0.0.1', 9502);
$server->set(['websocket_compression' => true]);
$server->on('message', function (Server $server, Frame $frame) {
    $data1 = bin2hex(random_bytes(10 * 1024));
    $data2 = bin2hex(random_bytes(20 * 2048));
    $data3 = bin2hex(random_bytes(40 * 4096));
    $context = deflate_init(ZLIB_ENCODING_RAW); // 流式压缩
    $server->push($frame->fd, deflate_add($context, $data1, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_TEXT, SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1);
    $server->push($frame->fd, deflate_add($context, $data2, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, 0);
    $server->push($frame->fd, deflate_add($context, $data3, ZLIB_FINISH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, SWOOLE_WEBSOCKET_FLAG_FIN);
});
$server->start();
```

#### 协程服务端
```php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\Http\Server;

run(function() {
    $server = new Server("127.0.0.1", 9502);
    $server->set(['websocket_compression' => true]);
    $server->handle('/', function ($request, $response) use ($data1, $data2, $data3) {
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

#### 协程客户端
```php
use function Swoole\Coroutine\run;
use Swoole\Coroutine\Http\Client;

run(function() {
    $client = new Client('127.0.0.1', 9502);
    $client->set(['websocket_compression' => true]);
    $ret = $client->upgrade('/');
    $context = deflate_init(ZLIB_ENCODING_RAW);
    $client->push(deflate_add($context, $data1, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_TEXT, SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1);
    $client->push(deflate_add($context, $data2, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, 0);
    $client->push(deflate_add($context, $data3, ZLIB_FINISH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, SWOOLE_WEBSOCKET_FLAG_FIN);
});
```

## v6.1.0-rc1
### 新特性：
- **llHTTP 默认解析器**：自 v6.1.0 起，Swoole 采用性能更优的 `llhttp` 替代 `http_parser` 作为默认 HTTP 报文解析器。
- **协程化文件下载**：`Swoole\Coroutine\Http\Client` 现支持完整的协程化文件下载操作。
- **异步文件截断**：新增 `iouring ftruncate` 支持，扩展异步文件操作能力。

### Bug 修复：
- **线程模式优化**：
    - 修复 `SWOOLE_THREAD` 模式下 `hook_flags` 设置失效问题。
    - 修复因工作线程达到`max_request`限制重启后，导致心跳线程持有失效指针并访问已释放内存的问题。
    - 修复不支持单独重启`Task`进程的问题。
- **稳定性提升**：
    - 修复同步进程（含 manager 进程和 task 进程）无法正常使用`process::signal()`的问题。
    - 修正工作进程异常退出时的资源清理机制。
    - 解决 Cygwin 平台编译失败问题。
    - 修复curl开启keepalive无法复用socket的问题。
    - 改进日志组件以解决多线程模式下的数据一致性问题。
    - 修复`io_uring`的`futex`特性在`ubuntu24.04`编译失败的问题。
    - 修复结构体顺序赋值在低版本的linux系统会编译失败的问题。
    - 修复直接实例化的`Swoole\Process`对象其`id`属性未初始化的问题。
-  修复使用`PIE`编译swoole时，composer.json文件缺少`--enable-zstd`的选项的问题。
- **兼容性改进**：
    - 修复 PHP 8.5 下 `php_swoole_register_shutdown_function` 兼容性问题。
    - 修正 `Swoole\Table::get()` 对 null 参数的处理。
- **协议处理**：
    - 优化`HTTP`请求头与响应头中重复字段的处理机制，确保其正确合并。
    - 修复当系统没有`zlib`时，处理客户端`Accept-Encoding: zlib`请求头会触发未知压缩方法警告的问题。

### 废弃
- 不再支持`select`事件机制，`select`仅支持`1024`个句柄的事件监听，存在严重缺陷，在不支持`epoll/kqueue`的平台将使用`poll`作为事件轮训机制，这使得`Cygwin`平台下也可以支持大量并发。
- 在`Swoole\Server::stop()`方法中，第二个参数`$waitEvent`已被废弃，请使用`reload_async`参数。

### 架构优化
- `6.1`版本增加了大量核心模块的单元测试，测试覆盖率提升至**86%**。通过系统性地补充测试用例并重构底层代码逻辑，同时结合`clang-tidy`工具链开展全量静态代码分析，实现了代码的自动化格式规整与冗余清理，使得代码可读性与可维护性得到显著提升。

- 优化底层`SSL`模块。
- 优化底层`Socket`模块。
- 重构底层同步信号模块。
- 重构底层`reactor`和`string`模块。
- 重构底层基于`SIGRTMIN`信号实现日志文件动态重载。
- 优化底层静态文件服务器，移除C风格代码，统一为C++风格的代码。
- 优化线程初始化逻辑，提高多线程性能，独立管理结构内存，线程创建和退出不需要再加锁。
- 移除底层`async`模块中的`socket_dontwait`选项，该选项已废弃。
- 完善`WebSocket`掩码处理的测试覆盖。
- 优化`sendfile`功能，当文件小于`64KB`时不设置`tcp_cork`选项。
- 增加`aarch64`和`macOS`环境下的单元测试。
- 优化底层客户端网络地址解析和设置。
- 为 `Server`模块增加`ssl_cafile/ssl_capath`配置项。
- 增加`print_backtrace_on_error`配置，此配置可以在发生位置错误时候，打印C函数的堆栈。
- 增加`Address Sanitizer`调试工具。
- 增加`Cygwin`测试，显著提升`Cygwin`平台下的兼容性和稳定性
- 在 `macOS` 系统中，由于 `kqueue` 事件机制不支持跨进程管道事件监听，导致无法使用 `SWOOLE_PROCESS` 模式和 `Task` 进程功能。因此，系统将默认采用 `poll` 作为底层事件机制。如需启用 `kqueue`，可以通过`Swoole\Server::set(['enable_kqueue' => true])`和`swoole_async_set(['enable_kqueue' => true])`方法手动开启。

## v6.0.2

### 新特性：
- 增加`Swoole\Thread::yield()`，`Swoole\Thread::activeCount()`和`Swoole\Thread::isAlive()`方法。

### Bug修复：
- 修复在`SWOOLE_THREAD`模式下，使用单线程模式和设置心跳会引发异常的问题。
- 修复开启`swoole.enable_fiber_mock`后的段错误问题。
- 修复Redis服务端的整型溢出问题。

### 注意：
- Redis服务端目前将仅支持`RESP2`协议，当格式化不符合该协议的字符串时，将抛出异常而不是记录日志。

## v6.0.1

### Bug修复：
- 修复`SWOOLE_THREAD`模式下，因为没有移除监听事件导致进程无法正常退出的问题。
- 修复当开启`single_thread`配置时，无法上传大文件的问题。
- 修复如果已经定义了`config.m4`中相同的变量，会导致编译过程找不到具体的文件路径的问题。
- 修复`Swoole\Process\Pool`中进程超时无法正常退出的问题。
- 修复`SWOOLE_THREAD`模式下，调用`putenv`导致程序崩溃的问题。
- 修复`SWOOLE_THREAD`模式下，无法为独立的端口设置事件回调函数的问题。
- 修复`SWOOLE_THREAD`模式下，`onWorkerStart`等事件中无法获取到运行时的各项参数的问题。
- 修复Postgresql在协程化下在接收大量数据会退化成同步模式下的问题。
- 优化`swoole_substr_json_decode`/`swoole_substr_unserialize`函数的参数判断逻辑。
- 修复`config.m4`中的CPU亲和性设置的问题。
- 修复`SWOOLE_THREAD`模式下，心跳检测不起作用的问题。

### 注意：
- 在Http服务中，如果进程重启时，底层会发送500 Internal Server给队列中等待处理的请求，发送完毕就关闭连接并丢弃这些请求。
- 由于php底层的`stream factory`和`stream ops`依赖的运行时配置不是线程安全的，因此多线程模式下只允许主线程在还没创建子线程之前修改这些运行时配置。
- 升级nghttp2到最新版本。

## v5.1.8
### Bug修复：
- 修复 thread context 开启时与低版本 GCC 编译 Swoole 的兼容性问题。
- 修复高版本 GCC 编译时因缺少 _GNU_SOURCE 宏定义导致的 CPU 亲和支持检测失效问题。
- 修复同步进程（含 manager 进程和 task 进程）无法正常使用 process::signal() 的问题。
- 修复 HTTP2 协程客户端缺少 serverLastStreamId 属性的问题。
- 修复系统无 zlib 支持时，客户端请求 Accept-Encoding 含 zlib 会触发未知压缩方法警告的问题。
- 修复 Swoole\Process 类缺少 id 属性的问题。

## v5.1.7

### Bug修复：
- 修复Postgresql在协程化下在接收大量数据会退化成同步模式下的问题。
- 修复`Swoole\Http2\Request`动态创建类的属性抛出异常的问题。
- 修复一键协程化中发生的致命错误会导致内存错误的问题。

## v6.0.0

### 新特性：
- `Swoole`支持多线程模式，当`php`是`zts`模式，编译`Swoole`时开启`--enable-swoole-thread`时，就能使用多线程模式。
- 新增创建线程类`Swoole\Thread`。 @matyhtf
- 新增线程锁`Swoole\Thread\Lock`。 @matyhtf
- 新增线程原子计数`Swoole\Thread\Atomic`，`Swoole\Thread\Atomic\Long`。 @matyhtf
- 新增安全并发容器`Swoole\Thread\Map`，`Swoole\Thread\ArrayList`，`Swoole\Thread\Queue`。 @matyhtf
- 文件异步操作支持了使用`iouring作为文件异步操作的底层引擎`，安装了`liburing`和编译`Swoole`时开启`--enable-iouring`，`file_get_contents`，`file_put_contents`，`fopen`，`fclose`，`fread`，`fwrite`，`mkdir`，`unlink`，`fsync`，`fdatasync`，`rename`，`fstat`，`lstat`，`filesize`这些函数的异步操作将会由`iouring`实现。 @matyhtf @NathanFreeman
- 升级`Boost Context`版本到1.84。现在，龙芯CPU也能够支持协程了。 @NathanFreeman
- 新增`Swoole\Thread\Map::find()`方法。 @matyhtf
- 新增`Swoole\Thread\ArrayList::find()`方法。 @matyhtf
- 新增`Swoole\Thread\ArrayList::offsetUnset()`方法。 @matyhtf
- 新增`Swoole\Process::getAffinity()`方法。 @matyhtf
- 新增`Swoole\Thread::setName()`方法。 @matyhtf
- 新增`Swoole\Thread::setAffinity()`方法。 @matyhtf
- 新增`Swoole\Thread::getAffinity()`方法。 @matyhtf
- 新增`Swoole\Thread::setPriority()`方法。 @matyhtf
- 新增`Swoole\Thread::getPriority()`方法。 @matyhtf
- 新增`Swoole\Thread::gettid()`方法。
- 文件异步引擎`iouring`支持多线程轮询模式`IORING_SETUP_SQPOLL`。 @NathanFreeman
- 新增`iouring_workers`修改`iouring`线程数。 @NathanFreeman
- 新增`iouring_flags`支持修改`iouring`工作模式。 @NathanFreeman
- 增加`Swoole\Thead\Barrier`多线程同步屏障。@matyhtf
- 增加新的设置cookie的函数。 @matyhtf @NathanFreeman
- 新增`非阻塞，可重入的互斥协程锁”，该锁可以在进程间/线程间使用，且不会阻塞进程/线程。 @NathanFreeman
- `Swoole\Coroutine\Socket::getOption()`支持了`TCP_INFO`选项。 @matyhtf
- `Swoole\Client`同步阻塞客户端支持`http`代理。 @matyhtf
- 新增异步非阻塞的`TCP/UDP/Unixsocket` 客户端`Swoole\Async\Client`。 @matyhtf
- 优化`Swoole\Redis\Server::format`()方法，支持内存零拷贝，支持`redis`嵌套结构。 @matyhtf
- 支持高性能压缩工具`Zstd`，只需要在编译`Swoole`时加上`--enable-zstd`，`http`客户端和服务端之间便可使用`zstd`来压缩响应或者解码响应。 @NathanFreeman

### Bug修复：
- 修复无法通过`pecl`安装的问题。 @remicollet
- 修复`Swoole\Coroutine\FastCGI\Client`客户端无法设置keepalive。 @NathanFreeman
- 修复请求参数超过`max_input_vars`时会抛出错误导致进程不断重启的问题。 @NathanFreeman
- 修复在协程中使用`Swoole\Event::wait()`导致的未知问题。 @matyhtf
- 修复`proc_open`在协程化的时候不支持pty的问题。 @matyhtf
- 修复`pdo_sqlite`在PHP8.3会出现段错误的问题。 @NathanFreeman
- 修复编译`Swoole`时的无用警告。 @Appla @NathanFreeman
- 修复如果`STDOUT/STDERR`已经关闭时，底层调用zend_fetch_resource2_ex会抛出错误。 @Appla @matyhtf
- 修复无效的`set_tcp_nodelay`配置。 @matyhtf
- 修复文件上传的时候偶尔会触发不可达的分支问题。 @NathanFreeman
- 修复设置了`dispatch_func`，会导致php底层抛出错误的问题。 @NathanFreeman
- 修复AC_PROG_CC_C99在autoconf >= 2.70版本中已过时。 @petk
- 当线程创建失败时，捕获其抛出的异常。 @matyhtf
- 修复`_tsrm_ls_cache`未定义问题。 @jingjingxyk
- 修复在`GCC 14`编译会导致致命错误。 @remicollet
- 修复`Swoole\Http2\Request`动态属性问题。 @guandeng
- 修复`pgsql`协程客户端偶发资源不可用的问题。 @NathanFreeman
- 修复进程重启，没有重置相关参数导致503错误的问题。@matyhtf
- 修复开启`HTTP2`时，`$request->server['request_method']` 与 `$request->getMethod()` 的结果不一致。 @matyhtf
- 修复上传文件时，不正确的`content-type`。 @matyhtf
- 修复`http2`协程客户端的代码错误。 @matyhtf
- 修复`Swoole\Server`缺少属性`worker_id`的问题。 @cjavad
- 修复`config.m4`有关`brotli`错误的问题。 @fundawang
- 修复 多线程下`Swoole\Http\Response::create`无效。 @matyhtf
- 修复`macos`环境下编译错误。 @matyhtf
- 修复线程无法安全退出的问题。 @matyhtf
- 修复多线程模式下，`Swoole\Http\Response`返回响应时间的静态变量没有各个线程各自生成一份的问题。 @matyhtf @NathanFreeman
- 修复因为`PHP-8.4`在ZTS模式下的`超时`特性引起的`Fatal error`问题。 @matyhtf
- 修复`PHP-8.4`的`exit()`函数`hook`。 @remicollet
- 修复`Swoole\Thread::getNativeId()`在`cygwin`无法工作的问题。 @matyhtf
- 修复`Swoole\Coroutine::getaddrinfo()`方法会导致`SIGSEGV`的问题。 @matyhtf
- 修复`runtime tcp`模块不支持动态开启SSL加密的问题。 @matyhtf
- 修复http客户端长时间运行导致超时时间不正确的问题。 @matyhtf
- 修复进程退出之前会导致`Swoole\Table`的互斥锁无法使用的问题。 @matyhtf
- 修复使用命名参数导致`Swoole\Server::stop()`执行失败的问题。 @matyhtf
- 修复`Swoole\Thread\Map::toArray()`函数未复制`key`导致崩溃的问题。 @matyhtf
- 修复`Swoole\Thread\Map`无法删除嵌套的数字键的问题。 @matyhtf

### 内核优化：
- 移除对`socket structs`的无用检查。 @petk
- 升级swoole Library。 @deminy
- `Swoole\Http\Response`增加对451状态码的支持。 @abnegate
- 同步PHP不同版本的`文件`操作代码。 @NathanFreeman
- 同步PHP不同版本的`pdo`操作代码。 @NathanFreeman
- 优化`Socket::ssl_recv()`的代码。 @matyhtf
- 优化了config.m4，一些配置可以通过`pkg-config`设置依赖库位置。 @NathanFreeman
- 优化`解析请求头`的时候使用动态数组的问题 。 @NathanFreeman
- 优化在多线程模式下，文件描述符`fd`的生命周期问题。 @matyhtf
- 优化协程一些基本逻辑。 @matyhtf
- 升级CI测试的oracle数据库版本。 @gvenzl
- 优化底层`sendfile`的相关逻辑。 @matyhtf
- `config.m4`中用`AC_DEFINE_UNQUOTED`替换`PHP_DEF_HAVE`。 @petk
- 优化多线程模式下，server的`heartbeat`,`shutdown`和`stop`的相关逻辑。 @matyhtf
- 优化`glibc`版本高于2.17时，不需要链接`librt`。 @matyhtf
- 加强`http`客户端可以接受重复的请求头。 @matyhtf
- 优化`Swoole\Http\Response::write()`。 @matyhtf
- `Swoole\Http\Response::write()`现在可以发送`http2`协议。 @matyhtf
- 兼容`PHP8.4`。 @matyhtf @NathanFreeman
- 增加底层`socket`异步写入的能力。 @matyhtf
- 优化`Swoole\Http\Response`。 @NathanFreeman
- 多线程模式下，支持共享php原生`socket`。 @matyhtf
- 优化静态文件服务，修复静态文件路径错误问题。 @matyhtf
- 异步`Server`多线程模式支持重启工作线程。 @matyhtf
- 异步`Server`多线程模式支持在`Manager`线程中开启定时器。 @matyhtf
- 兼容`PHP-8.4`的`curl`扩展。 @matyhtf @NathanFreeman
- 重新封装`Swoole`底层使用`iouring`的代码。 @matyhtf @NathanFreeman
- 优化定时器，使同步进程不依赖于信号。 @matyhtf
- 优化`Swoole\Coroutine\System::waitSignal()`方法，允许同时监听多个信号。 @matyhtf

### 废弃：
- 不再支持`PHP 8.0`。
- 不再支持`Swoole\Coroutine\MySQL`协程客户端。
- 不再支持`Swoole\Coroutine\Redis`协程客户端。
- 不再支持`Swoole\Coroutine\PostgreSQL`协程客户端。
- 移除`Swoole\Coroutine\System::fread()`, `Swoole\Coroutine\System::fwrite()`和`Swoole\Coroutine\System::fgets()`方法

## v5.1.5

### Bug修复：
- 修复php版本大于8.2，需要使用`zend_ini_parse_quantity`解析字符串数字。 @matyhtf
- 修复`pdo_pgsql`协程化的时候，偶发资源不可用的问题。 @NathanFreeman
- 修复`pdo_pgsql`协程化的时候，头文件引用问题。 @NathanFreeman
- 修复不正确的相对路径检查，以避免绕过路径验证。 @matyhtf
- 修复高并发环境下，进程重启会导致并发数不正确。 @matyhtf

### 内核优化：
- 同步`php8.3 curl`的一些相关代码。 @NathanFreeman
- 修复`process`模块核心测试错误。 @NathanFreeman
- 在`SWOOLE_BASE`模式下，所有的连接都应该在`PHP RSHUTDOWN`阶段都被关闭。 @matyhtf
- 优化内核代码。 @matyhtf

## v6.0.0-beta

### 新特性:
- 新增`Swoole\Thread\Map::find()`方法。 @matyhtf
- 新增`Swoole\Thread\ArrayList::find()`方法。 @matyhtf
- 新增`Swoole\Thread\ArrayList::offsetUnset()`方法。 @matyhtf
- 新增`Swoole\Process::getAffinity()`方法。 @matyhtf
- 新增`Swoole\Thread::setName()`方法。 @matyhtf
- 新增`Swoole\Thread::setAffinity()`方法。 @matyhtf
- 新增`Swoole\Thread::getAffinity()`方法。 @matyhtf
- 新增`Swoole\Thread::setPriority()`方法。 @matyhtf
- 新增`Swoole\Thread::getPriority()`方法。 @matyhtf
- 新增`Swoole\Thread::gettid()`方法。
- 文件异步引擎`iouring`支持多线程轮询模式`IORING_SETUP_SQPOLL`。 @NathanFreeman
- 新增`iouring_workers`修改`iouring`线程数。 @NathanFreeman
- 新增`iouring_flags`支持修改`iouring`工作模式。 @NathanFreeman
- 增加`Swoole\Thead\Barrier`多线程同步屏障。@matyhtf
- 增加新的设置cookie的函数。 @matyhtf @NathanFreeman

### Bug修复：
- 修复`Swoole\Http2\Request`动态属性问题。 @guandeng
- 修复`pgsql`协程客户端偶发资源不可用的问题。 @NathanFreeman
- 修复进程重启，没有重置相关参数导致503错误的问题。@matyhtf
- 修复开启`HTTP2`时，$request->server['request_method'] 与 $request->getMethod() 的结果不一致。 @matyhtf
- 修复上传文件时，不正确的`content-type`。 @matyhtf
- 修复`http2`协程客户端的代码错误。 @matyhtf
- 修复`Swoole\Server`缺少属性`worker_id`的问题。 @cjavad
- 修复`config.m4`有关`brotli`错误的问题。 @fundawang
- 修复 多线程下`Swoole\Http\Response::create`无效。 @matyhtf
- 修复`macos`环境下编译错误。 @matyhtf
- 修复线程无法安全退出的问题。 @matyhtf
- 修复多线程模式下，`Swoole\Http\Response`返回响应时间的静态变量没有各个线程各自生成一份的问题。 @matyhtf @NathanFreeman

### 内核优化：
- 升级CI测试的oracle数据库版本。 @gvenzl
- 重构优化`swoole`底层相关代码。 @matyhtf
- 优化底层`sendfile`的相关逻辑。 @matyhtf
- 优化参数解析。 @matyhtf
- `config.m4`中用`AC_DEFINE_UNQUOTED`替换`PHP_DEF_HAVE`。 @petk
- 优化多线程模式下，server的`heartbeat`,`shutdown`和`stop`的相关逻辑。 @matyhtf
- 优化`glibc`版本高于2.17时，不需要链接`librt`。 @matyhtf
- 加强`http`客户端可以接受重复的请求头。 @matyhtf
- 优化`Swoole\Http\Response::write()`。 @matyhtf
- `Swoole\Http\Response::write()`现在可以发送`http2`协议。 @matyhtf
- 兼容`PHP8.4`。 @matyhtf @NathanFreeman
- 增加底层`socket`异步写入的能力。 @matyhtf
- 优化`Swoole\Http\Response`。 @NathanFreeman
- 优化底层错误信息。 @matyhtf
- 多线程模式下，支持共享php原生`socket`。 @matyhtf
- 优化静态文件服务，修复静态文件路径错误问题。 @matyhtf

### 废弃：
- 移除`Swoole\Coroutine\System::fread()`, `Swoole\Coroutine\System::fwrite()`和`Swoole\Coroutine\System::fgets()`方法

## v6.0.0-alpha

### 新特性
- `Swoole`支持多线程模式，当`php`是`zts`模式，编译`Swoole`时开启`--enable-swoole-thread`时，就能使用多线程模式。
- 新增线程管理类`Swoole\Thread`。 @matyhtf
- 新增线程锁`Swoole\Thread\Lock`。 @matyhtf
- 新增线程原子计数`Swoole\Thread\Atomic`，`Swoole\Thread\Atomic\Long`。 @matyhtf
- 新增安全并发容器`Swoole\Thread\Map`，`Swoole\Thread\ArrayList`，`Swoole\Thread\Queue`。 @matyhtf
- 文件异步操作支持`iouring`作为底层引擎，安装了`liburing`和编译`Swoole`时开启`--enable-iouring`，`file_get_contents`，`file_put_contents`，`fopen`，`fclose`，`fread`，`fwrite`，`mkdir`，`unlink`，`fsync`，`fdatasync`，`rename`，`fstat`，`lstat`，`filesize`这些函数的异步操作将会由`iouring`实现。 @matyhtf @NathanFreeman
- 升级`Boost Context`版本到1.84。现在，龙芯CPU也能够使用协程了。 @NathanFreeman

### Bug修复
- 修复无法通过`pecl`安装的问题。 @remicollet
- 修复`Swoole\Coroutine\FastCGI\Client`客户端无法设置keepalive。 @NathanFreeman
- 修复请求参数超过`max_input_vars`时会抛出错误导致进程不断重启的问题。 @NathanFreeman
- 修复在协程中使用`Swoole\Event::wait()`导致的未知问题。 @matyhtf
- 修复`proc_open`在协程化的时候不支持pty的问题。 @matyhtf
- 修复`pdo_sqlite`在PHP8.3会出现段错误的问题。 @NathanFreeman
- 修复编译`Swoole`时的无用警告。 @Appla @NathanFreeman
- 修复如果`STDOUT/STDERR`已经关闭时，底层调用zend_fetch_resource2_ex会抛出错误。 @Appla @matyhtf
- 修复无效的`set_tcp_nodelay`配置。 @matyhtf
- 修复文件上传的时候偶尔会触发不可达的分支问题。 @NathanFreeman
- 修复设置了`dispatch_func`，会导致php底层抛出错误的问题。 @NathanFreeman
- 修复AC_PROG_CC_C99在autoconf >= 2.70版本中已过时。 @petk
- 当线程创建失败时，捕获其抛出的异常。 @matyhtf
- 修复`_tsrm_ls_cache`未定义问题。 @jingjingxyk
- 修复在`GCC 14`编译会导致致命错误。 @remicollet

### 内核优化
- 移除对`socket structs`的无用检查。 @petk
- 升级swoole Library。 @deminy
- `Swoole\Http\Response`增加对451状态码的支持。 @abnegate
- 同步PHP不同版本的`文件`操作代码。 @NathanFreeman
- 同步PHP不同版本的`pdo`操作代码。 @NathanFreeman
- 优化`Socket::ssl_recv()`的代码。 @matyhtf
- 优化了config.m4，一些配置可以通过`pkg-config`设置依赖库位置。 @NathanFreeman
- 优化`解析请求头`的时候使用动态数组的问题 。 @NathanFreeman
- 优化在多线程模式下，文件描述符`fd`的生命周期问题。 @matyhtf
- 优化协程一些基本逻辑。 @matyhtf

### 废弃
- 不再支持`PHP 8.0`。
- 不再支持`Swoole\Coroutine\MySQL`协程客户端。
- 不再支持`Swoole\Coroutine\Redis`协程客户端。
- 不再支持`Swoole\Coroutine\PostgreSQL`协程客户端。

## v5.1.3
### Bug修复：
- 修复无法通过`pecl`安装的问题。
- 修复`Swoole\Coroutine\FastCGI\Client`客户端无法设置keepalive。
- 修复请求参数超过`max_input_vars`时会抛出错误导致进程不断重启的问题。
- 修复在协程中使用`Swoole\Event::wait()`导致的未知问题。
- 修复`proc_open`在协程化的时候不支持pty的问题。
- 修复`pdo_sqlite`在PHP8.3会出现段错误的问题。
- 修复编译`Swoole`时的无用警告。
- 修复如果`STDOUT/STDERR`已经关闭时，底层调用zend_fetch_resource2_ex会抛出错误。
- 修复无效的`set_tcp_nodelay`配置。
- 修复文件上传的时候偶尔会触发不可达的分支问题。
- 修复设置了`dispatch_func`，会导致php底层抛出错误的问题。
- 修复AC_PROG_CC_C99在autoconf >= 2.70版本中已过时。

### 内核优化：
- 移除对`socket structs`的无用检查。
- 升级swoole Library。
- `Swoole\Http\Response`增加对451状态码的支持。
- 同步PHP不同版本的`文件`操作代码。
- 同步PHP不同版本的`pdo`操作代码。
- 优化`Socket::ssl_recv()`的代码。
- 优化了config.m4，一些配置可以通过`pkg-config`设置依赖库位置。
- 优化`解析请求头`的时候使用动态数组的问题。

## v5.1.2

### Bug修复
- 支持嵌入 sapi。
- 修复 PHP 8.3 中 ZEND_CHECK_STACK_LIMIT 的兼容性问题。
- 修复范围请求返回文件全部内容时没有 Content-Range 响应头的错误。
- 修复截断的 cookie。
- 修复了 PHP 8.3 上的 native-curl 崩溃问题。
- 修复了 Server::Manager::wait() 后的无效 errno 错误。
- 修复了 HTTP2 的拼写错误。

### 优化
- 优化 HTTP 服务器性能。
- 添加 CLOSE_SERVICE_RESTART、CLOSE_TRY_AGAIN_LATER、CLOSE_BAD_GATEWAY 作为 websocket 的有效关闭原因

## v5.1.1
### Bug 修复
- 修复`http协程客户端`内存泄漏问题。
- 修复`pdo_odbc`无法协程化的问题。
- 修复`socket_import_stream()`执行错误的问题。
- 修复`Context::parse_multipart_data()`无法处理空请求体的问题。
- 修复`PostgreSQL协程客户端`参数不起作用的问题。
- 修复`curl`在析构时会崩溃的bug。
- 修复`Swoole5.x`与新版的`xdebug`不兼容问题。
- 修复类`自动加载`的过程中发生协程切换导致提示`类不存在`的问题。
- 修复无法在`OpenBSD`编译`swoole`的问题。

## v5.1.0

### 新特性
- 增加对`pdo_pgsql`的协程化支持
- 增加对`pdo_odbc`的协程化支持
- 增加对`pdo_oci`的协程化支持
- 增加对`pdo_sqlite`的协程化支持
- 增加`pdo_pgsql`，`pdo_odbc`，`pdo_oci`，`pdo_sqlite`的连接池配置

### 增强
- 改进了`Http\Server`的性能，极限情况下可以提升`60%`

### 修复
- 修复`WebSocket`协程客户端每次请求造成的内存泄漏
- 修复`http协程服务端`优雅退出导致客户端不退出的问题
- 修复编译的时候加入了`--enable-thread-context`选项会导致`Process::signal()`不起作
- 修复在`SWOOLE_BASE`模式下，当进程非正常退出时，连接数统计错误的问题
- 修复`stream_select()`函数签名错误
- 修复文件MIME信息大小写敏感错误
- 修复`Http2\Request::$usePipelineRead`拼写错误导致在PHP8.2的环境下会抛出警告
- 修复在`SWOOLE_BASE`模式下的内存泄漏问题
- 修复当`Http\Response::cookie()`设置cookie的过期时间导致的内存泄漏问题
- 修复在`SWOOLE_BASE`模式下的连接泄漏问题

### 内核
- 修复swoole在php8.3下的php_url_encode的函数签名问题
- 修复单元测试选项问题
- 优化，重构代码
- 兼容PHP8.3
- 不支持32位操作系统上编译

##  v5.0.3

### 增强
- 添加了`--with-nghttp2_dir`选项，用于使用系统中的`nghttp2`库
- 支持字节长度或大小相关的选项
- 增加`Process\Pool::sendMessage()`函数
- `Http\Response:cookie()`支持`max-age`

### 修复
- 修复`Server task/pipemessage/finish`事件导致内存泄漏

### 内核
- `http`响应头冲突将不会抛出错误
- `Server`连接关闭将不会抛出错误

## v5.0.2

### 增强
- 支持对`http2`的默认设置进行配置
- 支持8.1或更高版本的`xdebug`
- 重构了原生的curl以支持具有多个套接字的curl句柄，例如curl ftp协议
- 在`Process::setPriority/getPriority`中添加了`who`参数
- 添加了`Coroutine\Socket::getBoundCid()`方法
- 调整了`Coroutine\Socket::recvLine/recvWithBuffer`方法的`length`参数的默认值为`65536`
- 重构了跨协程退出特性，使内存释放更安全，并解决了致命错误发生时的崩溃问题
- 为`Coroutine\Client`、`Coroutine\Http\Client`、`Coroutine\Http2\Client`添加了`socket`属性，允许直接操作`socket`资源
- 持`Http\Server`向`http2`客户端发送空文件
- 支持`Coroutine\Http\Server`的优雅重启。当服务器关闭时，客户端连接不再被强制关闭，只停止监听新请求
- 将`pcntl_rfork`和`pcntl_sigwaitinfo`添加到不安全函数列表中，在协程容器启动时将被关闭
- 重构了`SWOOLE_BASE`模式进程管理器，关闭和重载行为将`SWOOLE_PROCESS`一致

##  v5.0.1

### 增强
- 支持`PHP-8.2`，改进了协程异常处理，与`ext-soap`兼容
- 添加了`pgsql`协程客户端的`LOB`支持
- 改进了`websocket`客户端，升级头部包含`websocket`而不是使用`=`
- 优化了`http 客户端`，在服务器发送`connection close`时禁用`keep-alive`
- 优化了`http 客户端`，在没有压缩库的情况下禁止添加`Accept-Encoding`头部
- 改进了调试信息，在`PHP-8.2`下将密码设置为敏感参数
- 加强了`Server::taskWaitMulti()`，在协程环境下不会阻塞
- 优化了日志函数，在写入日志文件失败时不再打印到屏幕上


### 修复
- 修复了`Coroutine::printBackTrace()`和`debug_print_backtrace()`的参数兼容性问题
- 修复了`Event::add()`对套接字资源的支持
- 修复了在没有`zlib`时的编译错误
- 修复了在解析为意外字符串时解包服务器任务的崩溃问题
- 修复了添加小于`1ms`的定时器被强制设置为`0`的问题
- 修复了在添加列之前使用`Table::getMemorySize()`引起崩溃的问题
- 修改了`Http\Response::setCookie()`方法的过期参数名为`expires`

## v5.0.0

### 新特性
- 添加了`Server`的`max_concurrency`选项
- 添加了`Coroutine\Http\Client`的`max_retries`选项
- 添加了`name_resolver`全局选项。 添加了`Server`的`upload_max_filesize`选项
- 添加了`Coroutine::getExecuteTime()`方法
- 为`Server `添加了`SWOOLE_DISPATCH_CONCURRENT_LB`的`dispatch_mode`
- 强化了类型系统，为所有函数的参数和返回值添加了类型
- 优化了错误处理，所有构造函数在失败时将抛出异常
- 调整了`Server`的默认模式，默认为`SWOOLE_BASE`模式
- 将`pgsql`协程客户端迁移到核心库中。 包含了`4.8.x`分支中的所有`bug`修复

### 移除
- 移除了`PSR-0`风格的类名
- 移除了在关闭函数中自动添加`Event::wait()`的功能
- 移除了`Server::tick/after/clearTimer/defer`的别名
- 移除了`--enable-http2/--enable-swoole-json`，调整为默认启用

### 废弃
- 协程客户端`Coroutine\Redis`和`Coroutine\MySQL`默认废弃

## v4.8.13

### 增强
- 重构原生的curl以支持具有多个套接字的curl句柄，例如curl FTP协议
- 支持手动设置`http2`设置
- 改进`WebSocket客户端`，升级标头包含了`websocket`而不是`equal`
- 优化HTTP客户端，在服务器发送连接关闭时禁用`keep-alive`
- 改进调试信息，在PHP-8.2下将密码设置为敏感参数
- 支持`HTTP Range Requests`

### 修复
- 修复了`Coroutine::printBackTrace()`和`debug_print_backtrace()`的参数兼容性问题
- 修复了在`WebSocket`服务器同时启用`HTTP2`和`WebSocket`协议时解析长度错误的问题
- 修复了在`Server::send()`、`Http\Response::end()`、`Http\Response::write()`和`WebSocket/Server::push()`中发生`send_yield`时的内存泄漏问题
- 修复了在添加列之前使用`Table::getMemorySize()`时导致崩溃的问题。

## v4.8.12

### 增强
- 支持PHP8.2
- `Event::add()`函数支持`sockets resources`
- `Http\Client::sendfile()`支持超过4G的文件
- `Server::taskWaitMulti()`支持协程环境

### 修复
- 修复接收到错误的`multipart body`会抛出错误信息
- 修复定时器的超时时间小于`1ms`导致的错误
- 修复磁盘已满导致的死锁问题

## v4.8.11

### 增强
- 支持 `Intel CET` 安全防御机制
- 添加 `Server::$ssl`属性
- 使用`pecl`编译`swoole`时，增加`enable-cares`属性
- 重构`multipart_parser`解释器

### 修复
- 修复`pdo`持久化连接抛出异常导致的段错误
- 修复析构函数使用协程导致段错误
- 修复`Server::close()`的不正确的错误信息

## v4.8.10

### 修复

- 当`stream_select`的超时参数小于`1ms`时将其重置为`0`
- 修复编译时添加`-Werror=format-security`会导致编译失败
- 修复使用`curl`导致`Swoole\Coroutine\Http\Server`段错误

## v4.8.9

### 增强

- 支持 `Http2` 服务器下的 `http_auto_index` 选项

### 修复

- 优化 `Cookie` 解析器，支持传入 `HttpOnly` 选项
- 修复 #4657，Hook `socket_create` 方法返回类型问题
- 修复 `stream_select` 内存泄漏

### CLI 更新

- `CygWin` 下携带了 SSL 证书链，解决了 SSL 认证出错的问题
- 更新至 `PHP-8.1.5`

## v4.8.8

### 优化

- 将 SW_IPC_BUFFER_MAX_SIZE 减少到 64k
- 优化 http2 的 header_table_size 设置

### 修复

- 修复使用 enable_static_handler 下载静态文件大量套接字错误
- 修复 http2 server NPN 错误

## v4.8.7

### 增强

- 添加 curl_share 支持

### 修复

- 修复 arm32 架构下的未定义符号错误
- 修复 `clock_gettime()` 兼容性
- 修复当内核缺乏大块内存时，PROCESS 模式服务器发送失败的问题

## v4.8.6

### 修复

- 为 boost/context API 名称添加了前缀
- 优化配置选项

## v4.8.5

### 修复

- 还原 Table 的参数类型
- 修复使用 Websocket 协议接收错误数据时 crash

## v4.8.4

### 修复

- 修复 sockets hook 与 PHP-8.1 的兼容性
- 修复 Table 与 PHP-8.1 的兼容性
- 修复在部分情况下协程风格的 HTTP 服务器解析 `Content-Type` 为 `application/x-www-form-urlencoded` 的 `POST` 参数不符合预期

## v4.8.3

### 新增 API

- 增加 `Coroutine\Socket::isClosed()` 方法

### 修复

- 修复 curl native hook 在 php8.1 版本下的兼容性问题
- 修复 sockets hook 在 php8 下的兼容性问题
- 修复 sockets hook 函数返回值错误
- 修复 Http2Server sendfile 无法设置 content-type
- 优化 HttpServer date header 的性能，增加了 cache

## v4.8.2

### 修复

- 修复 proc_open hook 内存泄露的问题
- 修复 curl native hook 与 PHP-8.0、PHP-8.1 的兼容性问题
- 修复 Manager 进程中无法正常关闭连接的问题
- 修复 Manager 进程无法使用 sendMessage 的问题
- 修复 `Coroutine\Http\Server` 接收超大 POST 数据解析异常的问题
- 修复 PHP8 环境下致命错误时进行不能直接退出的问题
- 调整 coroutine `max_concurrency` 配置项，只允许在 `Co::set()` 中使用
- 调整 `Coroutine::join()` 忽略不存在的协程

## v4.8.1

### 新增 API

- 新增 `swoole_error_log_ex()` 和 `swoole_ignore_error()` 函数 (#4440) (@matyhtf)

### 增强

- 迁移 ext-swoole_plus 中的 admin api 到 ext-swoole (#4441) (@matyhtf)
- admin server 新增 get_composer_packages 命令 (swoole/library@07763f46) (swoole/library@8805dc05) (swoole/library@175f1797) (@sy-records) (@yunbaoi)
- 增加了写操作的 POST 方法请求限制 (swoole/library@ac16927c) (@yunbaoi)
- admin server 支持获取类方法信息 (swoole/library@690a1952) (@djw1028769140) (@sy-records)
- 优化 admin server 代码 (swoole/library#128) (swoole/library#131) (@sy-records)
- admin server 支持并发请求多个目标和并发请求多个 API (swoole/library#124) (@sy-records)
- admin server 支持获取接口信息 (swoole/library#130) (@sy-records)
- SWOOLE_HOOK_CURL 支持 CURLOPT_HTTPPROXYTUNNEL (swoole/library#126) (@sy-records)

### 修复

- join 方法禁止并发调用同一个协程 (#4442) (@matyhtf)
- 修复 Table 原子锁意外释放的问题 (#4446) (@Txhua) (@matyhtf)
- 修复丢失的 helper options (swoole/library#123) (@sy-records)
- 修复 get_static_property_value 命令参数错误 (swoole/library#129) (@sy-records)

## v4.8.0

### 向下不兼容改动

- 在 base 模式下，onStart 回调将始终在第一个工作进程 (worker id 为 0) 启动时回调，先于 onWorkerStart 执行 (#4389) (@matyhtf)

### 新增 API

- 新增 `Co::getStackUsage()` 方法 (#4398) (@matyhtf) (@twose)
- 新增 `Coroutine\Redis` 的一些 API (#4390) (@chrysanthemum)
- 新增 `Table::stats()` 方法 (#4405) (@matyhtf)
- 新增 `Coroutine::join()` 方法 (#4406) (@matyhtf)

### 新增功能

- 支持 server command (#4389) (@matyhtf)
- 支持 `Server::onBeforeShutdown` 事件回调 (#4415) (@matyhtf)

### 增强

- 当 Websocket pack 失败时设置错误码 (swoole/swoole-src@d27c5a5) (@matyhtf)
- 新增 `Timer::exec_count` 字段 (#4402) (@matyhtf)
- hook mkdir 支持使用 open_basedir ini 配置 (#4407) (@NathanFreeman)
- library 新增 vendor_init.php 脚本 (swoole/library@6c40b02) (@matyhtf)
- SWOOLE_HOOK_CURL 支持 CURLOPT_UNIX_SOCKET_PATH (swoole/library#121) (@sy-records)
- Client 支持设置 ssl_ciphers 配置项 (#4432) (@amuluowin)
- 为 `Server::stats()` 添加了一些新的信息 (#4410) (#4412) (@matyhtf)

### 修复

- 修复文件上传时，对文件名字进行不必要的 URL decode (swoole/swoole-src@a73780e) (@matyhtf)
- 修复 HTTP2 max_frame_size 问题 (#4394) (@twose)
- 修复 curl_multi_select bug #4393 (#4418) (@matyhtf)
- 修复丢失的 coroutine options (#4425) (@sy-records)
- 修复当发送缓冲区满的时候，连接无法被 close 的问题 (swoole/swoole-src@2198378) (@matyhtf)

## v4.7.1

### 增强

- `System::dnsLookup` 支持查询 `/etc/hosts` (#4341) (#4349) (@zmyWL) (@NathanFreeman)
- 增加对 mips64 的 boost context 支持 (#4358) (@dixyes)
- `SWOOLE_HOOK_CURL` 支持 `CURLOPT_RESOLVE` 选项 (swoole/library#107) (@sy-records)
- `SWOOLE_HOOK_CURL` 支持 `CURLOPT_NOPROGRESS` 选项 (swoole/library#117) (@sy-records)
- 增加对 riscv64 的 boost context 支持 (#4375) (@dixyes)

### 修复

- 修复 PHP-8.1 在 on shutdown 时产生的内存错误 (#4325) (@twose)
- 修复 8.1.0beta1 的不可序列化类 (#4335) (@remicollet)
- 修复多个协程递归创建目录失败的问题 (#4337) (@NathanFreeman)
- 修复 native curl 在外网发送大文件偶发超时的问题，以及在 CURL WRITEFUNCTION 中使用协程文件 API 出现 crash 的问题 (#4360) (@matyhtf)
- 修复 `PDOStatement::bindParam()` 期望参数1为字符串的问题 (swoole/library#116) (@sy-records)

## v4.7.0

### 新增 API

- 新增 `Process\Pool::detach()` 方法 (#4221) (@matyhtf)
- `Server` 支持 `onDisconnect` 回调函数 (#4230) (@matyhtf)
- 新增 `Coroutine::cancel()` 和 `Coroutine::isCanceled()` 方法 (#4247) (#4249) (@matyhtf)
- `Http\Client` 支持 `http_compression` 和 `body_decompression` 选项 (#4299) (@matyhtf)

### 增强

- 支持协程 MySQL 客户端在 `prepare` 时字段严格类型 (#4238) (@Yurunsoft)
- DNS 支持 `c-ares` 库 (#4275) (@matyhtf)
- `Server` 支持在多端口监听时给不同的端口配置心跳检测时间 (#4290) (@matyhtf)
- `Server` 的 `dispatch_mode` 支持 `SWOOLE_DISPATCH_CO_CONN_LB` 和 `SWOOLE_DISPATCH_CO_REQ_LB` 模式 (#4318) (@matyhtf)
- `ConnectionPool::get()` 支持 `timeout` 参数 (swoole/library#108) (@leocavalcante)
- Hook Curl 支持 `CURLOPT_PRIVATE` 选项 (swoole/library#112) (@sy-records)
- 优化 `PDOStatementProxy::setFetchMode()` 方法的函数声明 (swoole/library#109) (@yespire)

### 修复

- 修复使用线程上下文的时候，创建大量协程时抛出无法创建线程的异常 (8ce5041) (@matyhtf)
- 修复安装 Swoole 时 php_swoole.h 头文件丢失的问题 (#4239) (@sy-records)
- 修复 EVENT_HANDSHAKE 不向下兼容的问题 (#4248) (@sy-records)
- 修复 SW_LOCK_CHECK_RETURN 宏可能会调用两次函数的问题 (#4302) (@zmyWL)
- 修复 `Atomic\Long` 在 M1 芯片下的问题 (e6fae2e) (@matyhtf)
- 修复 `Coroutine\go()` 丢失返回值的问题 (swoole/library@1ed49db) (@matyhtf)
- 修复 `StringObject` 返回值类型问题 (swoole/library#111) (swoole/library#113) (@leocavalcante) (@sy-records)

### 内核

- 禁止 Hook 已经被 PHP 禁用的函数 (#4283) (@twose)

### 测试

- 新增 `Cygwin` 环境下的构建 (#4222) (@sy-records)
- 新增 `alpine 3.13` 和 `3.14` 的编译测试 (#4309) (@limingxinleo)

## v4.6.7

### 增强

- Manager 进程和 Task 同步进程支持调用`Process::signal()`函数 (#4190) (@matyhtf)

### 修复

- 修复信号不能被重复注册的问题 (#4170) (@matyhtf)
- 修复在 OpenBSD/NetBSD 上编译失败的问题 (#4188) (#4194) (@devnexen)
- 修复监听可写事件时特殊情况 onClose 事件丢失 (#4204) (@matyhtf)
- 修复 Symfony HttpClient 使用 native curl 的问题 (#4204) (@matyhtf)
- 修复`Http\Response::end()`方法总是返回 true 的问题 (swoole/swoole-src@66fcc35) (@matyhtf)
- 修复 PDOStatementProxy 产生的 PDOException (swoole/library#104) (@twose)

### 内核

- 重构 worker buffer，给 event data 加上 msg id 标志 (#4163) (@matyhtf)
- 修改 Request Entity Too Large 日志等级为 warning 级别 (#4175) (@sy-records)
- 替换 inet_ntoa and inet_aton 函数 (#4199) (@remicollet)
- 修改 output_buffer_size 默认值为 UINT_MAX (swoole/swoole-src@46ab345) (@matyhtf)

## v4.6.6

### 增强

- 支持在 FreeBSD 下 Master 进程退出后向 Manager 进程发送 SIGTERM 信号 (#4150) (@devnexen)
- 支持将 Swoole 静态编译到 PHP 中 (#4153) (@matyhtf)
- 支持 SNI 使用 HTTP 代理  (#4158) (@matyhtf)

### 修复

- 修复同步客户端异步连接的错误 (#4152) (@matyhtf)
- 修复 Hook 原生 curl multi 导致的内存泄漏 (swoole/swoole-src@91bf243) (@matyhtf)

## v4.6.5

### 新增 API

- 在 WaitGroup 中增加 count 方法(swoole/library#100) (@sy-records) (@deminy)

### 增强

- 支持原生 curl multi (#4093) (#4099) (#4101) (#4105) (#4113) (#4121) (#4147) (swoole/swoole-src@cd7f51c) (@matyhtf) (@sy-records) (@huanghantao)
- 允许在使用 HTTP/2 的 Response 中使用数组设置 headers

### 修复

- 修复 NetBSD 构建 (#4080) (@devnexen)
- 修复 OpenBSD 构建 (#4108) (@devnexen)
- 修复 illumos/solaris 构建，只有成员别名 (#4109) (@devnexen)
- 修复握手未完成时，SSL 连接的心跳检测不生效 (#4114) (@matyhtf)
- 修复 Http\Client 使用代理时`host`中存在`host:port`产生的错误 (#4124) (@Yurunsoft)
- 修复 Swoole\Coroutine\Http::request 中 header 和 cookie 的设置 (swoole/library#103) (@leocavalcante) (@deminy)

### 内核

- 支持 BSD 上的 asm context (#4082) (@devnexen)
- 在 FreeBSD 下使用 arc4random_buf 来实现 getrandom (#4096) (@devnexen)
- 优化 darwin arm64 context：删除 workaround 使用 label (#4127) (@devnexen)

### 测试

- 添加 alpine 的构建脚本 (#4104) (@limingxinleo)

## v4.6.4

### 新增 API

- 新增 Coroutine\Http::request, Coroutine\Http::post, Coroutine\Http::get 函数 (swoole/library#97) (@matyhtf)

### 增强

- 支持 ARM 64 构建 (#4057) (@devnexen)
- 支持在 Swoole TCP 服务器中设置 open_http_protocol (#4063) (@matyhtf)
- 支持 ssl 客户端只设置 certificate (91704ac) (@matyhtf)
- 支持 FreeBSD 的 tcp_defer_accept 选项 (#4049) (@devnexen)

### 修复

- 修复使用 Coroutine\Http\Client 时缺少代理授权的问题 (edc0552) (@matyhtf)
- 修复 Swoole\Table 的内存分配问题 (3e7770f) (@matyhtf)
- 修复 Coroutine\Http2\Client 并发连接时的 crash (630536d) (@matyhtf)
- 修复 DTLS 的 enable_ssl_encrypt 问题 (842733b) (@matyhtf)
- 修复 Coroutine\Barrier 内存泄漏(swoole/library#94) (@Appla) (@FMiS)
- 修复由 CURLOPT_PORT 和 CURLOPT_URL 顺序引起的偏移错误 (swoole/library#96) (@sy-records)
- 修复`Table::get($key, $field)`当字段类型为 float 时的错误 (08ea20c) (@matyhtf)
- 修复 Swoole\Table 内存泄漏 (d78ca8c) (@matyhtf)

## v4.4.24

### 修复

- 修复 http2 客户端并发连接时的 crash (#4079)

## v4.6.3

### 新增 API

- 新增 Swoole\Coroutine\go 函数 (swoole/library@82f63be) (@matyhtf)
- 新增 Swoole\Coroutine\defer 函数 (swoole/library@92fd0de) (@matyhtf)

### 增强

- 为 HTTP 服务器添加 compression_min_length 选项 (#4033) (@matyhtf)
- 允许在应用层设置 Content-Length HTTP 头 (#4041) (@doubaokun)

### 修复

- 修复程序达到文件打开限制时的 coredump (swoole/swoole-src@709813f) (@matyhtf)
- 修复 JIT 被禁用问题 (#4029) (@twose)
- 修复 `Response::create()` 参数错误问题 (swoole/swoole-src@a630b5b) (@matyhtf)
- 修复 ARM 平台下投递 task 时 task_worker_id 误报 (#4040) (@doubaokun)
- 修复 PHP8 开启 native curl hook 时的 coredump (#4042)(#4045) (@Yurunsoft) (@matyhtf)
- 修复 fatal error 时 shutdown 阶段的内存越界错误 (#4050) (@matyhtf)

### 内核

- 优化 ssl_connect/ssl_shutdown (#4030) (@matyhtf)
- 发生 fatal error 时直接退出进程 (#4053) (@matyhtf)

## v4.6.2

### 新增 API

- 新增 `Http\Request\getMethod()` 方法 (#3987) (@luolaifa000)
- 新增 `Coroutine\Socket->recvLine()` 方法 (#4014) (@matyhtf)
- 新增 `Coroutine\Socket->readWithBuffer()` 方法 (#4017) (@matyhtf)

### 增强

- 增强 `Response\create()` 方法，可以独立于 Server 使用 (#3998) (@matyhtf)
- 支持 `Coroutine\Redis->hExists` 在设置了 compatibility_mode 之后返回 bool 类型 (swoole/swoole-src@b8cce7c) (@matyhtf)
- 支持 `socket_read` 设置 PHP_NORMAL_READ 选项 (swoole/swoole-src@b1a0dcc) (@matyhtf)

### 修复

- 修复 `Coroutine::defer` 在 PHP8 下 coredump 的问题 (#3997) (@huanghantao)
- 修复当使用 thread context 的时候，错误设置 `Coroutine\Socket::errCode` 的问题 (swoole/swoole-src@004d08a) (@matyhtf)
- 修复在最新的 macos 下 Swoole 编译失败的问题 (#4007) (@matyhtf)
- 修复当 md5_file 参数传入 url 导致 php stream context 为空指针的问题 (#4016) (@ZhiyangLeeCN)

### 内核

- 使用 AIO 线程池 hook stdio（解决之前把 stdio 视为 socket 导致的多协程读写问题） (#4002) (@matyhtf)
- 重构 HttpContext (#3998) (@matyhtf)
- 重构 `Process::wait()` (#4019) (@matyhtf)

## v4.6.1

### 增强

- 增加 `--enable-thread-context` 编译选项 (#3970) (@matyhtf)
- 在操作 session_id 时检查连接是否存在 (#3993) (@matyhtf)
- 增强 CURLOPT_PROXY (swoole/library#87) (@sy-records)

### 修复

- 修复 pecl 安装中的最小 PHP 版本 (#3979) (@remicollet)
- 修复 pecl 安装时没有 `--enable-swoole-json` 和 `--enable-swoole-curl` 选项 (#3980) (@sy-records)
- 修复 openssl 线程安全问题 (b516d69f) (@matyhtf)
- 修复 enableSSL coredump (#3990) (@huanghantao)

### 内核

- 优化 ipc writev ，避免当事件数据为空时产生 coredump (9647678) (@matyhtf)

## v4.5.11

### 增强

- 优化 Swoole\Table (#3959) (@matyhtf)
- 增强 CURLOPT_PROXY (swoole/library#87) (@sy-records)

### 修复

- 修复 Table 递增和递减时不能清除所有列问题 (#3956) (@matyhtf) (@sy-records)
- 修复编译时产生的`clock_id_t`错误 (49fea171) (@matyhtf)
- 修复 fread bugs (#3972) (@matyhtf)
- 修复 ssl 多线程 crash (7ee2c1a0) (@matyhtf)
- 兼容 uri 格式错误导致报错 Invalid argument supplied for foreach (swoole/library#80) (@sy-records)
- 修复 trigger_error 参数错误 (swoole/library#86) (@sy-records)

## v4.6.0

### 向下不兼容改动

- 移除了`session id`的最大限制，不再重复 (#3879) (@matyhtf)
- 使用协程时禁用不安全功能，包括`pcntl_fork`/`pcntl_wait`/`pcntl_waitpid`/`pcntl_sigtimedwait` (#3880) (@matyhtf)
- 默认启用 coroutine hook (#3903) (@matyhtf)

### 移除

- 不再支持 PHP7.1 (4a963df) (9de8d9e) (@matyhtf)

### 废弃

- 将 `Event::rshutdown()` 标记为已弃用，请改用 Coroutine\run (#3881) (@matyhtf)

### 新增 API

- 支持 setPriority/getPriority (#3876) (@matyhtf)
- 支持 native-curl hook (#3863) (@matyhtf) (@huanghantao)
- 支持 Server 事件回调函数传递对象风格的参数，默认不传递对象风格的参数 (#3888) (@matyhtf)
- 支持 hook sockets 扩展 (#3898) (@matyhtf)
- 支持重复 header (#3905) (@matyhtf)
- 支持 SSL sni (#3908) (@matyhtf)
- 支持 hook stdio (#3924) (@matyhtf)
- 支持 stream_socket 的 capture_peer_cert 选项 (#3930) (@matyhtf)
- 添加 Http\Request::create/parse/isCompleted (#3938) (@matyhtf)
- 添加 Http\Response::isWritable (db56827) (@matyhtf)

### 增强

- Server 的所有时间精度都从 int 修改为 double (#3882) (@matyhtf)
- 在 swoole_client_select 函数里面检查 poll 函数的 EINTR 情况 (#3909) (@shiguangqi)
- 添加协程死锁检测 (#3911) (@matyhtf)
- 支持使用 SWOOLE_BASE 模式在另一个进程中关闭连接 (#3916) (@matyhtf)
- 优化 Server master 进程与 worker 进程通信的性能，减少内存拷贝 (#3910) (@huanghantao) (@matyhtf)

### 修复

- 当 Coroutine\Channel 被关闭时，pop 出里面所有的数据 (960431d) (@matyhtf)
- 修复使用 JIT 时的内存错误 (#3907) (@twose)
- 修复 `port->set()` dtls 编译错误 (#3947) (@Yurunsoft)
- 修复 connection_list 错误 (#3948) (@sy-records)
- 修复 ssl verify (#3954) (@matyhtf)
- 修复 Table 递增和递减时不能清除所有列问题 (#3956) (@matyhtf) (@sy-records)
- 修复使用 LibreSSL 2.7.5 编译失败 (#3962) (@matyhtf)
- 修复未定义的常量 CURLOPT_HEADEROPT 和 CURLOPT_PROXYHEADER (swoole/library#77) (@sy-records)

### 内核

- 默认情况下忽略 SIGPIPE 信号 (9647678) (@matyhtf)
- 支持同时运行 PHP 协程和 C 协程 (c94bfd8) (@matyhtf)
- 添加 get_elapsed 测试 (#3961) (@luolaifa000)
- 添加 get_init_msec 测试 (#3964) (@luffluo)

## v4.5.10

### 修复

- 修复使用 Event::cycle 时产生的 coredump (93901dc) (@matyhtf)
- 兼容 PHP8 (f0dc6d3) (@matyhtf)
- 修复 connection_list 错误 (#3948) (@sy-records)

## v4.4.23

### 修复

- 修复 Swoole\Table 自减时数据错误 (bcd4f60d)(0d5e72e7) (@matyhtf)
- 修复同步客户端错误信息 (#3784)
- 修复解析表单数据边界时出现的内存溢出问题 (#3858)
- 修复 channel 的bug，关闭后无法 pop 已有数据

## v4.5.9

### 增强

- 为 Coroutine\Http\Client 添加 SWOOLE_HTTP_CLIENT_ESTATUS_SEND_FAILED 常量 (#3873) (@sy-records)

### 修复

- 兼容 PHP8 (#3868) (#3869) (#3872) (@twose) (@huanghantao) (@doubaokun)
- 修复未定义的常量 CURLOPT_HEADEROPT 和 CURLOPT_PROXYHEADER (swoole/library#77) (@sy-records)
- 修复 CURLOPT_USERPWD (swoole/library@7952a7b) (@twose)

## v4.5.8

### 新增 API

- 新增 swoole_error_log 函数，优化log_rotation (swoole/swoole-src@67d2bff) (@matyhtf)
- readVector 和 writeVector 支持 SSL (#3857) (@huanghantao)

### 增强

- 当子进程退出后，让 System::wait 退出阻塞 (#3832) (@matyhtf)
- DTLS 支持 16K 的包 (#3849) (@matyhtf)
- Response::cookie 方法支持 priority 参数 (#3854) (@matyhtf)
- 支持更多的 CURL 选项 (swoole/library#71) (@sy-records)
- 处理 CURL HTTP header 没有区分名字大小写导致被覆盖问题 (swoole/library#76) (@filakhtov) (@twose) (@sy-records)

### 修复

- 修复 readv_all 和 writev_all 错误处理 EAGAIN 的问题 (#3830) (@huanghantao)
- 修复 PHP8 编译警告的问题 (swoole/swoole-src@03f3fb0) (@matyhtf)
- 修复 Swoole\Table 二进制安全的问题 (#3842) (@twose)
- 修复 MacOS 下 System::writeFile 追加文件覆盖的问题 (swoole/swoole-src@a71956d) (@matyhtf)
- 修复 CURL 的 CURLOPT_WRITEFUNCTION (swoole/library#74) (swoole/library#75) (@sy-records)
- 修复解析 HTTP form-data 时内存溢出的问题 (#3858) (@twose)
- 修复在 PHP8 中 `is_callable()` 无法访问类私有方法的问题 (#3859) (@twose)

### 内核

- 重构内存分配函数，使用 SwooleG.std_allocator (#3853) (@matyhtf)
- 重构管道 (#3841) (@matyhtf)

## v4.5.7

### 新增 API

- Coroutine\Socket 客户端新增 writeVector, writeVectorAll, readVector, readVectorAll 方法 (#3764) (@huanghantao)

### 增强

- 为 server->stats 增加 task_worker_num 和 dispatch_count (#3771) (#3806) (@sy-records) (@matyhtf)
- 添加了扩展依赖项，包括 json, mysqlnd, sockets (#3789) (@remicollet)
- 限制 server->bind 的 uid 最小值为 INT32_MIN (#3785) (@sy-records)
- 为 swoole_substr_json_decode 添加了编译选项，支持负偏移量 (#3809) (@matyhtf)
- 支持 CURL 的 CURLOPT_TCP_NODELAY 选项 (swoole/library#65) (@sy-records) (@deminy)

### 修复

- 修复同步客户端连接信息错误 (#3784) (@twose)
- 修复 hook scandir 函数的问题 (#3793) (@twose)
- 修复协程屏障 barrier 中的错误 (swoole/library#68) (@sy-records)

### 内核

- 使用 boost.stacktrace 优化 print-backtrace (#3788) (@matyhtf)

## v4.5.6

### 新增 API

- 新增 `swoole_substr_unserialize` 和 `swoole_substr_json_decode` (#3762) (@matyhtf)

### 增强

- 修改 `Coroutine\Http\Server` 的 `onAccept` 方法为私有 (dfcc83b) (@matyhtf)

### 修复

- 修复 coverity 的问题 (#3737) (#3740) (@matyhtf)
- 修复 Alpine 环境下的一些问题 (#3738) (@matyhtf)
- 修复 swMutex_lockwait (0fc5665) (@matyhtf)
- 修复 PHP-8.1 安装失败 (#3757) (@twose)

### 内核

- 为 `Socket::read/write/shutdown` 添加了活性检测 (#3735) (@matyhtf)
- 将 session_id 和 task_id 的类型更改为 int64 (#3756) (@matyhtf)

## v4.5.5

> [!NOTE]
> 此版本增加了[配置项](/zh/server/setting.html)检测功能，如果设置了不是Swoole提供的选项，会产生一个Warning。

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

### 新增 API

- 增加 Process\Manager，修改 Process\ProcessManager 为别名 (swoole/library#eac1ac5) (@matyhtf)
- 支持 HTTP2 服务器 GOAWAY (#3710) (@doubaokun)
- 增加 `Co\map()` 函数 (swoole/library#57) (@leocavalcante)

### 增强

- 支持 http2 unix socket 客户端 (#3668) (@sy-records)
- 当 worker 进程退出之后设置 worker 进程状态为 SW_WORKER_EXIT (#3724) (@matyhtf)
- 在 `Server::getClientInfo()` 的返回值中增加 send_queued_bytes 和 recv_queued_bytes (#3721) (#3731) (@matyhtf) (@Yurunsoft)
- Server 支持 stats_file 配置选项 (#3725) (@matyhtf) (@Yurunsoft)

### 修复

- 修复 PHP8 下的编译问题 (zend_compile_string change) (#3670) (@twose)
- 修复 PHP8 下的编译问题 (ext/sockets compatibility) (#3684) (@twose)
- 修复 PHP8 下的编译问题 (php_url_encode_hash_ex change) (#3713) (@remicollet)
- 修复从'const char*' to 'char*'的错误类型转化 (#3686) (@remicollet)
- 修复 HTTP2 client 在 HTTP proxy 下无法工作的问题 (#3677) (@matyhtf) (@twose)
- 修复 PDO 断线重连时数据混乱的问题 (swoole/library#54) (@sy-records)
- 修复 UDP Server 使用ipv6时端口解析错误
- 修复 Lock::lockwait 超时无效的问题

## v4.5.4

### 向下不兼容改动

- SWOOLE_HOOK_ALL 包括 SWOOlE_HOOK_CURL (#3606) (@matyhtf)
- 移除 ssl_method，增加 ssl_protocols (#3639) (@Yurunsoft)

### 新增 API

- 增加数组的 firstKey 和 lastKey 方法 (swoole/library#51) (@sy-records)

### 增强

- 增加 Websocket 服务器的 open_websocket_ping_frame, open_websocket_pong_frame 配置项 (#3600) (@Yurunsoft)

### 修复

- 修复文件大于 2G 时候，fseek ftell 不正确的问题 (#3619) (@Yurunsoft)
- 修复 Socket barrier 的问题 (#3627) (@matyhtf)
- 修复 http proxy handshake 的问题 (#3630) (@matyhtf)
- 修复对端发送 chunk 数据的时候，解析 HTTP Header 出错的问题 (#3633) (@matyhtf)
- 修复 zend_hash_clean 断言失败的问题 (#3634) (@twose)
- 修复不能从事件循环移除 broken fd 的问题 (#3650) (@matyhtf)
- 修复收到无效的 packet 时导致 coredump 的问题 (#3653) (@matyhtf)
- 修复 array_key_last 的 bug (swoole/library#46) (@sy-records)

### 内核

- 代码优化 (#3615) (#3617) (#3622) (#3635) (#3640) (#3641) (#3642) (#3645) (#3658) (@matyhtf)
- 当往 Swoole Table 写入数据的时候减少不必要的内存操作 (#3620) (@matyhtf)
- 重构 AIO (#3624) (@Yurunsoft)
- 支持 readlink/opendir/readdir/closedir hook (#3628) (@matyhtf)
- 优化 swMutex_create, 支持 SW_MUTEX_ROBUST (#3646) (@matyhtf)

## v4.5.3

### 新增API

- 增加 `Swoole\Process\ProcessManager` (swoole/library#88f147b) (@huanghantao)
- 增加 ArrayObject::append, StringObject::equals (swoole/library#f28556f) (@matyhtf)
- 增加 [Coroutine\parallel](/zh/coroutine/coroutine_api.html#parallel) (swoole/library#6aa89a9) (@matyhtf)
- 增加 [Coroutine\Barrier](/zh/coroutine/barrier.html) (swoole/library#2988b2a) (@matyhtf)

### 增强

- 增加 usePipelineRead 来支持 http2 client streaming (#3354) (@twose)
- http 客户端下载文件时，在接受数据前不创建文件 (#3381) (@twose)
- http client 支持`bind_address`和`bind_port`配置 (#3390) (@huanghantao)
- http client 支持`lowercase_header`配置 (#3399) (@matyhtf)
- `Swoole\Server`支持`tcp_user_timeout`配置 (#3404) (@huanghantao)
- `Coroutine\Socket`增加 event barrier 来减少协程切换 (#3409) (@matyhtf)
- 为特定的 swString 增加`memory allocator` (#3418) (@matyhtf)
- cURL 支持`__toString` (swoole/library#38) (@twose)
- 支持直接在 WaitGroup 构造函数中设置`wait count` (swoole/library#2fb228b8) (@matyhtf)
- 增加`CURLOPT_REDIR_PROTOCOLS` (swoole/library#46) (@sy-records)
- http1.1 server 支持 trailer (#3485) (@huanghantao)
- 协程 sleep 时间小于 1ms 将会 yield 当前协程 (#3487) (@Yurunsoft)
- http static handler 支持软连接的文件 (#3569) (@LeiZhang-Hunter)
- 在 Server 调用完 close 方法之后立刻关闭 WebSocket 连接 (#3570) (@matyhtf)
- 支持 hook stream_set_blocking (#3585) (@Yurunsoft)
- 异步 HTTP2 server 支持流控 (#3486) (@huanghantao) (@matyhtf)
- 释放 socket buffer 在 onPackage 回调函数执行完 (#3551) (@huanghantao) (@matyhtf)

### 修复

- 修复 WebSocket coredump, 处理协议错误的状态 (#3359) (@twose)
- 修复 swSignalfd_setup 函数以及 wait_signal 函数里的空指针错误 (#3360) (@twose)
- 修复在设置了 dispatch_func 时候，调用`Swoole\Server::close`会报错的问题 (#3365) (@twose)
- 修复`Swoole\Redis\Server::format`函数中 format_buffer 初始化问题 (#3369) (@matyhtf) (@twose)
- 修复 MacOS 上无法获取 mac 地址的问题 (#3372) (@twose)
- 修复 MySQL 测试用例 (#3374) (@qiqizjl)
- 修复多处 PHP8 兼容性问题 (#3384) (#3458) (#3578) (#3598) (@twose)
- 修复 hook 的 socket write 中丢失了 php_error_docref, timeout_event 和返回值问题 (#3383) (@twose)
- 修复异步 Server 无法在`WorkerStart`回调函数中关闭 Server 的问题 (#3382) (@huanghantao)
- 修复心跳线程在操作 conn->socket 的时候，可能会发生 coredump 的问题 (#3396) (@huanghantao)
- 修复 send_yield 的逻辑问题 (#3397) (@twose) (@matyhtf)
- 修复 Cygwin64 上的编译问题 (#3400) (@twose)
- 修复 WebSocket finish 属性无效的问题 (#3410) (@matyhtf)
- 修复遗漏的 MySQL transaction 错误状态 (#3429) (@twose)
- 修复 hook 后的`stream_select`与 hook 之前返回值行为不一致的问题 (#3440) (@Yurunsoft)
- 修复使用`Coroutine\System`来创建子进程时丢失`SIGCHLD`信号的问题 (#3446) (@huanghantao)
- 修复`sendwait`不支持 SSL 的问题 (#3459) (@huanghantao)
- 修复`ArrayObject`和`StringObject`的若干问题 (swoole/library#44) (@matyhtf)
- 修复 mysqli 异常信息错误 (swoole/library#45) (@sy-records)
- 修复当设置`open_eof_check`后，`Swoole\Client`无法获取正确的`errCode`的问题 (#3478) (@huanghantao)
- 修复 MacOS 上 `atomic->wait()`/`wakeup()`的若干问题 (#3476) (@Yurunsoft)
- 修复`Client::connect`连接拒绝的时候，返回成功状态的问题 (#3484) (@matyhtf)
- 修复 alpine 环境下 nullptr_t 没有被声明的问题 (#3488) (@limingxinleo)
- 修复 HTTP Client 下载文件的时候，double-free 的问题 (#3489) (@Yurunsoft)
- 修复`Server`被销毁时候，`Server\Port`没释放导致的内存泄漏问题 (#3507) (@twose)
- 修复 MQTT 协议解析问题 (318e33a) (84d8214) (80327b3) (efe6c63) (@GXhua) (@sy-records)
- 修复`Coroutine\Http\Client->getHeaderOut`方法导致的 coredump 问题 (#3534) (@matyhtf)
- 修复 SSL 验证失败后，丢失了错误信息的问题 (#3535) (@twose)
- 修复 README 中，`Swoole benchmark`链接错误的问题 (#3536) (@sy-records) (@santalex)
- 修复在`HTTP header/cookie`中使用`CRLF`后导致的`header`注入问题 (#3539) (#3541) (#3545) (@chromium1337) (@huanghantao)
- 修复 issue #3463 中提到的变量错误的问题 (#3547) (chromium1337) (@huanghantao)
- 修复 pr #3463 中提到的错别字问题 (#3547) (@deminy)
- 修复协程 WebSocket 服务器 frame->fd 为空的问题 (#3549) (@huanghantao)
- 修复心跳线程错误判断连接状态导致的连接泄漏问题 (#3534) (@matyhtf)
- 修复`Process\Pool`中阻塞了信号的问题 (#3582) (@huanghantao) (@matyhtf)
- 修复`SAPI`中使用 send headers 的问题 (#3571) (@twose) (@sshymko)
- 修复`CURL`执行失败的时候，未设置`errCode`和`errMsg`的问题 (swoole/library#1b6c65e) (@sy-records)
- 修复当调用了`setProtocol`方法后，`swoole_socket_coro`accept coredump 的问题 (#3591) (@matyhtf)

### 内核

- 使用 C++风格 (#3349) (#3351) (#3454) (#3479) (#3490) (@huanghantao) (@matyhtf)
- 增加`Swoole known strings`来提高`PHP`对象读属性的性能 (#3363) (@huanghantao)
- 多处代码优化 (#3350) (#3356) (#3357) (#3423) (#3426) (#3461) (#3463) (#3472) (#3557) (#3583) (@huanghantao) (@twose) (@matyhtf)
- 多处测试代码的优化 (#3416) (#3481) (#3558) (@matyhtf)
- 简化`Swoole\Table`的`int`类型 (#3407) (@matyhtf)
- 增加`sw_memset_zero`，并且替换`bzero`函数 (#3419) (@CismonX)
- 优化日志模块 (#3432) (@matyhtf)
- 多处 libswoole 重构 (#3448) (#3473) (#3475) (#3492) (#3494) (#3497) (#3498) (#3526) (@matyhtf)
- 多处头文件引入重构 (#3457) (@matyhtf) (@huanghantao)
- 增加`Channel::count()`和`Channel::get_bytes()` (f001581) (@matyhtf)
- 增加`scope guard` (#3504) (@huanghantao)
- 增加 libswoole 覆盖率测试 (#3431) (@huanghantao)
- 增加 lib-swoole/ext-swoole MacOS 环境的测试 (#3521) (@huanghantao)
- 增加 lib-swoole/ext-swoole Alpine 环境的测试 (#3537) (@limingxinleo)

## v4.5.2

[v4.5.2](https://github.com/swoole/swoole-src/releases/tag/v4.5.2)，这是一个 BUG 修复版本, 没有任何向下不兼容改动

### 增强

- 支持 `Server->set(['log_rotation' => SWOOLE_LOG_ROTATION_DAILY])` 来按日期生成日志 (#3311) (@matyhtf)
- 支持 `swoole_async_set(['wait_signal' => true])`, 若存在信号监听器时 reactor 将不会退出 (#3314) (@matyhtf)
- 支持 `Server->sendfile` 发送空文件 (#3318) (@twose)
- 优化 worker 忙闲警告信息 (#3328) (@huanghantao)
- 优化 HTTPS 代理下关于 Host 标头的配置 (使用 ssl_host_name 来配置) (#3343) (@twose)
- SSL 默认使用 ecdh auto 模式 (#3316) (@matyhtf)
- SSL 客户端在连接断开时使用静默退出 (#3342) (@huanghantao)

### 修复

- 修复 `Server->taskWait` 在 OSX 平台上的问题 (#3330) (@matyhtf)
- 修复 MQTT 协议解析错误的 bug (8dbf506b) (@guoxinhua) (2ae8eb32) (@twose)
- 修复 Content-Length int 类型溢出的问题 (#3346) (@twose)
- 修复 PRI 包长度检查缺失的问题 (#3348) (@twose)
- 修复 CURLOPT_POSTFIELDS 无法置空的问题 (swoole/library@ed192f64) (@twose)
- 修复 最新的连接对象在接收到下一个连接之前无法被释放的问题 (swoole/library@1ef79339) (@twose)

### 内核

- Socket 写入零拷贝特性 (#3327) (@twose)
- 使用 swoole_get_last_error/swoole_set_last_error 两个来替代全局变量读写 (e25f262a) (@matyhtf) (#3315) (@huanghantao)

## v4.5.1

[v4.5.1](https://github.com/swoole/swoole-src/releases/tag/v4.5.1)，这是一个 BUG 修复版本, 补充了本应在`v4.5.0`引入的 System 文件函数废弃标记

### 增强

- 支持 hook 下的 socket_context 的 bindto 配置 (#3275) (#3278) (@codinghuang)
- 支持 client::sendto 自动 dns 解析地址 (#3292) (@codinghuang)
- Process->exit(0)将会直接导致进程退出, 若要执行 shutdown_functions 再退出请使用 PHP 提供的 exit (a732fe56) (@matyhtf)
- 支持配置`log_date_format`以更改日志日期格式, `log_date_with_microseconds`在日志中显示微秒时间戳 (baf895bc) (@matyhtf)
- 支持 CURLOPT_CAINFO and CURLOPT_CAPATH (swoole/library#32) (@sy-records)
- 支持 CURLOPT_FORBID_REUSE (swoole/library#33) (@sy-records)

### 修复

- 修复 32 位下构建失败 (#3276) (#3277) (@remicollet) (@twose)
- 修复协程 Client 重复连接时没有 EISCONN 错误信息的问题 (#3280) (@codinghuang)
- 修复 Table 模块中潜在的 bug (d7b87b65) (@matyhtf)
- 修复 Server 中由于未定义行为导致的空指针(防御性编程) (#3304) (#3305) (@twose)
- 修复心跳配置开启后产生空指针错误的问题 (#3307) (@twose)
- 修复 mysqli 配置不生效 (swoole/library#35)
- 修复 response 中不规范的 header(缺少空格)时解析的问题 (swoole/library#27) (@Yurunsoft)

### 废弃

- 将 Coroutine\System::(fread/fgets/fwrite)等方法标记为废弃 (请使用 hook 特性替代, 直接使用 PHP 提供的文件函数) (c7c9bb40) (@twose)

### 内核

- 使用 zend_object_alloc 为自定义对象分配内存 (cf1afb25) (@twose)
- 一些优化, 为日志模块添加更多配置项 (#3296) (@matyhtf)
- 大量代码优化工作和增加单测 (swoole/library) (@deminy)

## v4.5.0

[v4.5.0](https://github.com/swoole/swoole-src/releases/tag/v4.5.0)，这是一个大版本更新, 仅删除了一些在 v4.4.x 已标记废弃的模块

### 新增 API

- DTLS 支持, 现在可以此功能来构建 WebRTC 应用 (#3188) (@matyhtf)
- 内置的`FastCGI`客户端, 可以通过一行代码来代理请求到 FPM 或是调用 FPM 应用 (swoole/library#17) (@twose)
- `Co::wait`, `Co::waitPid` (用于回收子进程) `Co::waitSignal` (用于等待信号) (#3158) (@twose)
- `Co::waitEvent` (用于等待 socket 上发生的指定的事件) (#3197) (@twose)
- `Co::set(['exit_condition' => $callable])` (用于自定义程序退出的条件) (#2918) (#3012) (@twose)
- `Co::getElapsed` (获取协程运行的时间以便于分析统计或找出僵尸协程) (#3162) (@doubaokun)
- `Socket::checkLiveness` (通过系统调用判断连接是否活跃), `Socket::peek` (窥视读缓冲区) (#3057) (@twose)
- `Socket->setProtocol(['open_fastcgi_protocol' => $bool])` (内置的 FastCGI 解包支持) (#3103) (@twose)
- `Server::get(Master|Manager|Worker)Pid`, `Server::getWorkerId` (获取异步 Server 单例和其信息) (#2793) (#3019) (@matyhtf)
- `Server::getWorkerStatus` (获取 worker 进程状态, 返回常量 SWOOLE_WORKER_BUSY, SWOOLE_WORKER_IDLE 以表示忙闲状态) (#3225) (@matyhtf)
- `Server->on('beforeReload', $callable)` 和 `Server->on('afterReload', $callable)` (服务重启事件, 发生在 manager 进程) (#3130) (@hantaohuang)
- `Http\Server`静态文件处理器现在支持`http_index_files`和`http_autoindex`配置 (#3171) (@hantaohuang)
- `Http2\Client->read(float $timeout = -1)`方法支持读取流式的响应 (#3011) (#3117) (@twose)
- `Http\Request->getContent` (rawContent 方法的别名) (#3128) (@hantaohuang)
- `swoole_mime_type_(add|set|delete|get|exists)()` (mime 相关 APIs, 可增删查改内置的 mime 类型) (#3134) (@twose)

### 增强

- 优化 master 和 worker 进程间的内存拷贝(极限情况下提升了四倍性能) (#3075) (#3087) (@hantaohuang)
- 优化 WebSocket 派遣逻辑 (#3076) (@matyhtf)
- 优化 WebSocket 构造帧时的一次内存拷贝 (#3097) (@matyhtf)
- 优化 SSL 验证模块 (#3226) (@matyhtf)
- 分离 SSL accept 和 SSL handshake, 解决慢速 SSL 客户端可能会造成协程服务器假死的问题 (#3214) (@twose)
- 支持 MIPS 架构 (#3196) (@ekongyun)
- UDP 客户端现在可以自动解析传入的域名 (#3236) (#3239) (@huanghantao)
- Coroutine\Http\Server 增加支持了一些常用的选项 (#3257) (@twose)
- 支持在 WebSocket 握手时设置 cookie (#3270) (#3272) (@twose)
- 支持 CURLOPT_FAILONERROR (swoole/library#20) (@sy-records)
- 支持 CURLOPT_SSLCERTTYPE, CURLOPT_SSLCERT, CURLOPT_SSLKEYTYPE, CURLOPT_SSLKEY (swoole/library#22) (@sy-records)
- 支持 CURLOPT_HTTPGET (swoole/library@d730bd08) (@shiguangqi)

### 移除

- 移除`Runtime::enableStrictMode`方法 (b45838e3) (@twose)
- 移除`Buffer`类 (559a49a8) (@twose)

### 内核相关

- 新的 C++的 API: coroutine::async 函数传入 lambda 即可发起异步线程任务 (#3127) (@matyhtf)
- 重构底层 event-API 中的整数型 fd 为 swSocket 对象 (#3030) (@matyhtf)
- 所有核心的 C 文件都已转化为 C++文件 (#3030) (71f987f3) (@matyhtf)
- 一系列代码优化 (#3063) (#3067) (#3115) (#3135) (#3138) (#3139) (#3151) (#3168) (@hantaohuang)
- 对于头文件的规范化优化 (#3051) (@matyhtf)
- 重构`enable_reuse_port`配置项使其更加规范 (#3192) (@matyhtf)
- 重构 Socket 相关 API 使其更加规范 (#3193) (@matyhtf)
- 通过缓冲区预测来减少一次不必要的系统调用 (3b5aa85d) (@matyhtf)
- 移除底层的刷新定时器 swServerGS::now, 直接使用时间函数获取时间 (#3152) (@hantaohuang)
- 优化协议配置器 (#3108) (@twose)
- 兼容性更好的 C 结构初始化写法 (#3069) (@twose)
- bit 字段统一为 uchar 类型 (#3071) (@twose)
- 支持并行测试, 速度更快 (#3215) (@twose)

### 修复

- 修复 enable_delay_receive 开启后 onConnect 无法触发的问题 (#3221) (#3224) (@matyhtf)
- 所有其它的 bug 修复都已合并到 v4.4.x 分支并在更新日志中体现, 在此不再赘述

## v4.4.22

### 修复

- 修复 HTTP2 client 在 HTTP proxy 下无法工作的问题 (#3677) (@matyhtf) (@twose)
- 修复 PDO 断线重连时数据混乱的问题 (swoole/library#54) (@sy-records)
- 修复 swMutex_lockwait (0fc5665) (@matyhtf)
- 修复 UDP Server 使用ipv6时端口解析错误
- 修复 systemd fds 的问题

## v4.4.20

[v4.4.20](https://github.com/swoole/swoole-src/releases/tag/v4.4.20)，这是一个BUG修复版本, 没有任何向下不兼容改动

### 修复

- 修复在设置了 dispatch_func 时候，调用`Swoole\Server::close`会报错的问题 (#3365) (@twose)
- 修复`Swoole\Redis\Server::format`函数中 format_buffer 初始化问题 (#3369) (@matyhtf) (@twose)
- 修复 MacOS 上无法获取 mac 地址的问题 (#3372) (@twose)
- 修复 MySQL 测试用例 (#3374) (@qiqizjl)
- 修复异步 Server 无法在`WorkerStart`回调函数中关闭 Server 的问题 (#3382) (@huanghantao)
- 修复遗漏的 MySQL transaction 错误状态 (#3429) (@twose)
- 修复 HTTP Client 下载文件的时候，double-free 的问题 (#3489) (@Yurunsoft)
- 修复`Coroutine\Http\Client->getHeaderOut`方法导致的 coredump 问题 (#3534) (@matyhtf)
- 修复在`HTTP header/cookie`中使用`CRLF`后导致的`header`注入问题 (#3539) (#3541) (#3545) (@chromium1337) (@huanghantao)
- 修复协程 WebSocket 服务器 frame->fd 为空的问题 (#3549) (@huanghantao)
- 修复 hook phpredis 产生的`read error on connection`问题 (#3579) (@twose)
- 修复 MQTT 协议解析问题 (#3573) (#3517) (9ad2b455) (@GXhua) (@sy-records)

## v4.4.19

[v4.4.19](https://github.com/swoole/swoole-src/releases/tag/v4.4.19)，这是一个 BUG 修复版本, 没有任何向下不兼容改动

> [!NOTE]
> 注意: v4.4.x 不再是主要的维护版本，仅在必要时修复 BUG

### 修复

- 从 v4.5.2 合并了所有 bug 修复补丁

## v4.4.18

[v4.4.18](https://github.com/swoole/swoole-src/releases/tag/v4.4.18)，这是一个 BUG 修复版本, 没有任何向下不兼容改动

### 增强

- UDP 客户端现在可以自动解析传入的域名 (#3236) (#3239) (@huanghantao)
- CLI 模式下不再关闭 stdout 和 stderr (显示在 shutdown 之后产生的错误日志) (#3249) (@twose)
- Coroutine\Http\Server 增加支持了一些常用的选项 (#3257) (@twose)
- 支持在 WebSocket 握手时设置 cookie (#3270) (#3272) (@twose)
- 支持 CURLOPT_FAILONERROR (swoole/library#20) (@sy-records)
- 支持 CURLOPT_SSLCERTTYPE, CURLOPT_SSLCERT, CURLOPT_SSLKEYTYPE, CURLOPT_SSLKEY (swoole/library#22) (@sy-records)
- 支持 CURLOPT_HTTPGET (swoole/library@d730bd08) (@shiguangqi)
- 尽可能地兼容了所有 PHP-Redis 扩展的版本 (不同版本的构造函数传参不同) (swoole/library#24) (@twose)
- 禁止克隆连接对象 (swoole/library#23) (@deminy)

### 修复

- 修复 SSL 握手失败的问题 (dc5ac29a) (@twose)
- 修复生成错误信息时产生的内存错误 (#3229) (@twose)
- 修复空白的 proxy 验证信息 (#3243) (@twose)
- 修复 Channel 的内存泄漏问题 (并非真正的内存泄漏) (#3260) (@twose)
- 修复 Co\Http\Server 在循环引用时产生的一次性内存泄露 (#3271) (@twose)
- 修复`ConnectionPool->fill`中的书写错误 (swoole/library#18) (@NHZEX)
- 修复 curl 客户端遭遇重定向时没有更新连接的问题 (swoole/library#21) (@doubaokun)
- 修复产生 ioException 时空指针的问题 (swoole/library@4d15a4c3) (@twose)
- 修复 ConnectionPool@put 传入 null 时没有归还新连接导致的死锁问题 (swoole/library#25) (@Sinute)
- 修复 mysqli 代理实现导致的 write_property 错误 (swoole/library#26) (@twose)

## v4.4.17

[v4.4.17](https://github.com/swoole/swoole-src/releases/tag/v4.4.17)，这是一个 BUG 修复版本, 没有任何向下不兼容改动

### 增强

- 提升 SSL 服务器的性能 (#3077) (85a9a595) (@matyhtf)
- 移除 HTTP 头大小限制 (#3187) limitation (@twose)
- 支持 MIPS (#3196) (@ekongyun)
- 支持 CURLOPT_HTTPAUTH (swoole/library@570318be) (@twose)

### 修复

- 修复 package_length_func 的行为和可能的一次性内存泄漏 (#3111) (@twose)
- 修复 HTTP 状态码 304 下的错误行为 (#3118) (#3120) (@twose)
- 修复 Trace 日志错误的宏展开导致的内存错误 (#3142) (@twose)
- 修复 OpenSSL 函数签名 (#3154) (#3155) (@twose)
- 修复 SSL 错误信息 (#3172) (@matyhtf) (@twose)
- 修复 PHP-7.4 下的兼容性 (@twose) (@matyhtf)
- 修复 HTTP-chunk 的长度解析错误问题 (19a1c712) (@twose)
- 修复 chunked 模式下 multipart 请求的解析器行为 (3692d9de) (@twose)
- 修复 PHP-Debug 模式下 ZEND_ASSUME 断言失败 (fc0982be) (@twose)
- 修复 Socket 错误的地址 (d72c5e3a) (@twose)
- 修复 Socket getname (#3177) (#3179) (@matyhtf)
- 修复静态文件处理器对于空文件的错误处理 (#3182) (@twose)
- 修复 Coroutine\Http\Server 上传文件问题 (#3189) (#3191) (@twose)
- 修复 shutdown 期间可能的内存错误 (44aef60a) (@matyhtf)
- 修复 Server->heartbeat (#3203) (@matyhtf)
- 修复 CPU 调度器可能无法调度死循环的情况 (#3207) (@twose)
- 修复在不可变数组上的无效写入操作 (#3212) (@twose)
- 修复 WaitGroup 多次 wait 问题 (swoole/library@537a82e1) (@twose)
- 修复空 header 的处理 (和 cURL 保持一致) (swoole/library@7c92ed5a) (@twose)
- 修复非 IO 方法返回 false 时抛出异常的问题 (swoole/library@f6997394) (@twose)
- 修复 cURL-hook 下使用 proxy 端口号被多次添加到标头的问题 (swoole/library@5e94e5da) (@twose)

## v4.4.16

[v4.4.16](https://github.com/swoole/swoole-src/releases/tag/v4.4.16)，这是一个 BUG 修复版本, 没有任何向下不兼容改动

### 增强

- 现在你可以获取 [Swoole 版本支持信息](https://github.com/swoole/swoole-src/blob/master/SUPPORTED.md)
- 更友好的错误提示 (0412f442) (09a48835) (@twose)
- 防止在某些特殊系统上陷入系统调用死循环 (069a0092) (@matyhtf)
- 在 PDOConfig 中增加驱动选项 (swoole/library#8) (@jcheron)

### 修复

- 修复 http2_session.default_ctx 内存错误 (bddbb9b1) (@twose)
- 修复未初始化的 http_context (ce77c641) (@twose)
- 修复 Table 模块中的书写错误 (可能会造成内存错误) (db4eec17) (@twose)
- 修复 Server 中 task-reload 的潜在问题 (e4378278) (@GXhua)
- 修复不完整协程 HTTP 服务器请求原文 (#3079) (#3085) (@hantaohuang)
- 修复 static handler (当文件为空时, 不应返回 404 响应) (#3084) (@Yurunsoft)
- 修复 http_compression_level 配置无法正常工作 (16f9274e) (@twose)
- 修复 Coroutine HTTP2 Server 由于没有注册 handle 而产生空指针错误 (ed680989) (@twose)
- 修复配置 socket_dontwait 不工作的问题 (27589376) (@matyhtf)
- 修复 zend::eval 可能会被执行多次的问题 (#3099) (@GXhua)
- 修复 HTTP2 服务器由于在连接关闭后响应而产生的空指针错误 (#3110) (@twose)
- 修复 PDOStatementProxy::setFetchMode 适配不当的问题 (swoole/library#13) (@jcheron)
