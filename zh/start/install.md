# 安装 Swoole

本文档以 **Ubuntu 22.04** 为例，介绍 Swoole 的完整安装流程。

> [!NOTE]
> 下文命令均以 root 权限执行。容器中通常默认就是 root；若使用普通用户，请自行在命令前加 `sudo`。

## 版本要求

不同 PHP 版本与 Swoole 版本的对应关系如下：

| Swoole 版本 | 最低 PHP 版本 |
|:---|:---|
| `6.0` | PHP `8.1` |
| `6.1` | PHP `8.1` |
| `6.2` | PHP `8.2` |

## 安装 PHP

首先安装所需的 PHP 版本及其开发包：

```shell
apt update -yqq
apt install -yqq software-properties-common
LC_ALL=C.UTF-8 add-apt-repository ppa:ondrej/php
apt update -yqq
# 本文档修订时 PHP 8.4 为主流版本，可按需替换为目标版本
apt install php8.4-cli php8.4-dev
```

## 安装系统依赖

Swoole 的部分功能需要额外的系统库支持。下表中 **✅ 必需** 为编译 Swoole 所必需，**⚠️ 按需** 可根据实际使用的功能选装。

| 分类 | 软件包名称 | 作用说明 | 是否必需 |
|:---|:---|:---|:---|
| **编译工具** | `cmake` | CMake 构建工具，生成 Makefile | ✅ 必需 |
| | `make` | Make 构建工具，执行编译任务 | ✅ 必需 |
| | `gcc` | GNU C 编译器，编译 C/C++ 代码 | ✅ 必需 |
| **加密支持** | `libssl-dev` | OpenSSL 开发库，提供 HTTPS、加密等功能 | ✅ 必需 |
| **压缩算法** | `libbrotli-dev` | Brotli 压缩库，常用于网页压缩 | ⚠️ 按需 |
| | `zlib1g-dev` | zlib 压缩库，支持 gzip 格式 | ⚠️ 按需 |
| | `libzstd-dev` | Zstandard 压缩库，高性能压缩 | ⚠️ 按需 |
| **网络支持** | `libc-ares-dev` | 异步 DNS 解析库 | ⚠️ 按需 |
| | `libcurl4-openssl-dev` | PHP `curl` 扩展协程化支持<br>（需与 PHP `curl` 使用的 `libcurl` 版本一致，可通过 `php --ri curl` 查看） | ⚠️ 按需 |
| **数据库协程化** | `libmariadb-dev` `unixodbc-dev` `libaio-dev` `libaio1` | 支持 `pdo_odbc` 协程化 | ⚠️ 按需 |
| | `libpq-dev` | 支持 `pdo_pgsql` 协程化 | ⚠️ 按需 |
| | `sqlite3` `libsqlite3-dev` | 支持 `pdo_sqlite` 协程化 | ⚠️ 按需 |
| | `oracle-sdk-client` | 支持 `pdo_oci` 协程化 | ⚠️ 按需 |
| **高性能 I/O** | `liburing-dev` | Linux `io_uring` 用户态库，支持**文件异步 I/O** 和 **Socket 网络 I/O** 的高性能操作 | ⚠️ 按需 |

一次性安装上述常用依赖（按需删减）：

```shell
# 部分 Linux 发行版可能没有 libaio1，或者已经预装，安装前请先检查
apt update
apt install -y cmake make gcc libssl-dev libmariadb-dev unixodbc-dev \
  libaio-dev libaio1 sqlite3 libsqlite3-dev libzstd-dev zlib1g-dev \
  libbrotli-dev libc-ares-dev libpq-dev libcurl4-openssl-dev unzip
```

### 安装 liburing

`io_uring` 相关文件异步 I/O 依赖 `liburing`，Swoole 6.0 需 `2.6` 以上，Swoole 6.2 需 `2.8` 以上。发行版若未提供合适版本，可从源码安装：

```shell
wget https://github.com/axboe/liburing/archive/refs/tags/liburing-2.6.tar.gz
tar zxf liburing-2.6.tar.gz
cd liburing-liburing-2.6 && ./configure && make -j$(nproc) && make install
```

### 安装 Oracle Instant Client

用于 `pdo_oci` 协程化支持。以下命令可写入 shell 脚本后直接执行：

```shell
#!/bin/sh -e
if [ "$(uname -m)" = "aarch64" ]; then
  arch="arm64"
else
  arch="x64"
fi

wget -nv -O instantclient-basiclite-linux${arch}.zip https://download.oracle.com/otn_software/linux/instantclient/1930000/instantclient-basiclite-linux.${arch}-19.30.0.0.0dbru.zip
unzip instantclient-basiclite-linux${arch}.zip && rm instantclient-basiclite-linux${arch}.zip
wget -nv -O instantclient-sdk-linux${arch}.zip https://download.oracle.com/otn_software/linux/instantclient/1930000/instantclient-sdk-linux.${arch}-19.30.0.0.0dbru.zip
unzip instantclient-sdk-linux${arch}.zip && rm instantclient-sdk-linux${arch}.zip
mv instantclient_*_* ./instantclient
rm ./instantclient/sdk/include/ldap.h
echo DISABLE_INTERRUPT=on > ./instantclient/network/admin/sqlnet.ora
mv ./instantclient /usr/local/
echo '/usr/local/instantclient' > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

## 安装 Swoole 扩展

可通过以下任一种方式安装 Swoole。

### 方式一：使用 PECL 安装（推荐）

```shell
pecl install swoole
```

如需在安装时预先配置功能选项，可使用 `-D` 或 `--configureoptions` 参数：

```shell
# 示例：启用 openssl 和 mysqlnd，禁用 sockets
pecl install -D 'enable-sockets="no" enable-openssl="yes" enable-mysqlnd="yes" enable-swoole-curl="yes" enable-cares="yes"' swoole
```

### 方式二：使用 PIE 安装

先下载 [PIE](https://github.com/php/pie/releases)，然后执行：

```shell
pie install swoole/swoole:6.2.0
```

也可在安装前指定功能选项：

```shell
pie install swoole/swoole:6.2.0 --enable-sockets --enable-swoole-curl
```

### 方式三：从源码编译安装

1. 下载源码包，可从以下任一地址获取：
    - [GitHub Releases](https://github.com/swoole/swoole-src/releases)
    - [PECL](https://pecl.php.net/package/swoole)
    - [Gitee](https://gitee.com/swoole/swoole/tags)

2. 进入目录并编译安装：

    ```shell
    cd swoole-src
    phpize
    ./configure --enable-swoole-curl --enable-iouring
    make -j$(nproc) && make install
    ```

## 启用扩展

1. 找到 `php.ini` 文件位置：`php --ini | grep "Loaded Configuration File"`
2. 在该文件中添加一行：`extension=swoole.so`
3. 验证安装是否成功：`php -m | grep swoole`

若无输出，请检查 `php.ini` 路径是否正确；若提示加载失败，通常是缺少上一步的依赖库或 `extension` 路径不匹配。

## 使用 swoole-cli

如果对在服务器上同时编译 `PHP` 和 `Swoole` 感到繁琐，推荐使用 `swoole-cli` 二进制编译产物，无需自行安装 PHP 与编译扩展。

- **开箱即用**：`swoole-cli` 是一个增强版的独立 PHP 可执行程序，集成了 PHP 内核、Swoole 扩展及常用功能，无需额外编译即可直接运行。
- **极速部署**：省去复杂的编译步骤，通过二进制方式实现快速部署。
- **下载链接**：[swoole-cli](https://www.swoole.com/download)

```shell
tar xf swoole-cli-v6.2.0-linux-x64.tar.xz
chmod +x ./swoole-cli
./swoole-cli -v
```

## 编译选项详解

PECL/PIE 或源码安装执行 `./configure` 时，可添加以下参数以开启特定功能。

### 通用功能选项

| 参数 | 说明 | 备注 |
|:---|:---|:---|
| `--enable-openssl` | 启用 SSL/TLS 支持。 | Swoole 6.2 版本后该选项已被废弃，默认启用 SSL/TLS 支持。 |
| `--with-openssl-dir` | 指定 OpenSSL 库路径。 | Swoole 6.2 版本后仅用于修改默认路径。 |
| `--enable-http2` | 开启 HTTP2 协议支持。 | Swoole 5 起默认启用。 |
| `--enable-swoole-json` | 启用 `swoole_substr_json_decode` 函数。 | Swoole 5 起默认启用。 |
| `--enable-swoole-curl` | 启用对原生 `curl` 的协程化支持（[`SWOOLE_HOOK_NATIVE_CURL`](/zh/coroutine/hook.html#swoole-hook-native-curl)）。 | 要求 PHP 与 Swoole 使用相同的 `libcurl`，并安装 PHP `curl` 扩展。 |
| `--enable-cares` | 启用 `c-ares` 异步 DNS 解析支持。 | 依赖 `c-ares` 库。 |
| `--enable-brotli` | 启用 Brotli 压缩算法支持。 | 依赖 `libbrotli` 库。 |
| `--with-brotli-dir` | 指定 Brotli 库路径。 | 依赖 `libbrotli` 库。 |
| `--enable-swoole-pgsql` | 启用 PostgreSQL 数据库的协程化支持。 | 依赖 `libpq` 库。 |
| `--with-swoole-odbc` | 启用 `pdo_odbc` 的协程化支持。 | 依赖 `unixodbc-dev`。示例：`--with-swoole-odbc="unixODBC,/usr"` |
| `--with-swoole-oracle` | 启用 `pdo_oci` 的协程化支持，用于 Oracle 数据库。 | 依赖 `oracle-client-sdk` 库。示例：`--with-swoole-oracle=instantclient,/usr/local/instantclient` |
| `--enable-swoole-sqlite` | 启用 `pdo_sqlite` 的协程化支持。 | 依赖 `sqlite3`、`libsqlite3-dev` 库。 |
| `--enable-swoole-thread` | 开启[多线程模式](/zh/thread/create.html)，将进程模型变为单进程多线程。 | 要求 PHP 为 ZTS 版本，Swoole 6.0+。 |
| `--enable-iouring` | 使用 `io_uring` 替代线程池处理[文件异步 I/O](/zh/file_async.html)。 | 需高版本 Linux 内核及 `liburing >= 2.6`（Swoole 6.2+ 需 `>= 2.8`）。 |
| `--with-liburing-dir` | 指定 `liburing` 库路径。 | 需高版本 Linux 内核及 `liburing >= 2.6`（Swoole 6.2+ 需 `>= 2.8`）。 |
| `--enable-uring-socket` | 使用 `io_uring` 替代 `epoll/kqueue` 处理 Socket I/O。 | 依赖 `--enable-iouring`，Swoole 6.2+。 |
| `--enable-zstd` | 启用 Zstandard 压缩算法支持。 | 依赖 `libzstd` 库，Swoole 6.0+。 |
| `--with-swoole-ssh2` | 启用 `ssh2` 的协程化支持。 | Swoole 6.2+ 可用。 |
| `--enable-swoole-ftp` | 启用 `ftp` 的协程化支持。 | Swoole 6.2+ 可用。 |

### 特殊与调试选项

| 参数 | 说明 | 备注 |
|:---|:---|:---|
| `--enable-mysqlnd` | 启用 `mysqlnd` 支持，用于 `Coroutine\MySQL::escape` 方法。 | 需 PHP 已安装 `mysqlnd` 扩展。 |
| `--enable-sockets` | 允许将 PHP `sockets` 扩展创建的资源添加到 Swoole 的[事件循环](/zh/event.html)中。 | |
| `--enable-debug` | 开启调试模式，用于 `gdb` 跟踪。 | **生产环境禁用** |
| `--enable-debug-log` | 开启内核 DEBUG 日志。 | **生产环境禁用**，Swoole 4.2+。 |
| `--enable-trace-log` | 开启追踪日志，打印详细调试信息。 | **仅供内核开发使用** |
| `--enable-swoole-coro-time` | 启用协程运行时间计算。 | |

## 特殊平台与环境

### 嵌入式 / 特定架构平台

针对 ARM 和 MIPS 等平台，推荐使用 GCC 进行交叉编译。

| 平台 | 适用设备 | 编译注意事项 |
|:---|:---|:---|
| **ARM** | 树莓派等 | 编译 Swoole 时，建议手动修改 `Makefile`，**移除 `-O2` 优化参数**。 |
| **MIPS** | OpenWrt 路由器等 | 直接使用 GCC 进行交叉编译。 |

### Windows 平台（WSL）

推荐使用 **Windows Subsystem for Linux (WSL)**，安装方式与原生 Linux 环境一致，但需注意以下配置差异：

- **必须关闭 [`daemonize`](/zh/server/setting.html#daemonize) 选项**。
- **内核兼容性**：若 WSL 版本低于 `17101`，在执行 `./configure` 后，需手动修改 `config.h` 文件，关闭 `HAVE_SIGNALFD` 宏定义。

### Docker 官方镜像

官方提供了完善的 Docker 镜像支持，相关资源如下：

- **GitHub 仓库**：[swoole/docker-swoole](https://github.com/swoole/docker-swoole)
- **Docker Hub**：[phpswoole/swoole](https://hub.docker.com/r/phpswoole/swoole)

## 扩展冲突

由于某些用于跟踪调试的 PHP 扩展大量使用了全局变量，可能会引发 Swoole 协程的崩溃问题。建议关闭以下相关扩展：

- `phptrace`
- `aop`
- `molten`
- `xhprof`
- `phalcon`（Swoole 协程无法在 phalcon 框架中运行）

### Xdebug 调试

自 Swoole `5.1` 版本起，可直接使用 `Xdebug` 扩展对 Swoole 程序进行调试。可通过修改 `php.ini` 配置启用：

```ini
swoole.enable_fiber_mock=On
```

或通过命令行启动：

```shell
php -d swoole.enable_fiber_mock=On your_file.php
```
