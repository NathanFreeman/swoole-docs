# 安裝 Swoole

本文檔以 **Ubuntu 22.04** 爲例，介紹 Swoole 的完整安裝流程。

> [!NOTE]
> 下文命令均以 root 權限執行。容器中通常默認就是 root；若使用普通用戶，請自行在命令前加 `sudo`。

## 版本要求

不同 PHP 版本與 Swoole 版本的對應關係如下：

| Swoole 版本 | 最低 PHP 版本 |
|:---|:---|
| `6.0` | PHP `8.1` |
| `6.1` | PHP `8.1` |
| `6.2` | PHP `8.2` |

## 安裝 PHP

首先安裝所需的 PHP 版本及其開發包：

```shell
apt update -yqq
apt install -yqq software-properties-common
LC_ALL=C.UTF-8 add-apt-repository ppa:ondrej/php
apt update -yqq
# 本文檔修訂時 PHP 8.4 爲主流版本，可按需替換爲目標版本
apt install php8.4-cli php8.4-dev
```

## 安裝系統依賴

Swoole 的部分功能需要額外的系統庫支持。下表中 **✅ 必需** 爲編譯 Swoole 所必需，**⚠️ 按需** 可根據實際使用的功能選裝。

| 分類 | 軟件包名稱 | 作用說明 | 是否必需 |
|:---|:---|:---|:---|
| **編譯工具** | `cmake` | CMake 構建工具，生成 Makefile | ✅ 必需 |
| | `make` | Make 構建工具，執行編譯任務 | ✅ 必需 |
| | `gcc` | GNU C 編譯器，編譯 C/C++ 代碼 | ✅ 必需 |
| **加密支持** | `libssl-dev` | OpenSSL 開發庫，提供 HTTPS、加密等功能 | ✅ 必需 |
| **壓縮算法** | `libbrotli-dev` | Brotli 壓縮庫，常用於網頁壓縮 | ⚠️ 按需 |
| | `zlib1g-dev` | zlib 壓縮庫，支持 gzip 格式 | ⚠️ 按需 |
| | `libzstd-dev` | Zstandard 壓縮庫，高性能壓縮 | ⚠️ 按需 |
| **網絡支持** | `libc-ares-dev` | 異步 DNS 解析庫 | ⚠️ 按需 |
| | `libcurl4-openssl-dev` | PHP `curl` 擴展協程化支持<br>（需與 PHP `curl` 使用的 `libcurl` 版本一致，可通過 `php --ri curl` 查看） | ⚠️ 按需 |
| **數據庫協程化** | `libmariadb-dev` `unixodbc-dev` `libaio-dev` `libaio1` | 支持 `pdo_odbc` 協程化 | ⚠️ 按需 |
| | `libpq-dev` | 支持 `pdo_pgsql` 協程化 | ⚠️ 按需 |
| | `sqlite3` `libsqlite3-dev` | 支持 `pdo_sqlite` 協程化 | ⚠️ 按需 |
| | `oracle-sdk-client` | 支持 `pdo_oci` 協程化 | ⚠️ 按需 |
| **高性能 I/O** | `liburing-dev` | Linux `io_uring` 用戶態庫，支持**文件異步 I/O** 和 **Socket 網絡 I/O** 的高性能操作 | ⚠️ 按需 |

一次性安裝上述常用依賴（按需刪減）：

```shell
# 部分 Linux 發行版可能沒有 libaio1，或者已經預裝，安裝前請先檢查
apt update
apt install -y cmake make gcc libssl-dev libmariadb-dev unixodbc-dev \
  libaio-dev libaio1 sqlite3 libsqlite3-dev libzstd-dev zlib1g-dev \
  libbrotli-dev libc-ares-dev libpq-dev libcurl4-openssl-dev unzip
```

### 安裝 liburing

`io_uring` 相關文件異步 I/O 依賴 `liburing`，Swoole 6.0 需 `2.6` 以上，Swoole 6.2 需 `2.8` 以上。發行版若未提供合適版本，可從源碼安裝：

```shell
wget https://github.com/axboe/liburing/archive/refs/tags/liburing-2.6.tar.gz
tar zxf liburing-2.6.tar.gz
cd liburing-liburing-2.6 && ./configure && make -j$(nproc) && make install
```

### 安裝 Oracle Instant Client

用於 `pdo_oci` 協程化支持。以下命令可寫入 shell 腳本後直接執行：

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

## 安裝 Swoole 擴展

可通過以下任一種方式安裝 Swoole。

### 方式一：使用 PECL 安裝（推薦）

```shell
pecl install swoole
```

如需在安裝時預先配置功能選項，可使用 `-D` 或 `--configureoptions` 參數：

```shell
# 示例：啓用 openssl 和 mysqlnd，禁用 sockets
pecl install -D 'enable-sockets="no" enable-openssl="yes" enable-mysqlnd="yes" enable-swoole-curl="yes" enable-cares="yes"' swoole
```

### 方式二：使用 PIE 安裝

先下載 [PIE](https://github.com/php/pie/releases)，然後執行：

```shell
pie install swoole/swoole:6.2.0
```

也可在安裝前指定功能選項：

```shell
pie install swoole/swoole:6.2.0 --enable-sockets --enable-swoole-curl
```

### 方式三：從源碼編譯安裝

1. 下載源碼包，可從以下任一地址獲取：
    - [GitHub Releases](https://github.com/swoole/swoole-src/releases)
    - [PECL](https://pecl.php.net/package/swoole)
    - [Gitee](https://gitee.com/swoole/swoole/tags)

2. 進入目錄並編譯安裝：

    ```shell
    cd swoole-src
    phpize
    ./configure --enable-swoole-curl --enable-iouring
    make -j$(nproc) && make install
    ```

## 啓用擴展

1. 找到 `php.ini` 文件位置：`php --ini | grep "Loaded Configuration File"`
2. 在該文件中添加一行：`extension=swoole.so`
3. 驗證安裝是否成功：`php -m | grep swoole`

若無輸出，請檢查 `php.ini` 路徑是否正確；若提示加載失敗，通常是缺少上一步的依賴庫或 `extension` 路徑不匹配。

## 使用 swoole-cli

如果對在服務器上同時編譯 `PHP` 和 `Swoole` 感到繁瑣，推薦使用 `swoole-cli` 二進制編譯產物，無需自行安裝 PHP 與編譯擴展。

- **開箱即用**：`swoole-cli` 是一個增強版的獨立 PHP 可執行程序，集成了 PHP 內核、Swoole 擴展及常用功能，無需額外編譯即可直接運行。
- **極速部署**：省去複雜的編譯步驟，通過二進制方式實現快速部署。
- **下載鏈接**：[swoole-cli](https://www.swoole.com/download)

```shell
tar xf swoole-cli-v6.2.0-linux-x64.tar.xz
chmod +x ./swoole-cli
./swoole-cli -v
```

## 編譯選項詳解

PECL/PIE 或源碼安裝執行 `./configure` 時，可添加以下參數以開啓特定功能。

### 通用功能選項

| 參數 | 說明 | 備註 |
|:---|:---|:---|
| `--enable-openssl` | 啓用 SSL/TLS 支持。 | Swoole 6.2 版本後該選項已被廢棄，默認啓用 SSL/TLS 支持。 |
| `--with-openssl-dir` | 指定 OpenSSL 庫路徑。 | Swoole 6.2 版本後僅用於修改默認路徑。 |
| `--enable-http2` | 開啓 HTTP2 協議支持。 | Swoole 5 起默認啓用。 |
| `--enable-swoole-json` | 啓用 `swoole_substr_json_decode` 函數。 | Swoole 5 起默認啓用。 |
| `--enable-swoole-curl` | 啓用對原生 `curl` 的協程化支持（[`SWOOLE_HOOK_NATIVE_CURL`](/zh-hant/coroutine/hook.html#swoole-hook-native-curl)）。 | 要求 PHP 與 Swoole 使用相同的 `libcurl`，並安裝 PHP `curl` 擴展。 |
| `--enable-cares` | 啓用 `c-ares` 異步 DNS 解析支持。 | 依賴 `c-ares` 庫。 |
| `--enable-brotli` | 啓用 Brotli 壓縮算法支持。 | 依賴 `libbrotli` 庫。 |
| `--with-brotli-dir` | 指定 Brotli 庫路徑。 | 依賴 `libbrotli` 庫。 |
| `--enable-swoole-pgsql` | 啓用 PostgreSQL 數據庫的協程化支持。 | 依賴 `libpq` 庫。 |
| `--with-swoole-odbc` | 啓用 `pdo_odbc` 的協程化支持。 | 依賴 `unixodbc-dev`。示例：`--with-swoole-odbc="unixODBC,/usr"` |
| `--with-swoole-oracle` | 啓用 `pdo_oci` 的協程化支持，用於 Oracle 數據庫。 | 依賴 `oracle-client-sdk` 庫。示例：`--with-swoole-oracle=instantclient,/usr/local/instantclient` |
| `--enable-swoole-sqlite` | 啓用 `pdo_sqlite` 的協程化支持。 | 依賴 `sqlite3`、`libsqlite3-dev` 庫。 |
| `--enable-swoole-thread` | 開啓[多線程模式](/zh-hant/thread/create.html)，將進程模型變爲單進程多線程。 | 要求 PHP 爲 ZTS 版本，Swoole 6.0+。 |
| `--enable-iouring` | 使用 `io_uring` 替代線程池處理[文件異步 I/O](/zh-hant/file_async.html)。 | 需高版本 Linux 內核及 `liburing >= 2.6`（Swoole 6.2+ 需 `>= 2.8`）。 |
| `--with-liburing-dir` | 指定 `liburing` 庫路徑。 | 需高版本 Linux 內核及 `liburing >= 2.6`（Swoole 6.2+ 需 `>= 2.8`）。 |
| `--enable-uring-socket` | 使用 `io_uring` 替代 `epoll/kqueue` 處理 Socket I/O。 | 依賴 `--enable-iouring`，Swoole 6.2+。 |
| `--enable-zstd` | 啓用 Zstandard 壓縮算法支持。 | 依賴 `libzstd` 庫，Swoole 6.0+。 |
| `--with-swoole-ssh2` | 啓用 `ssh2` 的協程化支持。 | Swoole 6.2+ 可用。 |
| `--enable-swoole-ftp` | 啓用 `ftp` 的協程化支持。 | Swoole 6.2+ 可用。 |

### 特殊與調試選項

| 參數 | 說明 | 備註 |
|:---|:---|:---|
| `--enable-mysqlnd` | 啓用 `mysqlnd` 支持，用於 `Coroutine\MySQL::escape` 方法。 | 需 PHP 已安裝 `mysqlnd` 擴展。 |
| `--enable-sockets` | 允許將 PHP `sockets` 擴展創建的資源添加到 Swoole 的[事件循環](/zh-hant/event.html)中。 | |
| `--enable-debug` | 開啓調試模式，用於 `gdb` 跟蹤。 | **生產環境禁用** |
| `--enable-debug-log` | 開啓內核 DEBUG 日誌。 | **生產環境禁用**，Swoole 4.2+。 |
| `--enable-trace-log` | 開啓追蹤日誌，打印詳細調試信息。 | **僅供內核開發使用** |
| `--enable-swoole-coro-time` | 啓用協程運行時間計算。 | |

## 特殊平臺與環境

### 嵌入式 / 特定架構平臺

針對 ARM 和 MIPS 等平臺，推薦使用 GCC 進行交叉編譯。

| 平臺 | 適用設備 | 編譯註意事項 |
|:---|:---|:---|
| **ARM** | 樹莓派等 | 編譯 Swoole 時，建議手動修改 `Makefile`，**移除 `-O2` 優化參數**。 |
| **MIPS** | OpenWrt 路由器等 | 直接使用 GCC 進行交叉編譯。 |

### Windows 平臺（WSL）

推薦使用 **Windows Subsystem for Linux (WSL)**，安裝方式與原生 Linux 環境一致，但需注意以下配置差異：

- **必須關閉 [`daemonize`](/zh-hant/server/setting.html#daemonize) 選項**。
- **內核兼容性**：若 WSL 版本低於 `17101`，在執行 `./configure` 後，需手動修改 `config.h` 文件，關閉 `HAVE_SIGNALFD` 宏定義。

### Docker 官方鏡像

官方提供了完善的 Docker 鏡像支持，相關資源如下：

- **GitHub 倉庫**：[swoole/docker-swoole](https://github.com/swoole/docker-swoole)
- **Docker Hub**：[phpswoole/swoole](https://hub.docker.com/r/phpswoole/swoole)

## 擴展衝突

由於某些用於跟蹤調試的 PHP 擴展大量使用了全局變量，可能會引發 Swoole 協程的崩潰問題。建議關閉以下相關擴展：

- `phptrace`
- `aop`
- `molten`
- `xhprof`
- `phalcon`（Swoole 協程無法在 phalcon 框架中運行）

### Xdebug 調試

自 Swoole `5.1` 版本起，可直接使用 `Xdebug` 擴展對 Swoole 程序進行調試。可通過修改 `php.ini` 配置啓用：

```ini
swoole.enable_fiber_mock=On
```

或通過命令行啓動：

```shell
php -d swoole.enable_fiber_mock=On your_file.php
```
