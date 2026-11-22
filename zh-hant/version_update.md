---
outline: 2
---

# 版本更新記錄

## 版本類型

* `alpha` 特性預覽版本，表示開發計劃中的任務已完成，進行開放預覽，可能會存在較多`BUG`
* `beta` 測試版本，表示已經可以用於開發環境測試，可能存在`BUG`
* `rc[1-n]` 候選發佈版本，表示進入發佈週期，正在做大範圍的測試，在此期間仍可能發現`BUG`
* 無後綴即代表穩定版，表示此版本已開發完畢，可正式投入使用

## 查看當前版本信息

```shell
php --ri swoole
```

## v6.2.1
### Bug修復
- 修復超時配置錯誤：解決了當設置 `max_idle_time` 時，寫超時誤用了讀超時時間的問題。
- 修復異步重載警告：消除了在異步重載期間，因舊進程退出而觸發的無效警告。
- 重構進程管理：對服務器進程管理邏輯進行了重構。
- 優化 Fork 失敗處理：改進了子進程 `fork` 失敗後的應對機制。新增重試邏輯，在每次重試前等待 1 秒，以避免產生過多的錯誤日誌。
- 修復數據競爭問題：將底層 `Connection` 結構體中的 `closed` 字段改爲原子操作，解決了潛在的數據競爭風險。
- 修復整型溢出：修復了 Redis 服務端中的一個整型溢出問題。
- 更換通信機制：將線程池中子線程與主線程之間的通信方式從 `Pipe` 改爲 `UnixSocket`。
- 支持 Curl 協程化：在 `curl` 協程化場景下，文件上傳和下載操作現已被替換爲協程化的實現。
- 優化阻塞函數檢測：增強了 `tracker observer` 檢測阻塞函數的能力。
- 適配單元測試：在單元測試中，針對不同操作系統更新了 IP 地址查詢功能。
- 新增 PDO 異步方法：爲 `pdo_pgsql` 增加了異步方法 `PQsendClosePrepared`，用於關閉已存在的預處理語句。
- 數據庫連接池優化：新增了對多種因數據庫連接斷開而需重連的錯誤信息的識別與處理。

## v6.2.0
### 新特性
- 新增協程化`FTP`客戶端，現通過編譯時加入`--enable-swoole-ftp`選項，即可啓用`FTP`操作的協程化支持，避免網絡阻塞
- 新增協程化`SSH`客戶端，現通過編譯時加入`--with-swoole-ssh2`選項，即可啓用`SSH`操作的協程化支持，提升併發效率
- 新增`HTTP`協程服務端支持`io_uring`，`HTTP`協程服務端現可選用高性能的`io_uring`事件機制。在編譯時加入`--enable-uring-socket`選項即可啓用，以獲得更優的 I/O 性能
- 新增`Swoole\RemoteObject\Server`模塊，爲`MongoDB`提供透明化的協程操作支持
- 新增`Swoole\Coroutine::setTimeLimit()`函數，用於控制協程執行超時時間，防止協程長時間佔用資源
- 爲`HTTP`靜態文件服務器添加`URL`重寫支持
- 新增對`pdo_firebird`的協程化支持
- 支持`PHP 8.5`
- 支持協程化` gethostbyname`函數
- 優化`Server::shutdown()`的實現，在`Process`模式下將信號通信替換爲管道通信
- 在 Swoole 的 HTTP 服務器（包括 Swoole\Http\Server、Swoole\Http2\Server 和 Swoole\Coroutine\Http\Server）的回調函數中，Swoole\Http\Request 對象的 server 屬性新增了 server_addr 字段，該字段用於標識服務端的 IP 地址
- Swoole\Coroutine::cancel 現支持取消所有`iouring`操作

> `SSH`、`FTP`協程客戶端與`PHP`的`ext-ssh`、`ext-ftp`無法共存，若要開啓此項特性，需禁用`PHP`的`ssh`和`ftp`擴展

### Bug修復
- 修復 HTTP2 服務器會話（session）在多線程環境下發生多次釋放的問題
- 修復在`8.5`版本中，子進程`fork`或者子線程生成後需執行`refresh_memory_manager()`，否則將導致程序崩潰的問題
- 修復`macOS`系統中`swoole_get_local_mac`函數無法正常工作的問題
- 修復了在多線程環境下用戶手動掛起協程時可能引發的崩潰問題
- 修復在 Alpine 系統下的編譯錯誤
- 修復函數鉤子（hook）調用失敗時的內存泄漏問題
- 修復`pdo_sqlite`和`pdo_oci`協程化過程中的線程安全問題
- 修復 `sw_php_print_backtrace` 函數，使其輸出與 PHP 內置函數的回溯信息格式保持一致
- 修復因啓用 --enable-uring-socket、--enable-trace-log 和 --enable-error-log 導致的編譯失敗問題
- 修復因爲宏定義不存在的問題，導致`pdo_firebird`無法編譯的問題

### 優化
- 執行`php --ri swoole`會輸出`libpq`的版本信息
- 優化文件協程化操作中的`io_uring`相關邏輯
- 在添加事件失敗時輸出 PHP 調用堆棧信息
- 優化 `swoole_get_local_ip` 和 `swoole_get_local_mac` 函數的實現代碼
- 優化文件鎖的協程化等待時間，避免指數遞增的睡眠時間導致鎖越來越難獲取
- 提升了對`Android`平臺的兼容性

### 注意
- 移除了`--enable-openssl`編譯選項，現在默認包含對`OpenSSL`的支持
- `--enable-uring-socket`需要明確指定`--enable-iouring`或者`--with-liburing-dir`其中一個
- 不再支持`PHP8.1`
- `liburing`要求的最低版本是2.8

## v6.2.0-rc2
### 新特性
- 新增協程化`FTP`客戶端，現通過編譯時加入`--enable-swoole-ftp`選項，即可啓用`FTP`操作的協程化支持，避免網絡阻塞
- 新增協程化`SSH`客戶端，現通過編譯時加入`--with-swoole-ssh2`選項，即可啓用`SSH`操作的協程化支持，提升併發效率
- 新增`HTTP`協程服務端支持`io_uring`，`HTTP`協程服務端現可選用高性能的`io_uring`事件機制。在編譯時加入`--enable-uring-socket`選項即可啓用，以獲得更優的 I/O 性能
- 新增`Swoole\RemoteObject\Server`模塊，爲`MongoDB`提供透明化的協程操作支持
- 新增`Swoole\Coroutine::setTimeLimit()`函數，用於控制協程執行超時時間，防止協程長時間佔用資源
- 爲`HTTP`靜態文件服務器添加`URL`重寫支持
- 新增對`pdo_firebird`的協程化支持
- 支持`PHP 8.5`
- 支持協程化` gethostbyname`函數
- 優化`Server::shutdown()`的實現，在`Process`模式下將信號通信替換爲管道通信
- 在 Swoole 的 HTTP 服務器（包括 Swoole\Http\Server、Swoole\Http2\Server 和 Swoole\Coroutine\Http\Server）的回調函數中，Swoole\Http\Request 對象的 server 屬性新增了 server_addr 字段，該字段用於標識服務端的 IP 地址
- Swoole\Coroutine::cancel 現支持取消所有`iouring`操作

> `SSH`、`FTP`協程客戶端與`PHP`的`ext-ssh`、`ext-ftp`無法共存，若要開啓此項特性，需禁用`PHP`的`ssh`和`ftp`擴展

### Bug修復
- 修復 HTTP2 服務器會話（session）在多線程環境下發生多次釋放的問題
- 修復在`8.5`版本中，子進程`fork`或者子線程生成後需執行`refresh_memory_manager()`，否則將導致程序崩潰的問題
- 修復`macOS`系統中`swoole_get_local_mac`函數無法正常工作的問題
- 修復了在多線程環境下用戶手動掛起協程時可能引發的崩潰問題
- 修復在 Alpine 系統下的編譯錯誤
- 修復函數鉤子（hook）調用失敗時的內存泄漏問題
- 修復`pdo_sqlite`和`pdo_oci`協程化過程中的線程安全問題
- 修復 `sw_php_print_backtrace` 函數，使其輸出與 PHP 內置函數的回溯信息格式保持一致
- 修復因啓用 --enable-uring-socket、--enable-trace-log 和 --enable-error-log 導致的編譯失敗問題
- 修復因爲宏定義不存在的問題，導致`pdo_firebird`無法編譯的問題

### 優化
- 執行`php --ri swoole`會輸出`libpq`的版本信息
- 優化文件協程化操作中的`io_uring`相關邏輯
- 在添加事件失敗時輸出 PHP 調用堆棧信息
- 優化 `swoole_get_local_ip` 和 `swoole_get_local_mac` 函數的實現代碼
- 優化文件鎖的協程化等待時間，避免指數遞增的睡眠時間導致鎖越來越難獲取
- 提升了對`Android`平臺的兼容性

### 注意
- 移除了`--enable-openssl`編譯選項，現在默認包含對`OpenSSL`的支持
- `--enable-uring-socket`需要明確指定`--enable-iouring`或者`--with-liburing-dir`其中一個
- 不再支持`PHP8.1`
- `Swoole6.2.0RC2`目前是測試版本，只能在測試環境使用，禁止在生產環境使用

## v6.2.0-rc1
### 新特性
- 新增協程化`FTP`客戶端，現通過編譯時加入`--enable-swoole-ftp`選項，即可啓用`FTP`操作的協程化支持，避免網絡阻塞
- 新增協程化`SSH`客戶端，現通過編譯時加入`--with-swoole-ssh2`選項，即可啓用`SSH`操作的協程化支持，提升併發效率
- 新增`HTTP`協程服務端支持`io_uring`，`HTTP`協程服務端現可選用高性能的`io_uring`事件機制。在編譯時加入`--enable-uring-socket`選項即可啓用，以獲得更優的 I/O 性能
- 新增`Swoole\RemoteObject\Server`模塊，爲`MongoDB`提供透明化的協程操作支持
- 新增`Swoole\Coroutine::setTimeLimit()`函數，用於控制協程執行超時時間，防止協程長時間佔用資源
- 爲`HTTP`靜態文件服務器添加`URL`重寫支持
- 新增對`pdo_firebird`的協程化支持
- 支持`PHP 8.5`
- 支持協程化` gethostbyname`函數
- 優化`Server::shutdown()`的實現，在`Process`模式下將信號通信替換爲管道通信
- 在 Swoole 的 HTTP 服務器（包括 Swoole\Http\Server、Swoole\Http2\Server 和 Swoole\Coroutine\Http\Server）的回調函數中，Swoole\Http\Request 對象的 server 屬性新增了 server_addr 字段，該字段用於標識服務端的 IP 地址

> `SSH`、`FTP`協程客戶端與`PHP`的`ext-ssh`、`ext-ftp`無法共存，若要開啓此項特性，需禁用`PHP`的`ssh`和`ftp`擴展

### Bug修復
- 修復 HTTP2 服務器會話（session）在多線程環境下發生多次釋放的問題
- 修復在`8.5`版本中，子進程`fork`或者子線程生成後需執行`refresh_memory_manager()`，否則將導致程序崩潰的問題
- 修復`macOS`系統中`swoole_get_local_mac`函數無法正常工作的問題
- 修復了在多線程環境下用戶手動掛起協程時可能引發的崩潰問題
- 修復在 Alpine 系統下的編譯錯誤
- 修復函數鉤子（hook）調用失敗時的內存泄漏問題
- 修復`pdo_sqlite`和`pdo_oci`協程化過程中的線程安全問題
- 修復 `sw_php_print_backtrace` 函數，使其輸出與 PHP 內置函數的回溯信息格式保持一致

### 優化
- 執行`php --ri swoole`會輸出`libpq`的版本信息
- 優化文件協程化操作中的`io_uring`相關邏輯
- 在添加事件失敗時輸出 PHP 調用堆棧信息
- 優化 `swoole_get_local_ip` 和 `swoole_get_local_mac` 函數的實現代碼
- 優化文件鎖的協程化等待時間，避免指數遞增的睡眠時間導致鎖越來越難獲取
- 提升了對`Android`平臺的兼容性

### 注意
- 移除了`--enable-openssl`編譯選項，現在默認包含對`OpenSSL`的支持
- `--enable-uring-socket`需要明確指定`--enable-iouring`或者`--with-liburing-dir`其中一個
- 不再支持`PHP8.1`
- `Swoole6.2.0RC1`目前是測試版本，只能在測試環境使用，禁止在生產環境使用

## v6.1.8
### Bug 修復
- 修復當設置 `max_idle_time` 時，寫超時錯誤地使用了讀超時時間的問題。
- 修復異步重載期間因舊進程退出而導致的無效警告。
- 重構服務器進程管理邏輯。
- 優化進程 fork 失敗後的處理：增加重試機制，並在重試前等待 1 秒，避免產生過多錯誤日誌。
- 將底層 `Connection` 結構體的 `closed` 字段改爲原子操作，解決潛在的數據競爭問題。
- 修復 Redis 服務端中的整型溢出問題。

## v6.1.7
### Bug 修復
- 修復了因指數退避算法配置不當，導致部分協程長期無法獲取鎖的問題。
- 爲基於 pdo_pgsql 的協程實現增加了超時控制機制，以提升數據庫操作的穩定性。
- 修復了在清空 Cookie 時，雖然指定了 Domain 和 Path 參數，但實際響應中未攜帶這兩個屬性，導致 Cookie 無法正常過期的問題。

## v6.1.6
### Bug修復
- 修復`websocket`接收連續幀時`finish`屬性始終爲`false`的問題。
- 修復使用`--enable-swoole-sqlite`編譯選項時產生的編譯警告。
- 當檢測到未啓用 ext-sockets 擴展時，自動從運行時鉤子標誌中移除 HOOK_SOCKETS。

## v6.1.5
### Bug修復
- 修復多線程環境下用戶手動掛起協程的崩潰問題
- 修復`System::socket_poll()`函數添加事件失敗後，錯誤關閉套接字的問題
- 修復`WebSocket `壓縮消息幀時部分服務器環境不支持`MAX_MEM_LEVEL=9`導致解壓失敗的問題
- 修復`WebSocket`接收解壓格式連續數據幀時，因緩衝區未及時清空而導致後續數據接收錯誤的問題
- 修復`pdo_oci`協程客戶端處理非`PDO_PARAM_LOB`數據時的`data race`問題
### 優化
- 在`Http Server`中，當開發者設置了`Content-Encoding`頭部時，`Swoole`將不再對響應體進行自動壓縮，而需要由開發者自行實現壓縮邏輯並輸出相應內容。
### 移除
- 移除協程環境下`PDO::sqliteCreateAggregate()`、`PDO::sqliteCreateCollation()`、`PDO::sqliteCreateFunction()`函數，其實現原理是將`PHP`函數作爲回調在`sqlite3`引擎中調用，這些特性僅在單線程同步阻塞模式中可用，而`Swoole`協程模式下，需要將`sqlite3`的`C`函數置於異步的`AIO`線程中運行。在`ZTS`版本中會出現讀取空指針，而在`NTS`下則會出現`data race`，引起偶發崩潰的問題
- 移除`pdo_sqlite`協程客戶端對`open_basedir`設置的支持，在多線程環境中無法安全讀取`PG(open_basedir)`，請務必保證`sqlite3`的數據庫文件路徑爲常量或者其他安全的路徑，不可使用用戶輸入的參數作爲`sqlite`數據庫文件路徑的一部分

## v6.1.4
### Bug 修復：
- 修復curl模塊內存泄漏的問題。

## v6.1.3
### Bug 修復
#### HTTP/2 服務器
- **修復 Safari 瀏覽器兼容性問題**：解決 HTTP/2 服務器在向 Safari 瀏覽器發送大文件時的流量控制兼容性問題
- **修復 Date 響應頭緩存的數據競爭**：解決多線程模式下 HTTP/2 服務器的 `Date` 響應頭緩存存在的數據競爭問題
- **修復 `package_max_length` 配置未生效**：
    - 當接收的 `Header` 幀中 `Content-Length` 超過配置值時，服務器將返回 `413 Payload Too Large` 錯誤
    - 當連續接收的 `Data` 幀總長度超過配置值時,服務器將發送 `HTTP/2 RST_STREAM` 幀終止流
- **修復多線程協程模式下的內存越界**：解決多線程模式協程版 `HTTP/2` 服務器開啓 `enable_reuse_port` 時發生的內存越界問題
- **修復 `TLS` 變量銷燬問題**：解決多線程模式 `HTTP/2` 服務器在線程退出時 `TLS (Thread Local Storage)` 變量銷燬時發生的 `double free` 問題

#### Redis 服務器
- 修復 `Redis\Server::format()` 處理大字符串出現的組包異常問題

#### WebSocket 服務器
- **修復控制幀數據污染問題**：解決 `WebSocket` 服務端自動回覆的 `ping`/`pong`/`close` 控制幀因未清空緩存,導致攜帶前一個文本幀或二進制幀殘留數據的問題

#### 多線程相關
- **修復 `swoole_get_task_tmpdir()` 數據競爭**：解決多線程環境下調用該函數時存在的數據競爭問題
- **修復運行時鉤子的內存越界訪問**：解決多線程環境下設置運行時鉤子時觸發的內存越界訪問問題
    - ⚠️ **重要變更**：運行時鉤子現在僅允許在主線程中設置,且必須在創建任何子線程之前完成設置

#### 平臺兼容性
- **修復 FreeBSD 編譯失敗**：解決在 FreeBSD 系統下的編譯失敗問題

#### 功能增強
- **新增 Android 平臺支持**：提升在 Android 平臺的兼容性,現已支持在 Termux 環境下運行
- **同步 PHP 8.x curl 模塊更新**：適配 PHP 8.1、8.2 及 8.3 版本中 `curl` 擴展的相關更新


**注意事項**：本次更新包含多項多線程模式下的關鍵修復,建議使用多線程模式的用戶儘快升級。

## v6.1.2
### Bug修復：
- 設置 `socket` 接收/發送緩衝區尺寸失敗時不再拋出警告
- 修復 `Swoole\Http\Server` 處理 `HTTP2` 請求時，`onClose` 回調可能先於 `onRequest` 執行，導致釋放後使用（`use-after-free`）的問題
- 優化`getSocket()`方法，導出`php sockets`資源對象時複製文件描述符，避免`php sockets` 關閉時影響 `Swoole` 持有的`socket`
- 修復 `Swoole\Async\Client` 內存泄漏問題
- 修復  `IPv6` 類型 `Swoole\Coroutine\Http\Client` 無法使用 `Socks5` 代理的問題
- 同步適配 `PHP 8.4` 中 `CURL` 擴展的相關更新
- 新增 `async.file://` 文件協議，支持在未開啓全局文件協程化時，對指定文件操作啓用協程調度

```php
use function Swoole\Coroutine\run;

// 禁用全局文件協程化，但可通過 `async.file://` 協議對特定文件啓用協程操作
Swoole\Runtime::enableCoroutine(SWOOLE_HOOK_ALL & ~SWOOLE_HOOK_FILE);

run(function() {
    $fp = fopen("async.file:///home/test", "w");
    fwrite($fp, "data");
    fclose($fp);

   $content = file_get_contents("async.file:///home/test");
});
```

該特性用於在禁用全局文件系統協程 `HOOK`後，對部分文件操作進行異步讀寫調用的場景。

## v6.1.1
### Bug修復：
- 修復因爲缺少`zlib`依賴導致編譯失敗的問題。
- 優化`curl`模塊的資源管理邏輯，以規避釋放後再次使用的風險。
- 修復`macos`系統沒有`fdatasync`的問題。
- 優化協程死鎖檢測日誌輸出格式。

## v6.1.0
### Swoole 6.1.0 最大的幾個變更

**1. 引入“標準庫擴展” - 革命性的語法增強**
這是本次更新在語言層面最引人注目的特性，它允許以面向對象的方式操作基礎類型。
- **基礎類型對象化**：可以直接對 `string`、`array`、`stream` 等基礎類型的變量調用方法（如 `$text->length()->lower()`），這極大地提升了代碼的可讀性和編寫體驗。
- **強類型數組**：引入了 `typed_array` 語法，可以定義鍵值類型的約束（如 `<int, string>`），在寫入時進行類型檢查，增強了代碼的健壯性。

**2. 底層架構與穩定性的巨大飛躍**
本次版本在代碼質量和穩定性上投入巨大，爲未來的發展奠定了堅實基礎。
- **測試覆蓋率大幅提升至86%**：通過系統性地補充測試用例，極大地減少了潛在的錯誤，提高了整個項目的可靠性和可維護性。
- **大規模代碼重構與靜態分析**：重構了 Reactor、SSL、Socket 等多個核心模塊，並使用 `clang-tidy` 進行代碼規整，顯著提升了代碼質量和性能。

**3. 鎖 API 的重大簡化與統一**
對併發編程的核心組件——鎖，進行了顛覆性的重構。
- **API 精簡**：移除了 `lockwait`、`trylock` 等方法，只爲 `Swoole\Coroutine\Lock`、`Swoole\Lock` 和 `Swoole\Thread\Lock` 保留 `__construct`、`lock` 和 `unlock` 三個核心方法。
- **行爲統一**：新的 API 設計更貼近 PHP 原生的 `flock` 函數，降低了學習成本，並使用 `LOCK_EX | LOCK_NB` 等標準常量來實現非阻塞等高級功能。

**4. 協程能力的強化與精細化控制**
更加靈活的協程操作能力。
- **協程取消機制**：`Swoole\Coroutine::cancel()` 新增 `$throw_exception` 參數，允許在取消協程時向目標協程內拋出一個可捕獲的 `Swoole\Coroutine\CanceledException`，實現了更安全、更可控的協程生命週期管理。
- **實現序列化操作的協程狀態隔離**：修復協程環境下 serialize/unserialize 的全局狀態隔離問題。現已在協程切換時自動保存和恢復相關全局變量，確保各協程序列化上下文互不干擾。

**5. 默認 HTTP 解析器升級，Websocket功能增強和平臺兼容性改進**
在性能和兼容性方面的重要提升。
- **默認啓用 llHTTP**：用性能更優、更現代的 `llhttp` 替代了舊的 `http_parser`，提升了 HTTP 處理的效率和可靠性。
- **WebSocket 功能增強**：客戶端和服務端均支持了接收分塊消息、主動斷開連接(`disconnect`)和發送 Ping 幀(`ping`)等能力，使 WebSocket 協議的實現更加完整。
- **廢棄 Select，擁抱 Poll**：徹底廢棄了有嚴重缺陷的 `select` 事件機制，在不支持 `epoll/kqueue` 的平臺上（如 Cygwin）默認使用 `poll`，從而在這些平臺上也能支持大量併發連接。

### 標準庫擴展

`6.1` 版本 `Swoole-Cli` 將增加 `PHP` 標準庫擴展語法，在保持對 `PHP` 官方語法完整兼容的同時，提供一些額外的新語法。這些新的擴展語法均是可選的，不影響現有的`PHP`代碼。標準庫擴展語法將在`ext-swoole`的`stdext`模塊中實現。

- `swoole-cli` 用戶，可直接使用，無需設置任何額外的參數
- `ext-swoole` 的用戶，需在編譯時添加`--enable-swoole-stdext`來啓用
- `stdext` 在 `php-cli`、`php-fpm`、`cli-http-server`、`swoole` 模式均可使用

### 基礎類型對象化

`6.1` 版本實現了`array`/`string`/`stream`基礎類型的對象化封裝，支持面向對象風格的方法調用，可直接對這些類型的變量調用內置方法。

基礎類型的內置方法實際上仍然是調用`PHP`標準庫實現的，內置方法與`PHP`的`str_`或`array_`系列函數是一一對應關係，例如`$text->replace()`對應的函數是`str_replace`。底層僅調整了函數名稱，少量方法調整了參數順序，還有幾個方法調整了參數和返回值類型，詳情請查看 [Swoole 文檔](https://wiki.swoole.com/)。

```php
$text = 'Hello Swoole';
var_dump($text->length());
echo $text->lower()->replace("swoole", "php");
echo fopen("/tmp/test.log")->read(1024);
```
### Typed-Array 強類型數組

可限制數組類型，如：`Map`或`ArrayList`，以及限制`key`與`value`的類型。支持多層嵌套格式。`typed array`實際上依然是`array`類型，底層僅在寫入時進行參數檢查。`typed array`可作爲`array`傳遞給其他函數或類方法。

```php
$array = typed_array('<int, string>');
$array[1000] = "hello"; // 正確
$array[2000] = 2025; // 錯誤，拋出異常
```

### 新特性
- **llHTTP 默認解析器**：自 v6.1.0 起，Swoole 採用性能更優的 `llhttp` 替代 `http_parser` 作爲默認 HTTP 報文解析器。
- **協程化文件下載**：`Swoole\Coroutine\Http\Client` 現支持完整的協程化文件下載操作。
- **異步文件截斷**：新增 `iouring ftruncate` 支持，擴展異步文件操作能力。
- `Swoole\Coroutine::cancel()` 新增 `$throw_exception` 參數，支持在取消協程時拋出異常。
- `Swoole\Coroutine\Http\Client` 與 `Swoole\Coroutine\Http\Server` 現已支持接收 WebSocket 分塊消息。
- 爲 `Swoole\Coroutine\Http\Client` 和 `Swoole\Coroutine\Http\Server` 新增 `disconnect` 與 `ping` 方法。
- 重構`Swoole\Coroutine\Lock`、`Swoole\Lock`和`Swoole\Thread\Lock`，只保留`__construct`，`lock`和`unlock`方法，使用上更加貼近`php flock`。

### Bug 修復
- **線程模式優化**：
    - 修復 `SWOOLE_THREAD` 模式下 `hook_flags` 設置失效問題。
    - 修復因工作線程達到`max_request`限制重啓後，導致心跳線程持有失效指針並訪問已釋放內存的問題。
    - 修復不支持單獨重啓`Task`進程的問題。
    - 修復 `Swoole\Websocket\Server` 在握手失敗或連接關閉後，仍可能觸發 `onMessage` 回調的問題。
    - 修復 `Swoole\Coroutine\Http\Server` 因函數返回值類型與簽名不一致導致的執行錯誤。
    - 修復 `Swoole\Coroutine\Http\Server` 不支持啓用 HTTP/2 的問題。
    - 修復 `Swoole\Lock::lockwait()` 超時時間精度轉換問題。
    - 修復因`PHP 8`兼容性調整及`keepalive`連接清理不徹底，導致使用協程化 `curl` 模塊時出現 `ReactorEpoll::add(): failed to add event` 警告的問題。
    - 修復`Swoole\Server::taskWaitMulti()`在多線程模式下無法使用的問題。
    - 修復`Swoole\Server::taskCo()`在多線程模式下資源競爭問題。
- **穩定性提升**：
    - 修復同步進程（含 manager 進程和 task 進程）無法正常使用`process::signal()`的問題。
    - 修正工作進程異常退出時的資源清理機制。
    - 解決 Cygwin 平臺編譯失敗問題。
    - 修復curl開啓keepalive無法複用socket的問題。
    - 改進日誌組件以解決多線程模式下的數據一致性問題。
    - 修復`io_uring`的`futex`特性在`ubuntu24.04`編譯失敗的問題。
    - 修復結構體順序賦值在低版本的linux系統會編譯失敗的問題。
    - 修復直接實例化的`Swoole\Process`對象其`id`屬性未初始化的問題。
    - 修復使用`PIE`編譯swoole時，composer.json文件缺少`--enable-zstd`的選項的問題。
    - 修復了指定用戶組後，`worker`進程因權限不足而無法向`manager`進程發送信號的問題。
- **兼容性改進**：
    - 修復 PHP 8.5 下 `php_swoole_register_shutdown_function` 兼容性問題。
    - 修正 `Swoole\Table::get()` 對 null 參數的處理。
- **協議處理**：
    - 優化`HTTP`請求頭與響應頭中重複字段的處理機制，確保其正確合併。
    - 修復當系統沒有`zlib`時，處理客戶端`Accept-Encoding: zlib`請求頭會觸發未知壓縮方法警告的問題。

### 廢棄
- 不再支持`select`事件機制，`select`僅支持`1024`個句柄的事件監聽，存在嚴重缺陷，在不支持`epoll/kqueue`的平臺將使用`poll`作爲事件輪詢機制，這使得`Cygwin`平臺下也可以支持大量併發。
- 在`Swoole\Server::stop()`方法中，第二個參數`$waitEvent`已被廢棄，請使用`reload_async`參數。

### 架構優化

`6.1`版本增加了大量核心模塊的單元測試，測試覆蓋率提升至**86%**。通過系統性地補充測試用例並重構底層代碼邏輯，同時結合`clang-tidy`工具鏈開展全量靜態代碼分析，實現了代碼的自動化格式規整與冗餘清理，使得代碼可讀性與可維護性得到顯著提升。

- 優化底層`SSL`模塊。
- 優化底層`Socket`模塊。
- 重構底層同步信號模塊。
- 重構底層`reactor`和`string`模塊。
- 重構底層基於`SIGRTMIN`信號實現日誌文件動態重載。
- 優化底層靜態文件服務器，移除C風格代碼，統一爲C++風格的代碼。
- 優化線程初始化邏輯，提高多線程性能，獨立管理結構內存，線程創建和退出不需要再加鎖。
- 移除底層`async`模塊中的`socket_dontwait`選項，該選項已廢棄。
- 完善`WebSocket`掩碼處理的測試覆蓋。
- 優化`sendfile`功能，當文件小於`64KB`時不設置`tcp_cork`選項。
- 增加`aarch64`和`macOS`環境下的單元測試。
- 優化底層客戶端網絡地址解析和設置。
- 爲 `Server`模塊增加`ssl_cafile/ssl_capath`配置項。
- 增加`print_backtrace_on_error`配置，此配置可以在發生未知錯誤時候，打印C函數的堆棧。
- 增加`Address Sanitizer`調試工具。
- 增加`Cygwin`測試，顯著提升`Cygwin`平臺下的兼容性和穩定性
- 在 `macOS` 系統中，由於 `kqueue` 事件機制不支持跨進程管道事件監聽，導致無法使用 `SWOOLE_PROCESS` 模式和 `Task` 進程功能。因此，系統將默認採用 `poll` 作爲底層事件機制。如需啓用 `kqueue`，可以通過`Swoole\Server::set(['enable_kqueue' => true])`和`swoole_async_set(['enable_kqueue' => true])`方法手動開啓。
- 升級 `Swoole library` 版本。
- 禁用 `-Wdate-time` 警告，解決使用 Zig/Clang 編譯時的錯誤。
- 移除 PHP 8.0 相關兼容代碼。
- 在 `config.m4` 中新增 `SWOOLE_ODBC_LIBS` 變量。
- 確保 `timespec.tv_nsec` 取值小於 `1,000,000,000`，以符合 POSIX 標準規範。
- 重構`swoole`協程化`curl`底層代碼，提高與同步阻塞版本的兼容性。

### 注意事項

- 自 Swoole 6.1 起，`Swoole\Coroutine\Http\Client` 與 `Swoole\Coroutine\Http\Server` 將自動處理 WebSocket 控制幀，除非顯式設置 `open_websocket_ping_frame`、`open_websocket_pong_frame` 或 `open_websocket_close_frame`。
- `Swoole\Coroutine::cancel()` 無法取消文件協程化操作，取消文件操作可能導致段錯誤，因此在新版本中禁止了。
- 若啓用 `--enable-iouring`，在檢測到內核版本或 `liburing` 版本不滿足要求時，將拋出警告信息。
- `Swoole\Websocket\Server::push` 方法在發送關閉幀後不會自動關閉連接，如需關閉連接，請使用 `Swoole\Websocket\Server::disconnect()` 方法。
- `Swoole`協議在處理控制幀時，會主動設置 FIN 標誌位爲 1，並確保不啓用壓縮（即 RSV1 位爲 0），用戶對此的設置將被忽略。
- 當處理連續幀的壓縮和發送時，`Swoole`將壓縮與數據分塊的職責移交至應用層，用戶需手動實現相關邏輯。具體請看最下面的例子。
- 系統默認啓用了自動`HTTP 100 Continue`響應功能。
- 在協程切換期間，將會保存並恢復`serialize`與`unserialize`操作相關的全局變量。


### API變更

#### 新的鎖 API
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

### 取消協程
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

### WebSocket 壓縮和發送連續幀

#### 異步服務端
```php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9502);
$server->set(['websocket_compression' => true]);
$server->on('message', function (Server $server, Frame $frame) {
    $data1 = bin2hex(random_bytes(10 * 1024));
    $data2 = bin2hex(random_bytes(20 * 2048));
    $data3 = bin2hex(random_bytes(40 * 4096));
    $context = deflate_init(ZLIB_ENCODING_RAW); // 流式壓縮
    $server->push($frame->fd, deflate_add($context, $data1, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_TEXT, SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1);
    $server->push($frame->fd, deflate_add($context, $data2, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, 0);
    $server->push($frame->fd, deflate_add($context, $data3, ZLIB_FINISH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, SWOOLE_WEBSOCKET_FLAG_FIN);
});
$server->start();
```

#### 協程服務端
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

#### 協程客戶端
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
### 新功能
- `Swoole\Coroutine::cancel()` 新增 `$throw_exception` 參數，支持在取消協程時拋出異常。
- `Swoole\Coroutine\Http\Client` 與 `Swoole\Coroutine\Http\Server` 現已支持接收 WebSocket 分塊消息。
- 爲 `Swoole\Coroutine\Http\Client` 和 `Swoole\Coroutine\Http\Server` 新增 `disconnect` 與 `ping` 方法。
- 重構`Swoole\Coroutine\Lock`、`Swoole\Lock`和`Swoole\Thread\Lock`，只保留`__construct`，`lock`和`unlock`方法，使用上更加貼近`php flock`。

### 問題修復
- 修復 `Swoole\Websocket\Server` 在握手失敗或連接關閉後，仍可能觸發 `onMessage` 回調的問題。
- 修復 `Swoole\Coroutine\Http\Server` 因函數返回值類型與簽名不一致導致的執行錯誤。
- 修復 `Swoole\Coroutine\Http\Server` 不支持啓用 HTTP/2 的問題。
- 修復 `Swoole\Lock::lockwait()` 超時時間精度轉換問題。
- 修復因`PHP 8`兼容性調整及`keepalive`連接清理不徹底，導致使用協程化 `curl` 模塊時出現 `ReactorEpoll::add(): failed to add event` 警告的問題。

### 內部優化
- 升級 `Swoole library` 版本。
- 禁用 `-Wdate-time` 警告，解決使用 Zig/Clang 編譯時的錯誤。
- 移除 PHP 8.0 相關兼容代碼。
- 在 `config.m4` 中新增 `SWOOLE_ODBC_LIBS` 變量。
- 確保 `timespec.tv_nsec` 取值小於 `1,000,000,000`，以符合 POSIX 標準規範。

### 注意事項
- 本版本爲 RC（候選發佈）版本，請僅在測試環境中使用，請勿在生產環境部署。
- 自 Swoole 6.1 起，`Swoole\Coroutine\Http\Client` 與 `Swoole\Coroutine\Http\Server` 將自動處理 WebSocket 控制幀，除非顯式設置 `open_websocket_ping_frame`、`open_websocket_pong_frame` 或 `open_websocket_close_frame`。
- `Swoole\Coroutine::cancel()` 無法取消文件協程化操作，強行取消可能導致段錯誤。
- 若啓用 `--enable-iouring`，在檢測到內核版本或 `liburing` 版本不滿足要求時，將拋出警告信息。
- `Swoole\Websocket\Server::push` 方法在發送關閉幀後不會自動關閉連接，如需關閉連接，請使用 `Swoole\Websocket\Server::disconnect()` 方法。
- `Swoole`協議在處理控制幀時，會主動設置 FIN 標誌位爲 1，並確保不啓用壓縮（即 RSV1 位爲 0），用戶對此的設置將被忽略。
- 當處理連續幀的壓縮和發送時，`Swoole`將壓縮與數據分塊的職責移交至應用層，用戶需手動實現相關邏輯。具體請看最下面的例子。

### API 變更
#### 新的鎖API
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

### 取消協程
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

### WebSocket 壓縮和發送連續幀

#### 異步服務端
```php
use Swoole\WebSocket\Server;
use Swoole\WebSocket\Frame;

$server = new Server('127.0.0.1', 9502);
$server->set(['websocket_compression' => true]);
$server->on('message', function (Server $server, Frame $frame) {
    $data1 = bin2hex(random_bytes(10 * 1024));
    $data2 = bin2hex(random_bytes(20 * 2048));
    $data3 = bin2hex(random_bytes(40 * 4096));
    $context = deflate_init(ZLIB_ENCODING_RAW); // 流式壓縮
    $server->push($frame->fd, deflate_add($context, $data1, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_TEXT, SWOOLE_WEBSOCKET_FLAG_COMPRESS | SWOOLE_WEBSOCKET_FLAG_RSV1);
    $server->push($frame->fd, deflate_add($context, $data2, ZLIB_NO_FLUSH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, 0);
    $server->push($frame->fd, deflate_add($context, $data3, ZLIB_FINISH), SWOOLE_WEBSOCKET_OPCODE_CONTINUATION, SWOOLE_WEBSOCKET_FLAG_FIN);
});
$server->start();
```

#### 協程服務端
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

#### 協程客戶端
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
### 新特性：
- **llHTTP 默認解析器**：自 v6.1.0 起，Swoole 採用性能更優的 `llhttp` 替代 `http_parser` 作爲默認 HTTP 報文解析器。
- **協程化文件下載**：`Swoole\Coroutine\Http\Client` 現支持完整的協程化文件下載操作。
- **異步文件截斷**：新增 `iouring ftruncate` 支持，擴展異步文件操作能力。

### Bug 修復：
- **線程模式優化**：
    - 修復 `SWOOLE_THREAD` 模式下 `hook_flags` 設置失效問題。
    - 修復因工作線程達到`max_request`限制重啓後，導致心跳線程持有失效指針並訪問已釋放內存的問題。
    - 修復不支持單獨重啓`Task`進程的問題。
- **穩定性提升**：
    - 修復同步進程（含 manager 進程和 task 進程）無法正常使用`process::signal()`的問題。
    - 修正工作進程異常退出時的資源清理機制。
    - 解決 Cygwin 平臺編譯失敗問題。
    - 修復curl開啓keepalive無法複用socket的問題。
    - 改進日誌組件以解決多線程模式下的數據一致性問題。
    - 修復`io_uring`的`futex`特性在`ubuntu24.04`編譯失敗的問題。
    - 修復結構體順序賦值在低版本的linux系統會編譯失敗的問題。
    - 修復直接實例化的`Swoole\Process`對象其`id`屬性未初始化的問題。
-  修復使用`PIE`編譯swoole時，composer.json文件缺少`--enable-zstd`的選項的問題。
- **兼容性改進**：
    - 修復 PHP 8.5 下 `php_swoole_register_shutdown_function` 兼容性問題。
    - 修正 `Swoole\Table::get()` 對 null 參數的處理。
- **協議處理**：
    - 優化`HTTP`請求頭與響應頭中重複字段的處理機制，確保其正確合併。
    - 修復當系統沒有`zlib`時，處理客戶端`Accept-Encoding: zlib`請求頭會觸發未知壓縮方法警告的問題。

### 廢棄
- 不再支持`select`事件機制，`select`僅支持`1024`個句柄的事件監聽，存在嚴重缺陷，在不支持`epoll/kqueue`的平臺將使用`poll`作爲事件輪詢機制，這使得`Cygwin`平臺下也可以支持大量併發。
- 在`Swoole\Server::stop()`方法中，第二個參數`$waitEvent`已被廢棄，請使用`reload_async`參數。

### 架構優化
- `6.1`版本增加了大量核心模塊的單元測試，測試覆蓋率提升至**86%**。通過系統性地補充測試用例並重構底層代碼邏輯，同時結合`clang-tidy`工具鏈開展全量靜態代碼分析，實現了代碼的自動化格式規整與冗餘清理，使得代碼可讀性與可維護性得到顯著提升。

- 優化底層`SSL`模塊。
- 優化底層`Socket`模塊。
- 重構底層同步信號模塊。
- 重構底層`reactor`和`string`模塊。
- 重構底層基於`SIGRTMIN`信號實現日誌文件動態重載。
- 優化底層靜態文件服務器，移除C風格代碼，統一爲C++風格的代碼。
- 優化線程初始化邏輯，提高多線程性能，獨立管理結構內存，線程創建和退出不需要再加鎖。
- 移除底層`async`模塊中的`socket_dontwait`選項，該選項已廢棄。
- 完善`WebSocket`掩碼處理的測試覆蓋。
- 優化`sendfile`功能，當文件小於`64KB`時不設置`tcp_cork`選項。
- 增加`aarch64`和`macOS`環境下的單元測試。
- 優化底層客戶端網絡地址解析和設置。
- 爲 `Server`模塊增加`ssl_cafile/ssl_capath`配置項。
- 增加`print_backtrace_on_error`配置，此配置可以在發生未知錯誤時候，打印C函數的堆棧。
- 增加`Address Sanitizer`調試工具。
- 增加`Cygwin`測試，顯著提升`Cygwin`平臺下的兼容性和穩定性
- 在 `macOS` 系統中，由於 `kqueue` 事件機制不支持跨進程管道事件監聽，導致無法使用 `SWOOLE_PROCESS` 模式和 `Task` 進程功能。因此，系統將默認採用 `poll` 作爲底層事件機制。如需啓用 `kqueue`，可以通過`Swoole\Server::set(['enable_kqueue' => true])`和`swoole_async_set(['enable_kqueue' => true])`方法手動開啓。

## v6.0.2

### 新特性：
- 增加`Swoole\Thread::yield()`，`Swoole\Thread::activeCount()`和`Swoole\Thread::isAlive()`方法。

### Bug修復：
- 修復在`SWOOLE_THREAD`模式下，使用單線程模式和設置心跳會引發異常的問題。
- 修復開啓`swoole.enable_fiber_mock`後的段錯誤問題。
- 修復Redis服務端的整型溢出問題。

### 注意：
- Redis服務端目前將僅支持`RESP2`協議，當格式化不符合該協議的字符串時，將拋出異常而不是記錄日誌。

## v6.0.1

### Bug修復：
- 修復`SWOOLE_THREAD`模式下，因爲沒有移除監聽事件導致進程無法正常退出的問題。
- 修復當開啓`single_thread`配置時，無法上傳大文件的問題。
- 修復如果已經定義了`config.m4`中相同的變量，會導致編譯過程找不到具體的文件路徑的問題。
- 修復`Swoole\Process\Pool`中進程超時無法正常退出的問題。
- 修復`SWOOLE_THREAD`模式下，調用`putenv`導致程序崩潰的問題。
- 修復`SWOOLE_THREAD`模式下，無法爲獨立的端口設置事件回調函數的問題。
- 修復`SWOOLE_THREAD`模式下，`onWorkerStart`等事件中無法獲取到運行時的各項參數的問題。
- 修復Postgresql在協程化下在接收大量數據會退化成同步模式下的問題。
- 優化`swoole_substr_json_decode`/`swoole_substr_unserialize`函數的參數判斷邏輯。
- 修復`config.m4`中的CPU親和性設置的問題。
- 修復`SWOOLE_THREAD`模式下，心跳檢測不起作用的問題。

### 注意：
- 在Http服務中，如果進程重啓時，底層會發送500 Internal Server Error給隊列中等待處理的請求，發送完畢就關閉連接並丟棄這些請求。
- 由於php底層的`stream factory`和`stream ops`依賴的運行時配置不是線程安全的，因此多線程模式下只允許主線程在還沒創建子線程之前修改這些運行時配置。
- 升級nghttp2到最新版本。

## v5.1.8
### Bug修復：
- 修復 thread context 開啓時與低版本 GCC 編譯 Swoole 的兼容性問題。
- 修復高版本 GCC 編譯時因缺少 _GNU_SOURCE 宏定義導致的 CPU 親和支持檢測失效問題。
- 修復同步進程（含 manager 進程和 task 進程）無法正常使用 process::signal() 的問題。
- 修復 HTTP2 協程客戶端缺少 serverLastStreamId 屬性的問題。
- 修復系統無 zlib 支持時，客戶端請求 Accept-Encoding 含 zlib 會觸發未知壓縮方法警告的問題。
- 修復 Swoole\Process 類缺少 id 屬性的問題。

## v5.1.7

### Bug修復：
- 修復Postgresql在協程化下在接收大量數據會退化成同步模式下的問題。
- 修復`Swoole\Http2\Request`動態創建類的屬性拋出異常的問題。
- 修復一鍵協程化中發生的致命錯誤會導致內存錯誤的問題。

## v6.0.0

### 新特性：
- `Swoole`支持多線程模式，當`php`是`zts`模式，編譯`Swoole`時開啓`--enable-swoole-thread`時，就能使用多線程模式。
- 新增創建線程類`Swoole\Thread`。 @matyhtf
- 新增線程鎖`Swoole\Thread\Lock`。 @matyhtf
- 新增線程原子計數`Swoole\Thread\Atomic`，`Swoole\Thread\Atomic\Long`。 @matyhtf
- 新增安全併發容器`Swoole\Thread\Map`，`Swoole\Thread\ArrayList`，`Swoole\Thread\Queue`。 @matyhtf
- 文件異步操作支持了使用`iouring作爲文件異步操作的底層引擎`，安裝了`liburing`和編譯`Swoole`時開啓`--enable-iouring`，`file_get_contents`，`file_put_contents`，`fopen`，`fclose`，`fread`，`fwrite`，`mkdir`，`unlink`，`fsync`，`fdatasync`，`rename`，`fstat`，`lstat`，`filesize`這些函數的異步操作將會由`iouring`實現。 @matyhtf @NathanFreeman
- 升級`Boost Context`版本到1.84。現在，龍芯CPU也能夠支持協程了。 @NathanFreeman
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
- 文件異步引擎`iouring`支持多線程輪詢模式`IORING_SETUP_SQPOLL`。 @NathanFreeman
- 新增`iouring_workers`修改`iouring`線程數。 @NathanFreeman
- 新增`iouring_flags`支持修改`iouring`工作模式。 @NathanFreeman
- 增加`Swoole\Thread\Barrier`多線程同步屏障。@matyhtf
- 增加新的設置cookie的函數。 @matyhtf @NathanFreeman
- 新增`非阻塞，可重入的互斥協程鎖`，該鎖可以在進程間/線程間使用，且不會阻塞進程/線程。 @NathanFreeman
- `Swoole\Coroutine\Socket::getOption()`支持了`TCP_INFO`選項。 @matyhtf
- `Swoole\Client`同步阻塞客戶端支持`http`代理。 @matyhtf
- 新增異步非阻塞的`TCP/UDP/Unixsocket` 客戶端`Swoole\Async\Client`。 @matyhtf
- 優化`Swoole\Redis\Server::format`()方法，支持內存零拷貝，支持`redis`嵌套結構。 @matyhtf
- 支持高性能壓縮工具`Zstd`，只需要在編譯`Swoole`時加上`--enable-zstd`，`http`客戶端和服務端之間便可使用`zstd`來壓縮響應或者解碼響應。 @NathanFreeman

### Bug修復：
- 修復無法通過`pecl`安裝的問題。 @remicollet
- 修復`Swoole\Coroutine\FastCGI\Client`客戶端無法設置keepalive。 @NathanFreeman
- 修復請求參數超過`max_input_vars`時會拋出錯誤導致進程不斷重啓的問題。 @NathanFreeman
- 修復在協程中使用`Swoole\Event::wait()`導致的未知問題。 @matyhtf
- 修復`proc_open`在協程化的時候不支持pty的問題。 @matyhtf
- 修復`pdo_sqlite`在PHP8.3會出現段錯誤的問題。 @NathanFreeman
- 修復編譯`Swoole`時的無用警告。 @Appla @NathanFreeman
- 修復如果`STDOUT/STDERR`已經關閉時，底層調用zend_fetch_resource2_ex會拋出錯誤。 @Appla @matyhtf
- 修復無效的`set_tcp_nodelay`配置。 @matyhtf
- 修復文件上傳的時候偶爾會觸發不可達的分支問題。 @NathanFreeman
- 修復設置了`dispatch_func`，會導致php底層拋出錯誤的問題。 @NathanFreeman
- 修復AC_PROG_CC_C99在autoconf >= 2.70版本中已過時。 @petk
- 當線程創建失敗時，捕獲其拋出的異常。 @matyhtf
- 修復`_tsrm_ls_cache`未定義問題。 @jingjingxyk
- 修復在`GCC 14`編譯會導致致命錯誤。 @remicollet
- 修復`Swoole\Http2\Request`動態屬性問題。 @guandeng
- 修復`pgsql`協程客戶端偶發資源不可用的問題。 @NathanFreeman
- 修復進程重啓，沒有重置相關參數導致503錯誤的問題。@matyhtf
- 修復開啓`HTTP2`時，`$request->server['request_method']` 與 `$request->getMethod()` 的結果不一致。 @matyhtf
- 修復上傳文件時，不正確的`content-type`。 @matyhtf
- 修復`http2`協程客戶端的代碼錯誤。 @matyhtf
- 修復`Swoole\Server`缺少屬性`worker_id`的問題。 @cjavad
- 修復`config.m4`有關`brotli`錯誤的問題。 @fundawang
- 修復 多線程下`Swoole\Http\Response::create`無效。 @matyhtf
- 修復`macos`環境下編譯錯誤。 @matyhtf
- 修復線程無法安全退出的問題。 @matyhtf
- 修復多線程模式下，`Swoole\Http\Response`返回響應時間的靜態變量沒有各個線程各自生成一份的問題。 @matyhtf @NathanFreeman
- 修復因爲`PHP-8.4`在ZTS模式下的`超時`特性引起的`Fatal error`問題。 @matyhtf
- 修復`PHP-8.4`的`exit()`函數`hook`。 @remicollet
- 修復`Swoole\Thread::getNativeId()`在`cygwin`無法工作的問題。 @matyhtf
- 修復`Swoole\Coroutine::getaddrinfo()`方法會導致`SIGSEGV`的問題。 @matyhtf
- 修復`runtime tcp`模塊不支持動態開啓SSL加密的問題。 @matyhtf
- 修復http客戶端長時間運行導致超時時間不正確的問題。 @matyhtf
- 修復進程退出之前會導致`Swoole\Table`的互斥鎖無法使用的問題。 @matyhtf
- 修復使用命名參數導致`Swoole\Server::stop()`執行失敗的問題。 @matyhtf
- 修復`Swoole\Thread\Map::toArray()`函數未複製`key`導致崩潰的問題。 @matyhtf
- 修復`Swoole\Thread\Map`無法刪除嵌套的數字鍵的問題。 @matyhtf

### 內核優化：
- 移除對`socket structs`的無用檢查。 @petk
- 升級swoole Library。 @deminy
- `Swoole\Http\Response`增加對451狀態碼的支持。 @abnegate
- 同步PHP不同版本的`文件`操作代碼。 @NathanFreeman
- 同步PHP不同版本的`pdo`操作代碼。 @NathanFreeman
- 優化`Socket::ssl_recv()`的代碼。 @matyhtf
- 優化了config.m4，一些配置可以通過`pkg-config`設置依賴庫位置。 @NathanFreeman
- 優化`解析請求頭`的時候使用動態數組的問題 。 @NathanFreeman
- 優化在多線程模式下，文件描述符`fd`的生命週期問題。 @matyhtf
- 優化協程一些基本邏輯。 @matyhtf
- 升級CI測試的oracle數據庫版本。 @gvenzl
- 優化底層`sendfile`的相關邏輯。 @matyhtf
- `config.m4`中用`AC_DEFINE_UNQUOTED`替換`PHP_DEF_HAVE`。 @petk
- 優化多線程模式下，server的`heartbeat`,`shutdown`和`stop`的相關邏輯。 @matyhtf
- 優化`glibc`版本高於2.17時，不需要鏈接`librt`。 @matyhtf
- 加強`http`客戶端可以接受重複的請求頭。 @matyhtf
- 優化`Swoole\Http\Response::write()`。 @matyhtf
- `Swoole\Http\Response::write()`現在可以發送`http2`協議。 @matyhtf
- 兼容`PHP8.4`。 @matyhtf @NathanFreeman
- 增加底層`socket`異步寫入的能力。 @matyhtf
- 優化`Swoole\Http\Response`。 @NathanFreeman
- 多線程模式下，支持共享php原生`socket`。 @matyhtf
- 優化靜態文件服務，修復靜態文件路徑錯誤問題。 @matyhtf
- 異步`Server`多線程模式支持重啓工作線程。 @matyhtf
- 異步`Server`多線程模式支持在`Manager`線程中開啓定時器。 @matyhtf
- 兼容`PHP-8.4`的`curl`擴展。 @matyhtf @NathanFreeman
- 重新封裝`Swoole`底層使用`iouring`的代碼。 @matyhtf @NathanFreeman
- 優化定時器，使同步進程不依賴於信號。 @matyhtf
- 優化`Swoole\Coroutine\System::waitSignal()`方法，允許同時監聽多個信號。 @matyhtf

### 廢棄：
- 不再支持`PHP 8.0`。
- 不再支持`Swoole\Coroutine\MySQL`協程客戶端。
- 不再支持`Swoole\Coroutine\Redis`協程客戶端。
- 不再支持`Swoole\Coroutine\PostgreSQL`協程客戶端。
- 移除`Swoole\Coroutine\System::fread()`, `Swoole\Coroutine\System::fwrite()`和`Swoole\Coroutine\System::fgets()`方法

## v5.1.5

### Bug修復：
- 修復php版本大於8.2，需要使用`zend_ini_parse_quantity`解析字符串數字。 @matyhtf
- 修復`pdo_pgsql`協程化的時候，偶發資源不可用的問題。 @NathanFreeman
- 修復`pdo_pgsql`協程化的時候，頭文件引用問題。 @NathanFreeman
- 修復不正確的相對路徑檢查，以避免繞過路徑驗證。 @matyhtf
- 修復高併發環境下，進程重啓會導致併發數不正確。 @matyhtf

### 內核優化：
- 同步`php8.3 curl`的一些相關代碼。 @NathanFreeman
- 修復`process`模塊核心測試錯誤。 @NathanFreeman
- 在`SWOOLE_BASE`模式下，所有的連接都應該在`PHP RSHUTDOWN`階段都被關閉。 @matyhtf
- 優化內核代碼。 @matyhtf

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
- 文件異步引擎`iouring`支持多線程輪詢模式`IORING_SETUP_SQPOLL`。 @NathanFreeman
- 新增`iouring_workers`修改`iouring`線程數。 @NathanFreeman
- 新增`iouring_flags`支持修改`iouring`工作模式。 @NathanFreeman
- 增加`Swoole\Thread\Barrier`多線程同步屏障。@matyhtf
- 增加新的設置cookie的函數。 @matyhtf @NathanFreeman

### Bug修復：
- 修復`Swoole\Http2\Request`動態屬性問題。 @guandeng
- 修復`pgsql`協程客戶端偶發資源不可用的問題。 @NathanFreeman
- 修復進程重啓，沒有重置相關參數導致503錯誤的問題。@matyhtf
- 修復開啓`HTTP2`時，$request->server['request_method'] 與 $request->getMethod() 的結果不一致。 @matyhtf
- 修復上傳文件時，不正確的`content-type`。 @matyhtf
- 修復`http2`協程客戶端的代碼錯誤。 @matyhtf
- 修復`Swoole\Server`缺少屬性`worker_id`的問題。 @cjavad
- 修復`config.m4`有關`brotli`錯誤的問題。 @fundawang
- 修復 多線程下`Swoole\Http\Response::create`無效。 @matyhtf
- 修復`macos`環境下編譯錯誤。 @matyhtf
- 修復線程無法安全退出的問題。 @matyhtf
- 修復多線程模式下，`Swoole\Http\Response`返回響應時間的靜態變量沒有各個線程各自生成一份的問題。 @matyhtf @NathanFreeman

### 內核優化：
- 升級CI測試的oracle數據庫版本。 @gvenzl
- 重構優化`swoole`底層相關代碼。 @matyhtf
- 優化底層`sendfile`的相關邏輯。 @matyhtf
- 優化參數解析。 @matyhtf
- `config.m4`中用`AC_DEFINE_UNQUOTED`替換`PHP_DEF_HAVE`。 @petk
- 優化多線程模式下，server的`heartbeat`,`shutdown`和`stop`的相關邏輯。 @matyhtf
- 優化`glibc`版本高於2.17時，不需要鏈接`librt`。 @matyhtf
- 加強`http`客戶端可以接受重複的請求頭。 @matyhtf
- 優化`Swoole\Http\Response::write()`。 @matyhtf
- `Swoole\Http\Response::write()`現在可以發送`http2`協議。 @matyhtf
- 兼容`PHP8.4`。 @matyhtf @NathanFreeman
- 增加底層`socket`異步寫入的能力。 @matyhtf
- 優化`Swoole\Http\Response`。 @NathanFreeman
- 優化底層錯誤信息。 @matyhtf
- 多線程模式下，支持共享php原生`socket`。 @matyhtf
- 優化靜態文件服務，修復靜態文件路徑錯誤問題。 @matyhtf

### 廢棄：
- 移除`Swoole\Coroutine\System::fread()`, `Swoole\Coroutine\System::fwrite()`和`Swoole\Coroutine\System::fgets()`方法

## v6.0.0-alpha

### 新特性
- `Swoole`支持多線程模式，當`php`是`zts`模式，編譯`Swoole`時開啓`--enable-swoole-thread`時，就能使用多線程模式。
- 新增線程管理類`Swoole\Thread`。 @matyhtf
- 新增線程鎖`Swoole\Thread\Lock`。 @matyhtf
- 新增線程原子計數`Swoole\Thread\Atomic`，`Swoole\Thread\Atomic\Long`。 @matyhtf
- 新增安全併發容器`Swoole\Thread\Map`，`Swoole\Thread\ArrayList`，`Swoole\Thread\Queue`。 @matyhtf
- 文件異步操作支持`iouring`作爲底層引擎，安裝了`liburing`和編譯`Swoole`時開啓`--enable-iouring`，`file_get_contents`，`file_put_contents`，`fopen`，`fclose`，`fread`，`fwrite`，`mkdir`，`unlink`，`fsync`，`fdatasync`，`rename`，`fstat`，`lstat`，`filesize`這些函數的異步操作將會由`iouring`實現。 @matyhtf @NathanFreeman
- 升級`Boost Context`版本到1.84。現在，龍芯CPU也能夠使用協程了。 @NathanFreeman

### Bug修復
- 修復無法通過`pecl`安裝的問題。 @remicollet
- 修復`Swoole\Coroutine\FastCGI\Client`客戶端無法設置keepalive。 @NathanFreeman
- 修復請求參數超過`max_input_vars`時會拋出錯誤導致進程不斷重啓的問題。 @NathanFreeman
- 修復在協程中使用`Swoole\Event::wait()`導致的未知問題。 @matyhtf
- 修復`proc_open`在協程化的時候不支持pty的問題。 @matyhtf
- 修復`pdo_sqlite`在PHP8.3會出現段錯誤的問題。 @NathanFreeman
- 修復編譯`Swoole`時的無用警告。 @Appla @NathanFreeman
- 修復如果`STDOUT/STDERR`已經關閉時，底層調用zend_fetch_resource2_ex會拋出錯誤。 @Appla @matyhtf
- 修復無效的`set_tcp_nodelay`配置。 @matyhtf
- 修復文件上傳的時候偶爾會觸發不可達的分支問題。 @NathanFreeman
- 修復設置了`dispatch_func`，會導致php底層拋出錯誤的問題。 @NathanFreeman
- 修復AC_PROG_CC_C99在autoconf >= 2.70版本中已過時。 @petk
- 當線程創建失敗時，捕獲其拋出的異常。 @matyhtf
- 修復`_tsrm_ls_cache`未定義問題。 @jingjingxyk
- 修復在`GCC 14`編譯會導致致命錯誤。 @remicollet

### 內核優化
- 移除對`socket structs`的無用檢查。 @petk
- 升級swoole Library。 @deminy
- `Swoole\Http\Response`增加對451狀態碼的支持。 @abnegate
- 同步PHP不同版本的`文件`操作代碼。 @NathanFreeman
- 同步PHP不同版本的`pdo`操作代碼。 @NathanFreeman
- 優化`Socket::ssl_recv()`的代碼。 @matyhtf
- 優化了config.m4，一些配置可以通過`pkg-config`設置依賴庫位置。 @NathanFreeman
- 優化`解析請求頭`的時候使用動態數組的問題 。 @NathanFreeman
- 優化在多線程模式下，文件描述符`fd`的生命週期問題。 @matyhtf
- 優化協程一些基本邏輯。 @matyhtf

### 廢棄
- 不再支持`PHP 8.0`。
- 不再支持`Swoole\Coroutine\MySQL`協程客戶端。
- 不再支持`Swoole\Coroutine\Redis`協程客戶端。
- 不再支持`Swoole\Coroutine\PostgreSQL`協程客戶端。

## v5.1.3
### Bug修復：
- 修復無法通過`pecl`安裝的問題。
- 修復`Swoole\Coroutine\FastCGI\Client`客戶端無法設置keepalive。
- 修復請求參數超過`max_input_vars`時會拋出錯誤導致進程不斷重啓的問題。
- 修復在協程中使用`Swoole\Event::wait()`導致的未知問題。
- 修復`proc_open`在協程化的時候不支持pty的問題。
- 修復`pdo_sqlite`在PHP8.3會出現段錯誤的問題。
- 修復編譯`Swoole`時的無用警告。
- 修復如果`STDOUT/STDERR`已經關閉時，底層調用zend_fetch_resource2_ex會拋出錯誤。
- 修復無效的`set_tcp_nodelay`配置。
- 修復文件上傳的時候偶爾會觸發不可達的分支問題。
- 修復設置了`dispatch_func`，會導致php底層拋出錯誤的問題。
- 修復AC_PROG_CC_C99在autoconf >= 2.70版本中已過時。

### 內核優化：
- 移除對`socket structs`的無用檢查。
- 升級swoole Library。
- `Swoole\Http\Response`增加對451狀態碼的支持。
- 同步PHP不同版本的`文件`操作代碼。
- 同步PHP不同版本的`pdo`操作代碼。
- 優化`Socket::ssl_recv()`的代碼。
- 優化了config.m4，一些配置可以通過`pkg-config`設置依賴庫位置。
- 優化`解析請求頭`的時候使用動態數組的問題。

## v5.1.2

### Bug修復
- 支持嵌入 sapi。
- 修復 PHP 8.3 中 ZEND_CHECK_STACK_LIMIT 的兼容性問題。
- 修復範圍請求返回文件全部內容時沒有 Content-Range 響應頭的錯誤。
- 修復截斷的 cookie。
- 修復了 PHP 8.3 上的 native-curl 崩潰問題。
- 修復了 Server::Manager::wait() 後的無效 errno 錯誤。
- 修復了 HTTP2 的拼寫錯誤。

### 優化
- 優化 HTTP 服務器性能。
- 添加 CLOSE_SERVICE_RESTART、CLOSE_TRY_AGAIN_LATER、CLOSE_BAD_GATEWAY 作爲 websocket 的有效關閉原因

## v5.1.1
### Bug 修復
- 修復`http協程客戶端`內存泄漏問題。
- 修復`pdo_odbc`無法協程化的問題。
- 修復`socket_import_stream()`執行錯誤的問題。
- 修復`Context::parse_multipart_data()`無法處理空請求體的問題。
- 修復`PostgreSQL協程客戶端`參數不起作用的問題。
- 修復`curl`在析構時會崩潰的bug。
- 修復`Swoole5.x`與新版的`xdebug`不兼容問題。
- 修復類`自動加載`的過程中發生協程切換導致提示`類不存在`的問題。
- 修復無法在`OpenBSD`編譯`swoole`的問題。

## v5.1.0

### 新特性
- 增加對`pdo_pgsql`的協程化支持
- 增加對`pdo_odbc`的協程化支持
- 增加對`pdo_oci`的協程化支持
- 增加對`pdo_sqlite`的協程化支持
- 增加`pdo_pgsql`，`pdo_odbc`，`pdo_oci`，`pdo_sqlite`的連接池配置

### 增強
- 改進了`Http\Server`的性能，極限情況下可以提升`60%`

### 修復
- 修復`WebSocket`協程客戶端每次請求造成的內存泄漏
- 修復`http協程服務端`優雅退出導致客戶端不退出的問題
- 修復編譯的時候加入了`--enable-thread-context`選項會導致`Process::signal()`不起作用
- 修復在`SWOOLE_BASE`模式下，當進程非正常退出時，連接數統計錯誤的問題
- 修復`stream_select()`函數簽名錯誤
- 修復文件MIME信息大小寫敏感錯誤
- 修復`Http2\Request::$usePipelineRead`拼寫錯誤導致在PHP8.2的環境下會拋出警告
- 修復在`SWOOLE_BASE`模式下的內存泄漏問題
- 修復當`Http\Response::cookie()`設置cookie的過期時間導致的內存泄漏問題
- 修復在`SWOOLE_BASE`模式下的連接泄漏問題

### 內核
- 修復swoole在php8.3下的php_url_encode的函數簽名問題
- 修復單元測試選項問題
- 優化，重構代碼
- 兼容PHP8.3
- 不支持32位操作系統上編譯

##  v5.0.3

### 增強
- 添加了`--with-nghttp2_dir`選項，用於使用系統中的`nghttp2`庫
- 支持字節長度或大小相關的選項
- 增加`Process\Pool::sendMessage()`函數
- `Http\Response::cookie()`支持`max-age`

### 修復
- 修復`Server task/pipemessage/finish`事件導致內存泄漏

### 內核
- `http`響應頭衝突將不會拋出錯誤
- `Server`連接關閉將不會拋出錯誤

## v5.0.2

### 增強
- 支持對`http2`的默認設置進行配置
- 支持8.1或更高版本的`xdebug`
- 重構了原生的curl以支持具有多個套接字的curl句柄，例如curl ftp協議
- 在`Process::setPriority/getPriority`中添加了`who`參數
- 添加了`Coroutine\Socket::getBoundCid()`方法
- 調整了`Coroutine\Socket::recvLine/recvWithBuffer`方法的`length`參數的默認值爲`65536`
- 重構了跨協程退出特性，使內存釋放更安全，並解決了致命錯誤發生時的崩潰問題
- 爲`Coroutine\Client`、`Coroutine\Http\Client`、`Coroutine\Http2\Client`添加了`socket`屬性，允許直接操作`socket`資源
- 支持`Http\Server`向`http2`客戶端發送空文件
- 支持`Coroutine\Http\Server`的優雅重啓。當服務器關閉時，客戶端連接不再被強制關閉，只停止監聽新請求
- 將`pcntl_rfork`和`pcntl_sigwaitinfo`添加到不安全函數列表中，在協程容器啓動時將被關閉
- 重構了`SWOOLE_BASE`模式進程管理器，關閉和重載行爲與`SWOOLE_PROCESS`一致

##  v5.0.1

### 增強
- 支持`PHP-8.2`，改進了協程異常處理，與`ext-soap`兼容
- 添加了`pgsql`協程客戶端的`LOB`支持
- 改進了`websocket`客戶端，升級頭部包含`websocket`而不是使用`=`
- 優化了`http 客戶端`，在服務器發送`connection close`時禁用`keep-alive`
- 優化了`http 客戶端`，在沒有壓縮庫的情況下禁止添加`Accept-Encoding`頭部
- 改進了調試信息，在`PHP-8.2`下將密碼設置爲敏感參數
- 加強了`Server::taskWaitMulti()`，在協程環境下不會阻塞
- 優化了日誌函數，在寫入日誌文件失敗時不再打印到屏幕上


### 修復
- 修復了`Coroutine::printBackTrace()`和`debug_print_backtrace()`的參數兼容性問題
- 修復了`Event::add()`對套接字資源的支持
- 修復了在沒有`zlib`時的編譯錯誤
- 修復了在解析爲意外字符串時解包服務器任務的崩潰問題
- 修復了添加小於`1ms`的定時器被強制設置爲`0`的問題
- 修復了在添加列之前使用`Table::getMemorySize()`引起崩潰的問題
- 修改了`Http\Response::setCookie()`方法的過期參數名爲`expires`

## v5.0.0

### 新特性
- 添加了`Server`的`max_concurrency`選項
- 添加了`Coroutine\Http\Client`的`max_retries`選項
- 添加了`name_resolver`全局選項。 添加了`Server`的`upload_max_filesize`選項
- 添加了`Coroutine::getExecuteTime()`方法
- 爲`Server `添加了`SWOOLE_DISPATCH_CONCURRENT_LB`的`dispatch_mode`
- 強化了類型系統，爲所有函數的參數和返回值添加了類型
- 優化了錯誤處理，所有構造函數在失敗時將拋出異常
- 調整了`Server`的默認模式，默認爲`SWOOLE_BASE`模式
- 將`pgsql`協程客戶端遷移到核心庫中。 包含了`4.8.x`分支中的所有`bug`修復

### 移除
- 移除了`PSR-0`風格的類名
- 移除了在關閉函數中自動添加`Event::wait()`的功能
- 移除了`Server::tick/after/clearTimer/defer`的別名
- 移除了`--enable-http2/--enable-swoole-json`，調整爲默認啓用

### 廢棄
- 協程客戶端`Coroutine\Redis`和`Coroutine\MySQL`默認廢棄

## v4.8.13

### 增強
- 重構原生的curl以支持具有多個套接字的curl句柄，例如curl FTP協議
- 支持手動設置`http2`設置
- 改進`WebSocket客戶端`，升級標頭包含了`websocket`而不是`equal`
- 優化HTTP客戶端，在服務器發送連接關閉時禁用`keep-alive`
- 改進調試信息，在PHP-8.2下將密碼設置爲敏感參數
- 支持`HTTP Range Requests`

### 修復
- 修復了`Coroutine::printBackTrace()`和`debug_print_backtrace()`的參數兼容性問題
- 修復了在`WebSocket`服務器同時啓用`HTTP2`和`WebSocket`協議時解析長度錯誤的問題
- 修復了在`Server::send()`、`Http\Response::end()`、`Http\Response::write()`和`WebSocket/Server::push()`中發生`send_yield`時的內存泄漏問題
- 修復了在添加列之前使用`Table::getMemorySize()`時導致崩潰的問題。

## v4.8.12

### 增強
- 支持PHP8.2
- `Event::add()`函數支持`sockets resources`
- `Http\Client::sendfile()`支持超過4G的文件
- `Server::taskWaitMulti()`支持協程環境

### 修復
- 修復接收到錯誤的`multipart body`會拋出錯誤信息
- 修復定時器的超時時間小於`1ms`導致的錯誤
- 修復磁盤已滿導致的死鎖問題

## v4.8.11

### 增強
- 支持 `Intel CET` 安全防禦機制
- 添加 `Server::$ssl`屬性
- 使用`pecl`編譯`swoole`時，增加`enable-cares`屬性
- 重構`multipart_parser`解釋器

### 修復
- 修復`pdo`持久化連接拋出異常導致的段錯誤
- 修復析構函數使用協程導致段錯誤
- 修復`Server::close()`的不正確的錯誤信息

## v4.8.10

### 修復

- 當`stream_select`的超時參數小於`1ms`時將其重置爲`0`
- 修復編譯時添加`-Werror=format-security`會導致編譯失敗
- 修復使用`curl`導致`Swoole\Coroutine\Http\Server`段錯誤

## v4.8.9

### 增強

- 支持 `Http2` 服務器下的 `http_autoindex` 選項

### 修復

- 優化 `Cookie` 解析器，支持傳入 `HttpOnly` 選項
- 修復 #4657，Hook `socket_create` 方法返回類型問題
- 修復 `stream_select` 內存泄漏

### CLI 更新

- `CygWin` 下攜帶了 SSL 證書鏈，解決了 SSL 認證出錯的問題
- 更新至 `PHP-8.1.5`

## v4.8.8

### 優化

- 將 SW_IPC_BUFFER_MAX_SIZE 減少到 64k
- 優化 http2 的 header_table_size 設置

### 修復

- 修復使用 enable_static_handler 下載靜態文件大量套接字錯誤
- 修復 http2 server NPN 錯誤

## v4.8.7

### 增強

- 添加 curl_share 支持

### 修復

- 修復 arm32 架構下的未定義符號錯誤
- 修復 `clock_gettime()` 兼容性
- 修復當內核缺乏大塊內存時，PROCESS 模式服務器發送失敗的問題

## v4.8.6

### 修復

- 爲 boost/context API 名稱添加了前綴
- 優化配置選項

## v4.8.5

### 修復

- 還原 Table 的參數類型
- 修復使用 Websocket 協議接收錯誤數據時 crash

## v4.8.4

### 修復

- 修復 sockets hook 與 PHP-8.1 的兼容性
- 修復 Table 與 PHP-8.1 的兼容性
- 修復在部分情況下協程風格的 HTTP 服務器解析 `Content-Type` 爲 `application/x-www-form-urlencoded` 的 `POST` 參數不符合預期

## v4.8.3

### 新增 API

- 增加 `Coroutine\Socket::isClosed()` 方法

### 修復

- 修復 curl native hook 在 php8.1 版本下的兼容性問題
- 修復 sockets hook 在 php8 下的兼容性問題
- 修復 sockets hook 函數返回值錯誤
- 修復 Http2Server sendfile 無法設置 content-type
- 優化 HttpServer date header 的性能，增加了 cache

## v4.8.2

### 修復

- 修復 proc_open hook 內存泄露的問題
- 修復 curl native hook 與 PHP-8.0、PHP-8.1 的兼容性問題
- 修復 Manager 進程中無法正常關閉連接的問題
- 修復 Manager 進程無法使用 sendMessage 的問題
- 修復 `Coroutine\Http\Server` 接收超大 POST 數據解析異常的問題
- 修復 PHP8 環境下致命錯誤時進程不能直接退出的問題
- 調整 coroutine `max_concurrency` 配置項，只允許在 `Co::set()` 中使用
- 調整 `Coroutine::join()` 忽略不存在的協程

## v4.8.1

### 新增 API

- 新增 `swoole_error_log_ex()` 和 `swoole_ignore_error()` 函數 (#4440) (@matyhtf)

### 增強

- 遷移 ext-swoole_plus 中的 admin api 到 ext-swoole (#4441) (@matyhtf)
- admin server 新增 get_composer_packages 命令 (swoole/library@07763f46) (swoole/library@8805dc05) (swoole/library@175f1797) (@sy-records) (@yunbaoi)
- 增加了寫操作的 POST 方法請求限制 (swoole/library@ac16927c) (@yunbaoi)
- admin server 支持獲取類方法信息 (swoole/library@690a1952) (@djw1028769140) (@sy-records)
- 優化 admin server 代碼 (swoole/library#128) (swoole/library#131) (@sy-records)
- admin server 支持併發請求多個目標和併發請求多個 API (swoole/library#124) (@sy-records)
- admin server 支持獲取接口信息 (swoole/library#130) (@sy-records)
- SWOOLE_HOOK_CURL 支持 CURLOPT_HTTPPROXYTUNNEL (swoole/library#126) (@sy-records)

### 修復

- join 方法禁止併發調用同一個協程 (#4442) (@matyhtf)
- 修復 Table 原子鎖意外釋放的問題 (#4446) (@Txhua) (@matyhtf)
- 修復丟失的 helper options (swoole/library#123) (@sy-records)
- 修復 get_static_property_value 命令參數錯誤 (swoole/library#129) (@sy-records)

## v4.8.0

### 向下不兼容改動

- 在 base 模式下，onStart 回調將始終在第一個工作進程 (worker id 爲 0) 啓動時回調，先於 onWorkerStart 執行 (#4389) (@matyhtf)

### 新增 API

- 新增 `Co::getStackUsage()` 方法 (#4398) (@matyhtf) (@twose)
- 新增 `Coroutine\Redis` 的一些 API (#4390) (@chrysanthemum)
- 新增 `Table::stats()` 方法 (#4405) (@matyhtf)
- 新增 `Coroutine::join()` 方法 (#4406) (@matyhtf)

### 新增功能

- 支持 server command (#4389) (@matyhtf)
- 支持 `Server::onBeforeShutdown` 事件回調 (#4415) (@matyhtf)

### 增強

- 當 Websocket pack 失敗時設置錯誤碼 (swoole/swoole-src@d27c5a5) (@matyhtf)
- 新增 `Timer::exec_count` 字段 (#4402) (@matyhtf)
- hook mkdir 支持使用 open_basedir ini 配置 (#4407) (@NathanFreeman)
- library 新增 vendor_init.php 腳本 (swoole/library@6c40b02) (@matyhtf)
- SWOOLE_HOOK_CURL 支持 CURLOPT_UNIX_SOCKET_PATH (swoole/library#121) (@sy-records)
- Client 支持設置 ssl_ciphers 配置項 (#4432) (@amuluowin)
- 爲 `Server::stats()` 添加了一些新的信息 (#4410) (#4412) (@matyhtf)

### 修復

- 修復文件上傳時，對文件名字進行不必要的 URL decode (swoole/swoole-src@a73780e) (@matyhtf)
- 修復 HTTP2 max_frame_size 問題 (#4394) (@twose)
- 修復 curl_multi_select bug #4393 (#4418) (@matyhtf)
- 修復丟失的 coroutine options (#4425) (@sy-records)
- 修復當發送緩衝區滿的時候，連接無法被 close 的問題 (swoole/swoole-src@2198378) (@matyhtf)

## v4.7.1

### 增強

- `System::dnsLookup` 支持查詢 `/etc/hosts` (#4341) (#4349) (@zmyWL) (@NathanFreeman)
- 增加對 mips64 的 boost context 支持 (#4358) (@dixyes)
- `SWOOLE_HOOK_CURL` 支持 `CURLOPT_RESOLVE` 選項 (swoole/library#107) (@sy-records)
- `SWOOLE_HOOK_CURL` 支持 `CURLOPT_NOPROGRESS` 選項 (swoole/library#117) (@sy-records)
- 增加對 riscv64 的 boost context 支持 (#4375) (@dixyes)

### 修復

- 修復 PHP-8.1 在 on shutdown 時產生的內存錯誤 (#4325) (@twose)
- 修復 8.1.0beta1 的不可序列化類 (#4335) (@remicollet)
- 修復多個協程遞歸創建目錄失敗的問題 (#4337) (@NathanFreeman)
- 修復 native curl 在外網發送大文件偶發超時的問題，以及在 CURL WRITEFUNCTION 中使用協程文件 API 出現 crash 的問題 (#4360) (@matyhtf)
- 修復 `PDOStatement::bindParam()` 期望參數1爲字符串的問題 (swoole/library#116) (@sy-records)

## v4.7.0

### 新增 API

- 新增 `Process\Pool::detach()` 方法 (#4221) (@matyhtf)
- `Server` 支持 `onDisconnect` 回調函數 (#4230) (@matyhtf)
- 新增 `Coroutine::cancel()` 和 `Coroutine::isCanceled()` 方法 (#4247) (#4249) (@matyhtf)
- `Http\Client` 支持 `http_compression` 和 `body_decompression` 選項 (#4299) (@matyhtf)

### 增強

- 支持協程 MySQL 客戶端在 `prepare` 時字段嚴格類型 (#4238) (@Yurunsoft)
- DNS 支持 `c-ares` 庫 (#4275) (@matyhtf)
- `Server` 支持在多端口監聽時給不同的端口配置心跳檢測時間 (#4290) (@matyhtf)
- `Server` 的 `dispatch_mode` 支持 `SWOOLE_DISPATCH_CO_CONN_LB` 和 `SWOOLE_DISPATCH_CO_REQ_LB` 模式 (#4318) (@matyhtf)
- `ConnectionPool::get()` 支持 `timeout` 參數 (swoole/library#108) (@leocavalcante)
- Hook Curl 支持 `CURLOPT_PRIVATE` 選項 (swoole/library#112) (@sy-records)
- 優化 `PDOStatementProxy::setFetchMode()` 方法的函數聲明 (swoole/library#109) (@yespire)

### 修復

- 修復使用線程上下文的時候，創建大量協程時拋出無法創建線程的異常 (8ce5041) (@matyhtf)
- 修復安裝 Swoole 時 php_swoole.h 頭文件丟失的問題 (#4239) (@sy-records)
- 修復 EVENT_HANDSHAKE 不向下兼容的問題 (#4248) (@sy-records)
- 修復 SW_LOCK_CHECK_RETURN 宏可能會調用兩次函數的問題 (#4302) (@zmyWL)
- 修復 `Atomic\Long` 在 M1 芯片下的問題 (e6fae2e) (@matyhtf)
- 修復 `Coroutine\go()` 丟失返回值的問題 (swoole/library@1ed49db) (@matyhtf)
- 修復 `StringObject` 返回值類型問題 (swoole/library#111) (swoole/library#113) (@leocavalcante) (@sy-records)

### 內核

- 禁止 Hook 已經被 PHP 禁用的函數 (#4283) (@twose)

### 測試

- 新增 `Cygwin` 環境下的構建 (#4222) (@sy-records)
- 新增 `alpine 3.13` 和 `3.14` 的編譯測試 (#4309) (@limingxinleo)

## v4.6.7

### 增強

- Manager 進程和 Task 同步進程支持調用`Process::signal()`函數 (#4190) (@matyhtf)

### 修復

- 修復信號不能被重複註冊的問題 (#4170) (@matyhtf)
- 修復在 OpenBSD/NetBSD 上編譯失敗的問題 (#4188) (#4194) (@devnexen)
- 修復監聽可寫事件時特殊情況 onClose 事件丟失 (#4204) (@matyhtf)
- 修復 Symfony HttpClient 使用 native curl 的問題 (#4204) (@matyhtf)
- 修復`Http\Response::end()`方法總是返回 true 的問題 (swoole/swoole-src@66fcc35) (@matyhtf)
- 修復 PDOStatementProxy 產生的 PDOException (swoole/library#104) (@twose)

### 內核

- 重構 worker buffer，給 event data 加上 msg id 標誌 (#4163) (@matyhtf)
- 修改 Request Entity Too Large 日誌等級爲 warning 級別 (#4175) (@sy-records)
- 替換 inet_ntoa and inet_aton 函數 (#4199) (@remicollet)
- 修改 output_buffer_size 默認值爲 UINT_MAX (swoole/swoole-src@46ab345) (@matyhtf)

## v4.6.6

### 增強

- 支持在 FreeBSD 下 Master 進程退出後向 Manager 進程發送 SIGTERM 信號 (#4150) (@devnexen)
- 支持將 Swoole 靜態編譯到 PHP 中 (#4153) (@matyhtf)
- 支持 SNI 使用 HTTP 代理  (#4158) (@matyhtf)

### 修復

- 修復同步客戶端異步連接的錯誤 (#4152) (@matyhtf)
- 修復 Hook 原生 curl multi 導致的內存泄漏 (swoole/swoole-src@91bf243) (@matyhtf)

## v4.6.5

### 新增 API

- 在 WaitGroup 中增加 count 方法(swoole/library#100) (@sy-records) (@deminy)

### 增強

- 支持原生 curl multi (#4093) (#4099) (#4101) (#4105) (#4113) (#4121) (#4147) (swoole/swoole-src@cd7f51c) (@matyhtf) (@sy-records) (@huanghantao)
- 允許在使用 HTTP/2 的 Response 中使用數組設置 headers

### 修復

- 修復 NetBSD 構建 (#4080) (@devnexen)
- 修復 OpenBSD 構建 (#4108) (@devnexen)
- 修復 illumos/solaris 構建，只有成員別名 (#4109) (@devnexen)
- 修復握手未完成時，SSL 連接的心跳檢測不生效 (#4114) (@matyhtf)
- 修復 Http\Client 使用代理時`host`中存在`host:port`產生的錯誤 (#4124) (@Yurunsoft)
- 修復 Swoole\Coroutine\Http::request 中 header 和 cookie 的設置 (swoole/library#103) (@leocavalcante) (@deminy)

### 內核

- 支持 BSD 上的 asm context (#4082) (@devnexen)
- 在 FreeBSD 下使用 arc4random_buf 來實現 getrandom (#4096) (@devnexen)
- 優化 darwin arm64 context：刪除 workaround 使用 label (#4127) (@devnexen)

### 測試

- 添加 alpine 的構建腳本 (#4104) (@limingxinleo)

## v4.6.4

### 新增 API

- 新增 Coroutine\Http::request, Coroutine\Http::post, Coroutine\Http::get 函數 (swoole/library#97) (@matyhtf)

### 增強

- 支持 ARM 64 構建 (#4057) (@devnexen)
- 支持在 Swoole TCP 服務器中設置 open_http_protocol (#4063) (@matyhtf)
- 支持 ssl 客戶端只設置 certificate (91704ac) (@matyhtf)
- 支持 FreeBSD 的 tcp_defer_accept 選項 (#4049) (@devnexen)

### 修復

- 修復使用 Coroutine\Http\Client 時缺少代理授權的問題 (edc0552) (@matyhtf)
- 修復 Swoole\Table 的內存分配問題 (3e7770f) (@matyhtf)
- 修復 Coroutine\Http2\Client 併發連接時的 crash (630536d) (@matyhtf)
- 修復 DTLS 的 enable_ssl_encrypt 問題 (842733b) (@matyhtf)
- 修復 Coroutine\Barrier 內存泄漏(swoole/library#94) (@Appla) (@FMiS)
- 修復由 CURLOPT_PORT 和 CURLOPT_URL 順序引起的偏移錯誤 (swoole/library#96) (@sy-records)
- 修復`Table::get($key, $field)`當字段類型爲 float 時的錯誤 (08ea20c) (@matyhtf)
- 修復 Swoole\Table 內存泄漏 (d78ca8c) (@matyhtf)

## v4.4.24

### 修復

- 修復 http2 客戶端併發連接時的 crash (#4079)

## v4.6.3

### 新增 API

- 新增 Swoole\Coroutine\go 函數 (swoole/library@82f63be) (@matyhtf)
- 新增 Swoole\Coroutine\defer 函數 (swoole/library@92fd0de) (@matyhtf)

### 增強

- 爲 HTTP 服務器添加 compression_min_length 選項 (#4033) (@matyhtf)
- 允許在應用層設置 Content-Length HTTP 頭 (#4041) (@doubaokun)

### 修復

- 修復程序達到文件打開限制時的 coredump (swoole/swoole-src@709813f) (@matyhtf)
- 修復 JIT 被禁用問題 (#4029) (@twose)
- 修復 `Response::create()` 參數錯誤問題 (swoole/swoole-src@a630b5b) (@matyhtf)
- 修復 ARM 平臺下投遞 task 時 task_worker_id 誤報 (#4040) (@doubaokun)
- 修復 PHP8 開啓 native curl hook 時的 coredump (#4042)(#4045) (@Yurunsoft) (@matyhtf)
- 修復 fatal error 時 shutdown 階段的內存越界錯誤 (#4050) (@matyhtf)

### 內核

- 優化 ssl_connect/ssl_shutdown (#4030) (@matyhtf)
- 發生 fatal error 時直接退出進程 (#4053) (@matyhtf)

## v4.6.2

### 新增 API

- 新增 `Http\Request::getMethod()` 方法 (#3987) (@luolaifa000)
- 新增 `Coroutine\Socket->recvLine()` 方法 (#4014) (@matyhtf)
- 新增 `Coroutine\Socket->recvWithBuffer()` 方法 (#4017) (@matyhtf)

### 增強

- 增強 `Response::create()` 方法，可以獨立於 Server 使用 (#3998) (@matyhtf)
- 支持 `Coroutine\Redis->hExists` 在設置了 compatibility_mode 之後返回 bool 類型 (swoole/swoole-src@b8cce7c) (@matyhtf)
- 支持 `socket_read` 設置 PHP_NORMAL_READ 選項 (swoole/swoole-src@b1a0dcc) (@matyhtf)

### 修復

- 修復 `Coroutine::defer` 在 PHP8 下 coredump 的問題 (#3997) (@huanghantao)
- 修復當使用 thread context 的時候，錯誤設置 `Coroutine\Socket::errCode` 的問題 (swoole/swoole-src@004d08a) (@matyhtf)
- 修復在最新的 macos 下 Swoole 編譯失敗的問題 (#4007) (@matyhtf)
- 修復當 md5_file 參數傳入 url 導致 php stream context 爲空指針的問題 (#4016) (@ZhiyangLeeCN)

### 內核

- 使用 AIO 線程池 hook stdio（解決之前把 stdio 視爲 socket 導致的多協程讀寫問題） (#4002) (@matyhtf)
- 重構 HttpContext (#3998) (@matyhtf)
- 重構 `Process::wait()` (#4019) (@matyhtf)

## v4.6.1

### 增強

- 增加 `--enable-thread-context` 編譯選項 (#3970) (@matyhtf)
- 在操作 session_id 時檢查連接是否存在 (#3993) (@matyhtf)
- 增強 CURLOPT_PROXY (swoole/library#87) (@sy-records)

### 修復

- 修復 pecl 安裝中的最小 PHP 版本 (#3979) (@remicollet)
- 修復 pecl 安裝時沒有 `--enable-swoole-json` 和 `--enable-swoole-curl` 選項 (#3980) (@sy-records)
- 修復 openssl 線程安全問題 (b516d69f) (@matyhtf)
- 修復 enableSSL coredump (#3990) (@huanghantao)

### 內核

- 優化 ipc writev ，避免當事件數據爲空時產生 coredump (9647678) (@matyhtf)

## v4.5.11

### 增強

- 優化 Swoole\Table (#3959) (@matyhtf)
- 增強 CURLOPT_PROXY (swoole/library#87) (@sy-records)

### 修復

- 修復 Table 遞增和遞減時不能清除所有列問題 (#3956) (@matyhtf) (@sy-records)
- 修復編譯時產生的`clock_id_t`錯誤 (49fea171) (@matyhtf)
- 修復 fread bugs (#3972) (@matyhtf)
- 修復 ssl 多線程 crash (7ee2c1a0) (@matyhtf)
- 兼容 uri 格式錯誤導致報錯 Invalid argument supplied for foreach (swoole/library#80) (@sy-records)
- 修復 trigger_error 參數錯誤 (swoole/library#86) (@sy-records)

## v4.6.0

### 向下不兼容改動

- 移除了`session id`的最大限制，不再重複 (#3879) (@matyhtf)
- 使用協程時禁用不安全功能，包括`pcntl_fork`/`pcntl_wait`/`pcntl_waitpid`/`pcntl_sigtimedwait` (#3880) (@matyhtf)
- 默認啓用 coroutine hook (#3903) (@matyhtf)

### 移除

- 不再支持 PHP7.1 (4a963df) (9de8d9e) (@matyhtf)

### 廢棄

- 將 `Event::rshutdown()` 標記爲已棄用，請改用 Coroutine\run (#3881) (@matyhtf)

### 新增 API

- 支持 setPriority/getPriority (#3876) (@matyhtf)
- 支持 native-curl hook (#3863) (@matyhtf) (@huanghantao)
- 支持 Server 事件回調函數傳遞對象風格的參數，默認不傳遞對象風格的參數 (#3888) (@matyhtf)
- 支持 hook sockets 擴展 (#3898) (@matyhtf)
- 支持重複 header (#3905) (@matyhtf)
- 支持 SSL sni (#3908) (@matyhtf)
- 支持 hook stdio (#3924) (@matyhtf)
- 支持 stream_socket 的 capture_peer_cert 選項 (#3930) (@matyhtf)
- 添加 Http\Request::create/parse/isCompleted (#3938) (@matyhtf)
- 添加 Http\Response::isWritable (db56827) (@matyhtf)

### 增強

- Server 的所有時間精度都從 int 修改爲 double (#3882) (@matyhtf)
- 在 swoole_client_select 函數里面檢查 poll 函數的 EINTR 情況 (#3909) (@shiguangqi)
- 添加協程死鎖檢測 (#3911) (@matyhtf)
- 支持使用 SWOOLE_BASE 模式在另一個進程中關閉連接 (#3916) (@matyhtf)
- 優化 Server master 進程與 worker 進程通信的性能，減少內存拷貝 (#3910) (@huanghantao) (@matyhtf)

### 修復

- 當 Coroutine\Channel 被關閉時，pop 出裏面所有的數據 (960431d) (@matyhtf)
- 修復使用 JIT 時的內存錯誤 (#3907) (@twose)
- 修復 `port->set()` dtls 編譯錯誤 (#3947) (@Yurunsoft)
- 修復 connection_list 錯誤 (#3948) (@sy-records)
- 修復 ssl verify (#3954) (@matyhtf)
- 修復 Table 遞增和遞減時不能清除所有列問題 (#3956) (@matyhtf) (@sy-records)
- 修復使用 LibreSSL 2.7.5 編譯失敗 (#3962) (@matyhtf)
- 修復未定義的常量 CURLOPT_HEADEROPT 和 CURLOPT_PROXYHEADER (swoole/library#77) (@sy-records)

### 內核

- 默認情況下忽略 SIGPIPE 信號 (9647678) (@matyhtf)
- 支持同時運行 PHP 協程和 C 協程 (c94bfd8) (@matyhtf)
- 添加 get_elapsed 測試 (#3961) (@luolaifa000)
- 添加 get_init_msec 測試 (#3964) (@luffluo)

## v4.5.10

### 修復

- 修復使用 Event::cycle 時產生的 coredump (93901dc) (@matyhtf)
- 兼容 PHP8 (f0dc6d3) (@matyhtf)
- 修復 connection_list 錯誤 (#3948) (@sy-records)

## v4.4.23

### 修復

- 修復 Swoole\Table 自減時數據錯誤 (bcd4f60d)(0d5e72e7) (@matyhtf)
- 修復同步客戶端錯誤信息 (#3784)
- 修復解析表單數據邊界時出現的內存溢出問題 (#3858)
- 修復 channel 的bug，關閉後無法 pop 已有數據

## v4.5.9

### 增強

- 爲 Coroutine\Http\Client 添加 SWOOLE_HTTP_CLIENT_ESTATUS_SEND_FAILED 常量 (#3873) (@sy-records)

### 修復

- 兼容 PHP8 (#3868) (#3869) (#3872) (@twose) (@huanghantao) (@doubaokun)
- 修復未定義的常量 CURLOPT_HEADEROPT 和 CURLOPT_PROXYHEADER (swoole/library#77) (@sy-records)
- 修復 CURLOPT_USERPWD (swoole/library@7952a7b) (@twose)

## v4.5.8

### 新增 API

- 新增 swoole_error_log 函數，優化log_rotation (swoole/swoole-src@67d2bff) (@matyhtf)
- readVector 和 writeVector 支持 SSL (#3857) (@huanghantao)

### 增強

- 當子進程退出後，讓 System::wait 退出阻塞 (#3832) (@matyhtf)
- DTLS 支持 16K 的包 (#3849) (@matyhtf)
- Response::cookie 方法支持 priority 參數 (#3854) (@matyhtf)
- 支持更多的 CURL 選項 (swoole/library#71) (@sy-records)
- 處理 CURL HTTP header 沒有區分名字大小寫導致被覆蓋問題 (swoole/library#76) (@filakhtov) (@twose) (@sy-records)

### 修復

- 修復 readv_all 和 writev_all 錯誤處理 EAGAIN 的問題 (#3830) (@huanghantao)
- 修復 PHP8 編譯警告的問題 (swoole/swoole-src@03f3fb0) (@matyhtf)
- 修復 Swoole\Table 二進制安全的問題 (#3842) (@twose)
- 修復 MacOS 下 System::writeFile 追加文件覆蓋的問題 (swoole/swoole-src@a71956d) (@matyhtf)
- 修復 CURL 的 CURLOPT_WRITEFUNCTION (swoole/library#74) (swoole/library#75) (@sy-records)
- 修復解析 HTTP form-data 時內存溢出的問題 (#3858) (@twose)
- 修復在 PHP8 中 `is_callable()` 無法訪問類私有方法的問題 (#3859) (@twose)

### 內核

- 重構內存分配函數，使用 SwooleG.std_allocator (#3853) (@matyhtf)
- 重構管道 (#3841) (@matyhtf)

## v4.5.7

### 新增 API

- Coroutine\Socket 客戶端新增 writeVector, writeVectorAll, readVector, readVectorAll 方法 (#3764) (@huanghantao)

### 增強

- 爲 server->stats 增加 task_worker_num 和 dispatch_count (#3771) (#3806) (@sy-records) (@matyhtf)
- 添加了擴展依賴項，包括 json, mysqlnd, sockets (#3789) (@remicollet)
- 限制 server->bind 的 uid 最小值爲 INT32_MIN (#3785) (@sy-records)
- 爲 swoole_substr_json_decode 添加了編譯選項，支持負偏移量 (#3809) (@matyhtf)
- 支持 CURL 的 CURLOPT_TCP_NODELAY 選項 (swoole/library#65) (@sy-records) (@deminy)

### 修復

- 修復同步客戶端連接信息錯誤 (#3784) (@twose)
- 修復 hook scandir 函數的問題 (#3793) (@twose)
- 修復協程屏障 barrier 中的錯誤 (swoole/library#68) (@sy-records)

### 內核

- 使用 boost.stacktrace 優化 print-backtrace (#3788) (@matyhtf)

## v4.5.6

### 新增 API

- 新增 `swoole_substr_unserialize` 和 `swoole_substr_json_decode` (#3762) (@matyhtf)

### 增強

- 修改 `Coroutine\Http\Server` 的 `onAccept` 方法爲私有 (dfcc83b) (@matyhtf)

### 修復

- 修復 coverity 的問題 (#3737) (#3740) (@matyhtf)
- 修復 Alpine 環境下的一些問題 (#3738) (@matyhtf)
- 修復 swMutex_lockwait (0fc5665) (@matyhtf)
- 修復 PHP-8.1 安裝失敗 (#3757) (@twose)

### 內核

- 爲 `Socket::read/write/shutdown` 添加了活性檢測 (#3735) (@matyhtf)
- 將 session_id 和 task_id 的類型更改爲 int64 (#3756) (@matyhtf)

## v4.5.5

> [!NOTE]
> 此版本增加了[配置項](/zh-hant/server/setting.html)檢測功能，如果設置了不是Swoole提供的選項，會產生一個Warning。

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

- 增加 Process\Manager，修改 Process\ProcessManager 爲別名 (swoole/library#eac1ac5) (@matyhtf)
- 支持 HTTP2 服務器 GOAWAY (#3710) (@doubaokun)
- 增加 `Co\map()` 函數 (swoole/library#57) (@leocavalcante)

### 增強

- 支持 http2 unix socket 客戶端 (#3668) (@sy-records)
- 當 worker 進程退出之後設置 worker 進程狀態爲 SW_WORKER_EXIT (#3724) (@matyhtf)
- 在 `Server::getClientInfo()` 的返回值中增加 send_queued_bytes 和 recv_queued_bytes (#3721) (#3731) (@matyhtf) (@Yurunsoft)
- Server 支持 stats_file 配置選項 (#3725) (@matyhtf) (@Yurunsoft)

### 修復

- 修復 PHP8 下的編譯問題 (zend_compile_string change) (#3670) (@twose)
- 修復 PHP8 下的編譯問題 (ext/sockets compatibility) (#3684) (@twose)
- 修復 PHP8 下的編譯問題 (php_url_encode_hash_ex change) (#3713) (@remicollet)
- 修復從'const char*' to 'char*'的錯誤類型轉化 (#3686) (@remicollet)
- 修復 HTTP2 client 在 HTTP proxy 下無法工作的問題 (#3677) (@matyhtf) (@twose)
- 修復 PDO 斷線重連時數據混亂的問題 (swoole/library#54) (@sy-records)
- 修復 UDP Server 使用ipv6時端口解析錯誤
- 修復 Lock::lockwait 超時無效的問題

## v4.5.4

### 向下不兼容改動

- SWOOLE_HOOK_ALL 包括 SWOOLE_HOOK_CURL (#3606) (@matyhtf)
- 移除 ssl_method，增加 ssl_protocols (#3639) (@Yurunsoft)

### 新增 API

- 增加數組的 firstKey 和 lastKey 方法 (swoole/library#51) (@sy-records)

### 增強

- 增加 Websocket 服務器的 open_websocket_ping_frame, open_websocket_pong_frame 配置項 (#3600) (@Yurunsoft)

### 修復

- 修復文件大於 2G 時候，fseek ftell 不正確的問題 (#3619) (@Yurunsoft)
- 修復 Socket barrier 的問題 (#3627) (@matyhtf)
- 修復 http proxy handshake 的問題 (#3630) (@matyhtf)
- 修復對端發送 chunk 數據的時候，解析 HTTP Header 出錯的問題 (#3633) (@matyhtf)
- 修復 zend_hash_clean 斷言失敗的問題 (#3634) (@twose)
- 修復不能從事件循環移除 broken fd 的問題 (#3650) (@matyhtf)
- 修復收到無效的 packet 時導致 coredump 的問題 (#3653) (@matyhtf)
- 修復 array_key_last 的 bug (swoole/library#46) (@sy-records)

### 內核

- 代碼優化 (#3615) (#3617) (#3622) (#3635) (#3640) (#3641) (#3642) (#3645) (#3658) (@matyhtf)
- 當往 Swoole Table 寫入數據的時候減少不必要的內存操作 (#3620) (@matyhtf)
- 重構 AIO (#3624) (@Yurunsoft)
- 支持 readlink/opendir/readdir/closedir hook (#3628) (@matyhtf)
- 優化 swMutex_create, 支持 SW_MUTEX_ROBUST (#3646) (@matyhtf)

## v4.5.3

### 新增API

- 增加 `Swoole\Process\ProcessManager` (swoole/library#88f147b) (@huanghantao)
- 增加 ArrayObject::append, StringObject::equals (swoole/library#f28556f) (@matyhtf)
- 增加 [Coroutine\parallel](/zh-hant/coroutine/coroutine_api.html#parallel) (swoole/library#6aa89a9) (@matyhtf)
- 增加 [Coroutine\Barrier](/zh-hant/coroutine/barrier.html) (swoole/library#2988b2a) (@matyhtf)

### 增強

- 增加 usePipelineRead 來支持 http2 client streaming (#3354) (@twose)
- http 客戶端下載文件時，在接受數據前不創建文件 (#3381) (@twose)
- http client 支持`bind_address`和`bind_port`配置 (#3390) (@huanghantao)
- http client 支持`lowercase_header`配置 (#3399) (@matyhtf)
- `Swoole\Server`支持`tcp_user_timeout`配置 (#3404) (@huanghantao)
- `Coroutine\Socket`增加 event barrier 來減少協程切換 (#3409) (@matyhtf)
- 爲特定的 swString 增加`memory allocator` (#3418) (@matyhtf)
- cURL 支持`__toString` (swoole/library#38) (@twose)
- 支持直接在 WaitGroup 構造函數中設置`wait count` (swoole/library#2fb228b8) (@matyhtf)
- 增加`CURLOPT_REDIR_PROTOCOLS` (swoole/library#46) (@sy-records)
- http1.1 server 支持 trailer (#3485) (@huanghantao)
- 協程 sleep 時間小於 1ms 將會 yield 當前協程 (#3487) (@Yurunsoft)
- http static handler 支持軟連接的文件 (#3569) (@LeiZhang-Hunter)
- 在 Server 調用完 close 方法之後立刻關閉 WebSocket 連接 (#3570) (@matyhtf)
- 支持 hook stream_set_blocking (#3585) (@Yurunsoft)
- 異步 HTTP2 server 支持流控 (#3486) (@huanghantao) (@matyhtf)
- 釋放 socket buffer 在 onPackage 回調函數執行完 (#3551) (@huanghantao) (@matyhtf)

### 修復

- 修復 WebSocket coredump, 處理協議錯誤的狀態 (#3359) (@twose)
- 修復 swSignalfd_setup 函數以及 wait_signal 函數里的空指針錯誤 (#3360) (@twose)
- 修復在設置了 dispatch_func 時候，調用`Swoole\Server::close`會報錯的問題 (#3365) (@twose)
- 修復`Swoole\Redis\Server::format`函數中 format_buffer 初始化問題 (#3369) (@matyhtf) (@twose)
- 修復 MacOS 上無法獲取 mac 地址的問題 (#3372) (@twose)
- 修復 MySQL 測試用例 (#3374) (@qiqizjl)
- 修復多處 PHP8 兼容性問題 (#3384) (#3458) (#3578) (#3598) (@twose)
- 修復 hook 的 socket write 中丟失了 php_error_docref, timeout_event 和返回值問題 (#3383) (@twose)
- 修復異步 Server 無法在`WorkerStart`回調函數中關閉 Server 的問題 (#3382) (@huanghantao)
- 修復心跳線程在操作 conn->socket 的時候，可能會發生 coredump 的問題 (#3396) (@huanghantao)
- 修復 send_yield 的邏輯問題 (#3397) (@twose) (@matyhtf)
- 修復 Cygwin64 上的編譯問題 (#3400) (@twose)
- 修復 WebSocket finish 屬性無效的問題 (#3410) (@matyhtf)
- 修復遺漏的 MySQL transaction 錯誤狀態 (#3429) (@twose)
- 修復 hook 後的`stream_select`與 hook 之前返回值行爲不一致的問題 (#3440) (@Yurunsoft)
- 修復使用`Coroutine\System`來創建子進程時丟失`SIGCHLD`信號的問題 (#3446) (@huanghantao)
- 修復`sendwait`不支持 SSL 的問題 (#3459) (@huanghantao)
- 修復`ArrayObject`和`StringObject`的若干問題 (swoole/library#44) (@matyhtf)
- 修復 mysqli 異常信息錯誤 (swoole/library#45) (@sy-records)
- 修復當設置`open_eof_check`後，`Swoole\Client`無法獲取正確的`errCode`的問題 (#3478) (@huanghantao)
- 修復 MacOS 上 `atomic->wait()`/`wakeup()`的若干問題 (#3476) (@Yurunsoft)
- 修復`Client::connect`連接拒絕的時候，返回成功狀態的問題 (#3484) (@matyhtf)
- 修復 alpine 環境下 nullptr_t 沒有被聲明的問題 (#3488) (@limingxinleo)
- 修復 HTTP Client 下載文件的時候，double-free 的問題 (#3489) (@Yurunsoft)
- 修復`Server`被銷燬時候，`Server\Port`沒釋放導致的內存泄漏問題 (#3507) (@twose)
- 修復 MQTT 協議解析問題 (318e33a) (84d8214) (80327b3) (efe6c63) (@GXhua) (@sy-records)
- 修復`Coroutine\Http\Client->getHeaderOut`方法導致的 coredump 問題 (#3534) (@matyhtf)
- 修復 SSL 驗證失敗後，丟失了錯誤信息的問題 (#3535) (@twose)
- 修復 README 中，`Swoole benchmark`鏈接錯誤的問題 (#3536) (@sy-records) (@santalex)
- 修復在`HTTP header/cookie`中使用`CRLF`後導致的`header`注入問題 (#3539) (#3541) (#3545) (@chromium1337) (@huanghantao)
- 修復 issue #3463 中提到的變量錯誤的問題 (#3547) (chromium1337) (@huanghantao)
- 修復 pr #3463 中提到的錯別字問題 (#3547) (@deminy)
- 修復協程 WebSocket 服務器 frame->fd 爲空的問題 (#3549) (@huanghantao)
- 修復心跳線程錯誤判斷連接狀態導致的連接泄漏問題 (#3534) (@matyhtf)
- 修復`Process\Pool`中阻塞了信號的問題 (#3582) (@huanghantao) (@matyhtf)
- 修復`SAPI`中使用 send headers 的問題 (#3571) (@twose) (@sshymko)
- 修復`CURL`執行失敗的時候，未設置`errCode`和`errMsg`的問題 (swoole/library#1b6c65e) (@sy-records)
- 修復當調用了`setProtocol`方法後，`swoole_socket_coro`accept coredump 的問題 (#3591) (@matyhtf)

### 內核

- 使用 C++風格 (#3349) (#3351) (#3454) (#3479) (#3490) (@huanghantao) (@matyhtf)
- 增加`Swoole known strings`來提高`PHP`對象讀屬性的性能 (#3363) (@huanghantao)
- 多處代碼優化 (#3350) (#3356) (#3357) (#3423) (#3426) (#3461) (#3463) (#3472) (#3557) (#3583) (@huanghantao) (@twose) (@matyhtf)
- 多處測試代碼的優化 (#3416) (#3481) (#3558) (@matyhtf)
- 簡化`Swoole\Table`的`int`類型 (#3407) (@matyhtf)
- 增加`sw_memset_zero`，並且替換`bzero`函數 (#3419) (@CismonX)
- 優化日誌模塊 (#3432) (@matyhtf)
- 多處 libswoole 重構 (#3448) (#3473) (#3475) (#3492) (#3494) (#3497) (#3498) (#3526) (@matyhtf)
- 多處頭文件引入重構 (#3457) (@matyhtf) (@huanghantao)
- 增加`Channel::count()`和`Channel::get_bytes()` (f001581) (@matyhtf)
- 增加`scope guard` (#3504) (@huanghantao)
- 增加 libswoole 覆蓋率測試 (#3431) (@huanghantao)
- 增加 lib-swoole/ext-swoole MacOS 環境的測試 (#3521) (@huanghantao)
- 增加 lib-swoole/ext-swoole Alpine 環境的測試 (#3537) (@limingxinleo)

## v4.5.2

[v4.5.2](https://github.com/swoole/swoole-src/releases/tag/v4.5.2)，這是一個 BUG 修復版本, 沒有任何向下不兼容改動

### 增強

- 支持 `Server->set(['log_rotation' => SWOOLE_LOG_ROTATION_DAILY])` 來按日期生成日誌 (#3311) (@matyhtf)
- 支持 `swoole_async_set(['wait_signal' => true])`, 若存在信號監聽器時 reactor 將不會退出 (#3314) (@matyhtf)
- 支持 `Server->sendfile` 發送空文件 (#3318) (@twose)
- 優化 worker 忙閒警告信息 (#3328) (@huanghantao)
- 優化 HTTPS 代理下關於 Host 標頭的配置 (使用 ssl_host_name 來配置) (#3343) (@twose)
- SSL 默認使用 ecdh auto 模式 (#3316) (@matyhtf)
- SSL 客戶端在連接斷開時使用靜默退出 (#3342) (@huanghantao)

### 修復

- 修復 `Server->taskWait` 在 OSX 平臺上的問題 (#3330) (@matyhtf)
- 修復 MQTT 協議解析錯誤的 bug (8dbf506b) (@guoxinhua) (2ae8eb32) (@twose)
- 修復 Content-Length int 類型溢出的問題 (#3346) (@twose)
- 修復 PRI 包長度檢查缺失的問題 (#3348) (@twose)
- 修復 CURLOPT_POSTFIELDS 無法置空的問題 (swoole/library@ed192f64) (@twose)
- 修復 最新的連接對象在接收到下一個連接之前無法被釋放的問題 (swoole/library@1ef79339) (@twose)

### 內核

- Socket 寫入零拷貝特性 (#3327) (@twose)
- 使用 swoole_get_last_error/swoole_set_last_error 兩個來替代全局變量讀寫 (e25f262a) (@matyhtf) (#3315) (@huanghantao)

## v4.5.1

[v4.5.1](https://github.com/swoole/swoole-src/releases/tag/v4.5.1)，這是一個 BUG 修復版本, 補充了本應在`v4.5.0`引入的 System 文件函數廢棄標記

### 增強

- 支持 hook 下的 socket_context 的 bindto 配置 (#3275) (#3278) (@codinghuang)
- 支持 client::sendto 自動 dns 解析地址 (#3292) (@codinghuang)
- Process->exit(0)將會直接導致進程退出, 若要執行 shutdown_functions 再退出請使用 PHP 提供的 exit (a732fe56) (@matyhtf)
- 支持配置`log_date_format`以更改日誌日期格式, `log_date_with_microseconds`在日誌中顯示微秒時間戳 (baf895bc) (@matyhtf)
- 支持 CURLOPT_CAINFO and CURLOPT_CAPATH (swoole/library#32) (@sy-records)
- 支持 CURLOPT_FORBID_REUSE (swoole/library#33) (@sy-records)

### 修復

- 修復 32 位下構建失敗 (#3276) (#3277) (@remicollet) (@twose)
- 修復協程 Client 重複連接時沒有 EISCONN 錯誤信息的問題 (#3280) (@codinghuang)
- 修復 Table 模塊中潛在的 bug (d7b87b65) (@matyhtf)
- 修復 Server 中由於未定義行爲導致的空指針(防禦性編程) (#3304) (#3305) (@twose)
- 修復心跳配置開啓後產生空指針錯誤的問題 (#3307) (@twose)
- 修復 mysqli 配置不生效 (swoole/library#35)
- 修復 response 中不規範的 header(缺少空格)時解析的問題 (swoole/library#27) (@Yurunsoft)

### 廢棄

- 將 Coroutine\System::(fread/fgets/fwrite)等方法標記爲廢棄 (請使用 hook 特性替代, 直接使用 PHP 提供的文件函數) (c7c9bb40) (@twose)

### 內核

- 使用 zend_object_alloc 爲自定義對象分配內存 (cf1afb25) (@twose)
- 一些優化, 爲日誌模塊添加更多配置項 (#3296) (@matyhtf)
- 大量代碼優化工作和增加單測 (swoole/library) (@deminy)

## v4.5.0

[v4.5.0](https://github.com/swoole/swoole-src/releases/tag/v4.5.0)，這是一個大版本更新, 僅刪除了一些在 v4.4.x 已標記廢棄的模塊

### 新增 API

- DTLS 支持, 現在可以此功能來構建 WebRTC 應用 (#3188) (@matyhtf)
- 內置的`FastCGI`客戶端, 可以通過一行代碼來代理請求到 FPM 或是調用 FPM 應用 (swoole/library#17) (@twose)
- `Co::wait`, `Co::waitPid` (用於回收子進程) `Co::waitSignal` (用於等待信號) (#3158) (@twose)
- `Co::waitEvent` (用於等待 socket 上發生的指定的事件) (#3197) (@twose)
- `Co::set(['exit_condition' => $callable])` (用於自定義程序退出的條件) (#2918) (#3012) (@twose)
- `Co::getElapsed` (獲取協程運行的時間以便於分析統計或找出殭屍協程) (#3162) (@doubaokun)
- `Socket::checkLiveness` (通過系統調用判斷連接是否活躍), `Socket::peek` (窺視讀緩衝區) (#3057) (@twose)
- `Socket->setProtocol(['open_fastcgi_protocol' => $bool])` (內置的 FastCGI 解包支持) (#3103) (@twose)
- `Server::get(Master|Manager|Worker)Pid`, `Server::getWorkerId` (獲取異步 Server 單例和其信息) (#2793) (#3019) (@matyhtf)
- `Server::getWorkerStatus` (獲取 worker 進程狀態, 返回常量 SWOOLE_WORKER_BUSY, SWOOLE_WORKER_IDLE 以表示忙閒狀態) (#3225) (@matyhtf)
- `Server->on('beforeReload', $callable)` 和 `Server->on('afterReload', $callable)` (服務重啓事件, 發生在 manager 進程) (#3130) (@hantaohuang)
- `Http\Server`靜態文件處理器現在支持`http_index_files`和`http_autoindex`配置 (#3171) (@hantaohuang)
- `Http2\Client->read(float $timeout = -1)`方法支持讀取流式的響應 (#3011) (#3117) (@twose)
- `Http\Request->getContent` (rawContent 方法的別名) (#3128) (@hantaohuang)
- `swoole_mime_type_(add|set|delete|get|exists)()` (mime 相關 APIs, 可增刪查改內置的 mime 類型) (#3134) (@twose)

### 增強

- 優化 master 和 worker 進程間的內存拷貝(極限情況下提升了四倍性能) (#3075) (#3087) (@hantaohuang)
- 優化 WebSocket 派遣邏輯 (#3076) (@matyhtf)
- 優化 WebSocket 構造幀時的一次內存拷貝 (#3097) (@matyhtf)
- 優化 SSL 驗證模塊 (#3226) (@matyhtf)
- 分離 SSL accept 和 SSL handshake, 解決慢速 SSL 客戶端可能會造成協程服務器假死的問題 (#3214) (@twose)
- 支持 MIPS 架構 (#3196) (@ekongyun)
- UDP 客戶端現在可以自動解析傳入的域名 (#3236) (#3239) (@huanghantao)
- Coroutine\Http\Server 增加支持了一些常用的選項 (#3257) (@twose)
- 支持在 WebSocket 握手時設置 cookie (#3270) (#3272) (@twose)
- 支持 CURLOPT_FAILONERROR (swoole/library#20) (@sy-records)
- 支持 CURLOPT_SSLCERTTYPE, CURLOPT_SSLCERT, CURLOPT_SSLKEYTYPE, CURLOPT_SSLKEY (swoole/library#22) (@sy-records)
- 支持 CURLOPT_HTTPGET (swoole/library@d730bd08) (@shiguangqi)

### 移除

- 移除`Runtime::enableStrictMode`方法 (b45838e3) (@twose)
- 移除`Buffer`類 (559a49a8) (@twose)

### 內核相關

- 新的 C++的 API: coroutine::async 函數傳入 lambda 即可發起異步線程任務 (#3127) (@matyhtf)
- 重構底層 event-API 中的整數型 fd 爲 swSocket 對象 (#3030) (@matyhtf)
- 所有核心的 C 文件都已轉化爲 C++文件 (#3030) (71f987f3) (@matyhtf)
- 一系列代碼優化 (#3063) (#3067) (#3115) (#3135) (#3138) (#3139) (#3151) (#3168) (@hantaohuang)
- 對於頭文件的規範化優化 (#3051) (@matyhtf)
- 重構`enable_reuse_port`配置項使其更加規範 (#3192) (@matyhtf)
- 重構 Socket 相關 API 使其更加規範 (#3193) (@matyhtf)
- 通過緩衝區預測來減少一次不必要的系統調用 (3b5aa85d) (@matyhtf)
- 移除底層的刷新定時器 swServerGS::now, 直接使用時間函數獲取時間 (#3152) (@hantaohuang)
- 優化協議配置器 (#3108) (@twose)
- 兼容性更好的 C 結構初始化寫法 (#3069) (@twose)
- bit 字段統一爲 uchar 類型 (#3071) (@twose)
- 支持並行測試, 速度更快 (#3215) (@twose)

### 修復

- 修復 enable_delay_receive 開啓後 onConnect 無法觸發的問題 (#3221) (#3224) (@matyhtf)
- 所有其它的 bug 修復都已合併到 v4.4.x 分支並在更新日誌中體現, 在此不再贅述

## v4.4.22

### 修復

- 修復 HTTP2 client 在 HTTP proxy 下無法工作的問題 (#3677) (@matyhtf) (@twose)
- 修復 PDO 斷線重連時數據混亂的問題 (swoole/library#54) (@sy-records)
- 修復 swMutex_lockwait (0fc5665) (@matyhtf)
- 修復 UDP Server 使用ipv6時端口解析錯誤
- 修復 systemd fds 的問題

## v4.4.20

[v4.4.20](https://github.com/swoole/swoole-src/releases/tag/v4.4.20)，這是一個BUG修復版本, 沒有任何向下不兼容改動

### 修復

- 修復在設置了 dispatch_func 時候，調用`Swoole\Server::close`會報錯的問題 (#3365) (@twose)
- 修復`Swoole\Redis\Server::format`函數中 format_buffer 初始化問題 (#3369) (@matyhtf) (@twose)
- 修復 MacOS 上無法獲取 mac 地址的問題 (#3372) (@twose)
- 修復 MySQL 測試用例 (#3374) (@qiqizjl)
- 修復異步 Server 無法在`WorkerStart`回調函數中關閉 Server 的問題 (#3382) (@huanghantao)
- 修復遺漏的 MySQL transaction 錯誤狀態 (#3429) (@twose)
- 修復 HTTP Client 下載文件的時候，double-free 的問題 (#3489) (@Yurunsoft)
- 修復`Coroutine\Http\Client->getHeaderOut`方法導致的 coredump 問題 (#3534) (@matyhtf)
- 修復在`HTTP header/cookie`中使用`CRLF`後導致的`header`注入問題 (#3539) (#3541) (#3545) (@chromium1337) (@huanghantao)
- 修復協程 WebSocket 服務器 frame->fd 爲空的問題 (#3549) (@huanghantao)
- 修復 hook phpredis 產生的`read error on connection`問題 (#3579) (@twose)
- 修復 MQTT 協議解析問題 (#3573) (#3517) (9ad2b455) (@GXhua) (@sy-records)

## v4.4.19

[v4.4.19](https://github.com/swoole/swoole-src/releases/tag/v4.4.19)，這是一個 BUG 修復版本, 沒有任何向下不兼容改動

> [!NOTE]
> 注意: v4.4.x 不再是主要的維護版本，僅在必要時修復 BUG

### 修復

- 從 v4.5.2 合併了所有 bug 修復補丁

## v4.4.18

[v4.4.18](https://github.com/swoole/swoole-src/releases/tag/v4.4.18)，這是一個 BUG 修復版本, 沒有任何向下不兼容改動

### 增強

- UDP 客戶端現在可以自動解析傳入的域名 (#3236) (#3239) (@huanghantao)
- CLI 模式下不再關閉 stdout 和 stderr (顯示在 shutdown 之後產生的錯誤日誌) (#3249) (@twose)
- Coroutine\Http\Server 增加支持了一些常用的選項 (#3257) (@twose)
- 支持在 WebSocket 握手時設置 cookie (#3270) (#3272) (@twose)
- 支持 CURLOPT_FAILONERROR (swoole/library#20) (@sy-records)
- 支持 CURLOPT_SSLCERTTYPE, CURLOPT_SSLCERT, CURLOPT_SSLKEYTYPE, CURLOPT_SSLKEY (swoole/library#22) (@sy-records)
- 支持 CURLOPT_HTTPGET (swoole/library@d730bd08) (@shiguangqi)
- 儘可能地兼容了所有 PHP-Redis 擴展的版本 (不同版本的構造函數傳參不同) (swoole/library#24) (@twose)
- 禁止克隆連接對象 (swoole/library#23) (@deminy)

### 修復

- 修復 SSL 握手失敗的問題 (dc5ac29a) (@twose)
- 修復生成錯誤信息時產生的內存錯誤 (#3229) (@twose)
- 修復空白的 proxy 驗證信息 (#3243) (@twose)
- 修復 Channel 的內存泄漏問題 (並非真正的內存泄漏) (#3260) (@twose)
- 修復 Co\Http\Server 在循環引用時產生的一次性內存泄露 (#3271) (@twose)
- 修復`ConnectionPool->fill`中的書寫錯誤 (swoole/library#18) (@NHZEX)
- 修復 curl 客戶端遭遇重定向時沒有更新連接的問題 (swoole/library#21) (@doubaokun)
- 修復產生 ioException 時空指針的問題 (swoole/library@4d15a4c3) (@twose)
- 修復 ConnectionPool@put 傳入 null 時沒有歸還新連接導致的死鎖問題 (swoole/library#25) (@Sinute)
- 修復 mysqli 代理實現導致的 write_property 錯誤 (swoole/library#26) (@twose)

## v4.4.17

[v4.4.17](https://github.com/swoole/swoole-src/releases/tag/v4.4.17)，這是一個 BUG 修復版本, 沒有任何向下不兼容改動

### 增強

- 提升 SSL 服務器的性能 (#3077) (85a9a595) (@matyhtf)
- 移除 HTTP 頭大小限制 (#3187) (@twose)
- 支持 MIPS (#3196) (@ekongyun)
- 支持 CURLOPT_HTTPAUTH (swoole/library@570318be) (@twose)

### 修復

- 修復 package_length_func 的行爲和可能的一次性內存泄漏 (#3111) (@twose)
- 修復 HTTP 狀態碼 304 下的錯誤行爲 (#3118) (#3120) (@twose)
- 修復 Trace 日誌錯誤的宏展開導致的內存錯誤 (#3142) (@twose)
- 修復 OpenSSL 函數簽名 (#3154) (#3155) (@twose)
- 修復 SSL 錯誤信息 (#3172) (@matyhtf) (@twose)
- 修復 PHP-7.4 下的兼容性 (@twose) (@matyhtf)
- 修復 HTTP-chunk 的長度解析錯誤問題 (19a1c712) (@twose)
- 修復 chunked 模式下 multipart 請求的解析器行爲 (3692d9de) (@twose)
- 修復 PHP-Debug 模式下 ZEND_ASSUME 斷言失敗 (fc0982be) (@twose)
- 修復 Socket 錯誤的地址 (d72c5e3a) (@twose)
- 修復 Socket getname (#3177) (#3179) (@matyhtf)
- 修復靜態文件處理器對於空文件的錯誤處理 (#3182) (@twose)
- 修復 Coroutine\Http\Server 上傳文件問題 (#3189) (#3191) (@twose)
- 修復 shutdown 期間可能的內存錯誤 (44aef60a) (@matyhtf)
- 修復 Server->heartbeat (#3203) (@matyhtf)
- 修復 CPU 調度器可能無法調度死循環的情況 (#3207) (@twose)
- 修復在不可變數組上的無效寫入操作 (#3212) (@twose)
- 修復 WaitGroup 多次 wait 問題 (swoole/library@537a82e1) (@twose)
- 修復空 header 的處理 (和 cURL 保持一致) (swoole/library@7c92ed5a) (@twose)
- 修復非 IO 方法返回 false 時拋出異常的問題 (swoole/library@f6997394) (@twose)
- 修復 cURL-hook 下使用 proxy 端口號被多次添加到標頭的問題 (swoole/library@5e94e5da) (@twose)

## v4.4.16

[v4.4.16](https://github.com/swoole/swoole-src/releases/tag/v4.4.16)，這是一個 BUG 修復版本, 沒有任何向下不兼容改動

### 增強

- 現在你可以獲取 [Swoole 版本支持信息](https://github.com/swoole/swoole-src/blob/master/SUPPORTED.md)
- 更友好的錯誤提示 (0412f442) (09a48835) (@twose)
- 防止在某些特殊系統上陷入系統調用死循環 (069a0092) (@matyhtf)
- 在 PDOConfig 中增加驅動選項 (swoole/library#8) (@jcheron)

### 修復

- 修復 http2_session.default_ctx 內存錯誤 (bddbb9b1) (@twose)
- 修復未初始化的 http_context (ce77c641) (@twose)
- 修復 Table 模塊中的書寫錯誤 (可能會造成內存錯誤) (db4eec17) (@twose)
- 修復 Server 中 task-reload 的潛在問題 (e4378278) (@GXhua)
- 修復不完整協程 HTTP 服務器請求原文 (#3079) (#3085) (@hantaohuang)
- 修復 static handler (當文件爲空時, 不應返回 404 響應) (#3084) (@Yurunsoft)
- 修復 http_compression_level 配置無法正常工作 (16f9274e) (@twose)
- 修復 Coroutine HTTP2 Server 由於沒有註冊 handle 而產生空指針錯誤 (ed680989) (@twose)
- 修復配置 socket_dontwait 不工作的問題 (27589376) (@matyhtf)
- 修復 zend::eval 可能會被執行多次的問題 (#3099) (@GXhua)
- 修復 HTTP2 服務器由於在連接關閉後響應而產生的空指針錯誤 (#3110) (@twose)
- 修復 PDOStatementProxy::setFetchMode 適配不當的問題 (swoole/library#13) (@jcheron)
