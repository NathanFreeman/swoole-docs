# Swoole\SendFile

`Swoole\SendFile` 是 `v6.3.0` 版本引入的輔助類，是專門描述「待發送文件」的對象。它將文件路徑、偏移量、發送長度以及「發送後自動刪除」選項封裝爲一個對象，可直接傳遞給 [Swoole\Http\Response::sendfile()](/zh-hant/server/class/response.html#sendfile) 和 [Swoole\Server::sendfile()](/zh-hant/server/methods.html#sendfile)。

針對「先生成臨時報表再發送」的業務場景，將 `deleteAfterSend` 設爲 `true` 後，文件在發送任務結束時會自動刪除，無需業務代碼手動執行 `unlink`，大幅簡化了文件生命週期管理。

## 屬性

| 屬性 | 類型 | 說明 | 默認值 |
|:---|:---|:---|:---|
| `$filename` | `string` | 文件路徑，通過構造函數傳入，只讀 | 必填 |
| `$offset` | `int` | 文件偏移量，從文件的指定位置開始發送，必須大於或等於 `0` | `0` |
| `$length` | `int` | 發送數據的長度，必須大於或等於 `0`，`0` 表示發送從 `$offset` 起的全部剩餘內容 | `0` |
| `$deleteAfterSend` | `bool` | 發送任務結束時是否自動刪除文件 | `false` |

## 方法

### __construct

構造一個待發送文件對象。

```php
public function __construct(string $filename)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$filename` | 文件路徑，不能爲空，不能包含 `null` 字節 | 必填 |

## 示例

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\SendFile;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function (Request $request, Response $response) {
    // 先生成臨時報表
    $filename = tempnam(sys_get_temp_dir(), 'report_');
    file_put_contents($filename, 'report content');

    // 發送完成後自動刪除臨時文件
    $file = new SendFile($filename);
    $file->deleteAfterSend = true;
    $response->sendfile($file);
});
$server->start();
```

> [!WARNING]
> **注意**
>
> - Swoole 版本 >= `v6.3.0` 可用。
> - 向 `sendfile()` 傳入 `SendFile` 對象時，不得再傳入 `$offset`、`$length`、`$delete_file` 參數，否則拋出 `ValueError`，發送選項以對象屬性爲準。
> - `$filename` 爲只讀屬性，構造函數只能調用一次。
> - `deleteAfterSend` 爲 `true` 時，發送請求一旦被底層接受，文件清理的所有權即轉移給底層，該對象不能再次用於 `sendfile()`，否則拋出 `Error`。
> - 文件在發送任務結束時自動刪除，包括發送失敗或連接提前關閉的情況；若參數校驗失敗（如文件不存在），文件會保留。
> - 該類爲 `final`，不可序列化、不可克隆。