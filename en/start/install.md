# Installing Swoole

This document uses **Ubuntu 22.04** as an example to describe the complete Swoole installation process.

> [!NOTE]
> All commands below are executed with root privileges. In containers you are usually root by default; if you use a regular user, prepend `sudo` to the commands yourself.

## Version Requirements

The correspondence between PHP versions and Swoole versions is as follows:

| Swoole Version | Minimum PHP Version |
|:---|:---|
| `6.0` | PHP `8.0` |
| `6.1` | PHP `8.1` |
| `6.2` | PHP `8.2` |

## Installing PHP

First install the required PHP version and its development package:

```shell
apt update -yqq
apt install -yqq software-properties-common
LC_ALL=C.UTF-8 add-apt-repository ppa:ondrej/php
apt update -yqq
# PHP 8.4 is the mainstream version as of this document's revision; replace it with your target version as needed
apt install php8.4-cli php8.4-dev
```

## Installing System Dependencies

Some Swoole features require additional system libraries. In the table below, **✅ Required** means required to compile Swoole, and **⚠️ Optional** means it can be installed selectively depending on the features you actually use.

| Category | Package | Description | Required |
|:---|:---|:---|:---|
| **Build tools** | `cmake` | CMake build tool, generates the Makefile | ✅ Required |
| | `make` | Make build tool, executes the compilation tasks | ✅ Required |
| | `gcc` | GNU C compiler, compiles C/C++ code | ✅ Required |
| **Encryption support** | `libssl-dev` | OpenSSL development library, provides HTTPS, encryption, and related features | ✅ Required |
| **Compression algorithms** | `libbrotli-dev` | Brotli compression library, commonly used for web page compression | ✅ Required |
| | `zlib1g-dev` | zlib compression library, supports the gzip format | ⚠️ Optional |
| | `libzstd-dev` | Zstandard compression library, high-performance compression | ⚠️ Optional |
| **Networking support** | `libc-ares-dev` | Asynchronous DNS resolution library | ⚠️ Optional |
| | `libcurl4-openssl-dev` | Coroutine support for the PHP `curl` extension<br>(must match the `libcurl` version used by PHP `curl`; check with `php --ri curl`) | ⚠️ Optional |
| **Database coroutines** | `libmariadb-dev` `unixodbc-dev` `libaio-dev` `libaio1` | Coroutine support for `pdo_odbc` | ⚠️ Optional |
| | `libpq-dev` | Coroutine support for `pdo_pgsql` | ⚠️ Optional |
| | `sqlite3` `libsqlite3-dev` | Coroutine support for `pdo_sqlite` | ⚠️ Optional |
| | `oracle-sdk-client` | Coroutine support for `pdo_oci` | ⚠️ Optional |
| **High-performance I/O** | `liburing-dev` | Linux `io_uring` userspace library, supports high-performance **async file I/O** and **socket network I/O** | ⚠️ Optional |

Install the common dependencies above in one go (trim as needed):

```shell
# Some Linux distributions may not have libaio1, or it may already be preinstalled; check before installing
apt update
apt install -y cmake make gcc libssl-dev libmariadb-dev unixodbc-dev \
  libaio-dev libaio1 sqlite3 libsqlite3-dev libzstd-dev zlib1g-dev \
  libbrotli-dev libc-ares-dev libpq-dev libcurl4-openssl-dev unzip
```

### Installing liburing

`io_uring`-based async file I/O depends on `liburing`: Swoole 6.0 requires `2.6` or above, and Swoole 6.2 requires `2.8` or above. If your distribution does not provide a suitable version, install it from source:

```shell
wget https://github.com/axboe/liburing/archive/refs/tags/liburing-2.6.tar.gz
tar zxf liburing-2.6.tar.gz
cd liburing-liburing-2.6 && ./configure && make -j$(nproc) && make install
```

### Installing Oracle Instant Client

Used for `pdo_oci` coroutine support. The following commands can be written into a shell script and executed directly:

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

## Installing the Swoole Extension

Swoole can be installed in any of the following ways.

### Option 1: Install via PECL (Recommended)

```shell
pecl install swoole
```

To preconfigure feature options at install time, use the `-D` or `--configureoptions` parameter:

```shell
# Example: enable openssl and mysqlnd, disable sockets
pecl install -D 'enable-sockets="no" enable-openssl="yes" enable-mysqlnd="yes" enable-swoole-curl="yes" enable-cares="yes"' swoole
```

### Option 2: Install via PIE

First download [PIE](https://github.com/php/pie/releases), then run:

```shell
pie install swoole/swoole:6.2.0
```

Feature options can also be specified before installation:

```shell
pie install swoole/swoole:6.2.0 --enable-socket --enable-swoole-curl
```

### Option 3: Build from Source

1. Download the source package from any of the following addresses:
    - [GitHub Releases](https://github.com/swoole/swoole-src/releases)
    - [PECL](https://pecl.php.net/package/swoole)
    - [Gitee](https://gitee.com/swoole/swoole/tags)

2. Enter the directory and build and install:

    ```shell
    cd swoole-src
    phpize
    ./configure --enable-swoole-curl --enable-iouring
    make -j$(nproc) && make install
    ```

## Enabling the Extension

1. Find the location of the `php.ini` file: `php --ini | grep "Loaded Configuration File"`
2. Add a line to that file: `extension=swoole.so`
3. Verify the installation succeeded: `php -m | grep swoole`

If there is no output, check that the `php.ini` path is correct; if loading fails, it is usually because a dependency library from the previous step is missing or the `extension` path does not match.

## Using swoole-cli

If compiling both `PHP` and `Swoole` on the server feels cumbersome, the `swoole-cli` prebuilt binary is recommended — no need to install PHP or compile the extension yourself.

- **Out of the box**: `swoole-cli` is an enhanced standalone PHP executable that bundles the PHP kernel, the Swoole extension, and common features, ready to run without extra compilation.
- **Rapid deployment**: skips the complex compilation steps and enables fast deployment via a binary.
- **Download link**: [swoole-cli](https://www.swoole.com/download)

```shell
tar xf swoole-cli-v6.2.0-linux-x64.tar.xz
chmod +x ./swoole-cli
./swoole-cli -v
```

## Build Options

When running `./configure` during a PECL/PIE or source installation, the following parameters can be added to enable specific features.

### General Feature Options

| Parameter | Description | Notes |
|:---|:---|:---|
| `--enable-openssl` | Enables SSL/TLS support. | Deprecated since Swoole 6.2; SSL/TLS support is enabled by default. |
| `--with-openssl-dir` | Specifies the OpenSSL library path. | Since Swoole 6.2, only used to change the default path. |
| `--enable-http2` | Enables HTTP2 protocol support. | Enabled by default since Swoole 5. |
| `--enable-swoole-json` | Enables the `swoole_substr_json_decode` function. | Enabled by default since Swoole 5. |
| `--enable-swoole-curl` | Enables coroutine support for native `curl` ([`SWOOLE_HOOK_NATIVE_CURL`](/en/coroutine/hook.html#swoole-hook-native-curl)). | Requires PHP and Swoole to use the same `libcurl`, and the PHP `curl` extension to be installed. |
| `--enable-cares` | Enables `c-ares` asynchronous DNS resolution support. | Depends on the `c-ares` library. |
| `--enable-brotli` | Enables Brotli compression algorithm support. | Depends on the `libbrotli` library. |
| `--with-brotli-dir` | Specifies the Brotli library path. | Depends on the `libbrotli` library. |
| `--enable-swoole-pgsql` | Enables coroutine support for the PostgreSQL database. | Depends on the `libpq` library. |
| `--with-swoole-odbc` | Enables coroutine support for `pdo_odbc`. | Depends on `unixodbc-dev`. Example: `--with-swoole-odbc="unixODBC,/usr"` |
| `--with-swoole-oracle` | Enables coroutine support for `pdo_oci`, for the Oracle database. | Depends on the `oracle-client-sdk` library. Example: `--with-swoole-oracle=instantclient,/usr/local/instantclient` |
| `--enable-swoole-sqlite` | Enables coroutine support for `pdo_sqlite`. | Depends on the `sqlite3` and `libsqlite3-dev` libraries. |
| `--enable-swoole-thread` | Enables [multithreaded mode](/en/thread/create.html), changing the process model to single-process multithreaded. | Requires a ZTS build of PHP, Swoole 6.0+. |
| `--enable-iouring` | Uses `io_uring` instead of the thread pool for [async file I/O](/en/file_async.html). | Requires a recent Linux kernel and `liburing >= 2.8`, Swoole 6.0+. |
| `--enable-iouring-dir` | Specifies the `liburing` library path. | Requires a recent Linux kernel and `liburing >= 2.8`, Swoole 6.0+. |
| `--enable-uring-socket` | Uses `io_uring` instead of `epoll/kqueue` for socket I/O. | Depends on `--enable-iouring`, Swoole 6.2+. |
| `--enable-zstd` | Enables Zstandard compression algorithm support. | Depends on the `libzstd` library, Swoole 6.0+. |
| `--with-swoole-ssh2` | Enables coroutine support for `ssh2`. | Available in Swoole 6.2+. |
| `--enable-swoole-ftp` | Enables coroutine support for `ftp`. | Available in Swoole 6.2+. |

### Special and Debug Options

| Parameter | Description | Notes |
|:---|:---|:---|
| `--enable-mysqlnd` | Enables `mysqlnd` support, used by the `Coroutine\MySQL::escape` method. | Requires the PHP `mysqlnd` extension to be installed. |
| `--enable-sockets` | Allows resources created by the PHP `sockets` extension to be added to Swoole's [event loop](/en/event.html). | |
| `--enable-debug` | Enables debug mode for tracing with `gdb`. | **Disable in production** |
| `--enable-debug-log` | Enables kernel DEBUG logging. | **Disable in production**, Swoole 4.2+. |
| `--enable-trace-log` | Enables trace logging, printing detailed debug information. | **For kernel development only** |
| `--enable-swoole-coro-time` | Enables coroutine runtime measurement. | |

## Special Platforms and Environments

### Embedded / Architecture-Specific Platforms

For platforms such as ARM and MIPS, cross-compiling with GCC is recommended.

| Platform | Applicable Devices | Build Notes |
|:---|:---|:---|
| **ARM** | Raspberry Pi, etc. | When compiling Swoole, it is recommended to manually edit the `Makefile` and **remove the `-O2` optimization flag**. |
| **MIPS** | OpenWrt routers, etc. | Cross-compile directly with GCC. |

### Windows (WSL)

**Windows Subsystem for Linux (WSL)** is recommended. The installation procedure is the same as on native Linux, but note the following configuration differences:

- **The [`daemonize`](/en/server/setting.html#daemonize) option must be disabled**.
- **Kernel compatibility**: if the WSL version is below `17101`, after running `./configure` you must manually edit the `config.h` file and disable the `HAVE_SIGNALFD` macro definition.

### Official Docker Images

Official Docker image support is fully provided; the related resources are:

- **GitHub repository**: [swoole/docker-swoole](https://github.com/swoole/docker-swoole)
- **Docker Hub**: [phpswoole/swoole](https://hub.docker.com/r/phpswoole/swoole)

## Extension Conflicts

Some PHP extensions used for tracing and debugging make heavy use of global variables, which can cause crashes in Swoole coroutines. It is recommended to disable the following related extensions:

- `phptrace`
- `aop`
- `molten`
- `xhprof`
- `phalcon` (Swoole coroutines cannot run within the phalcon framework)

### Xdebug Debugging

Since Swoole `5.1`, the `Xdebug` extension can be used directly to debug Swoole programs. Enable it by modifying the `php.ini` configuration:

```ini
swoole.enable_fiber_mock=On
```

Or start from the command line:

```shell
php -d swoole.enable_fiber_mock=On your_file.php
```