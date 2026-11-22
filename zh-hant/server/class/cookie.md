# Swoole\Http\Cookie

[cookie](/zh-hant/server/class/response.html#cookie-1) 和 [rawcookie](/zh-hant/server/class/response.html#rawcookie) 在設計之初，是對照 PHP 的 [setcookie](https://www.php.net/manual/en/function.setcookie.php) 來設計的，但是這樣做有個問題：

- 函數參數過長，開發時經常需要查閱文檔才能確認每個參數的含義。
- 擴展性差，若 Cookie 協議未來發生變更，不得不新增參數來適配。

爲解決這些問題，我們引入了 `Swoole\Http\Cookie`，以簡化 `Cookie` 的設置與調用方式。

## 方法

### __construct

創建一個 `Cookie` 類。

```php
public function __construct(bool $encode = true)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$encode` | 是否對 `Cookie` 的 `Value` 進行編碼，其它值：`false` | `true` |

### withName

設置 `Cookie` 的 `key`。

```php
public function withName(string $name): \Swoole\Http\Cookie
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$name` | `Cookie` 的 `Key` | 必填 |

**返回值**：返回 `Swoole\Http\Cookie` 對象。

### withValue

設置 `Cookie` 的 `value`。

```php
public function withValue(string $value = ''): \Swoole\Http\Cookie
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$value` | `Cookie` 的 `value` | `''` |

**返回值**：返回 `Swoole\Http\Cookie` 對象。

### withExpires

`Cookie` 的 `過期時間`。

```php
public function withExpires(int $expires = 0): \Swoole\Http\Cookie
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$expires` | `Cookie` 的 `過期時間` | `0`，不過期 |

**返回值**：返回 `Swoole\Http\Cookie` 對象。

### withPath

規定 `Cookie` 的服務器路徑。

```php
public function withPath(string $path = '/'): \Swoole\Http\Cookie
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$path` | 規定 `Cookie` 的服務器路徑 | `/` |

**返回值**：返回 `Swoole\Http\Cookie` 對象。

### withDomain

規定 `Cookie` 的域名。

```php
public function withDomain(string $domain = ''): \Swoole\Http\Cookie
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$domain` | 規定 `Cookie` 的域名 | `''` |

**返回值**：返回 `Swoole\Http\Cookie` 對象。

### withSecure

規定是否通過安全的 `HTTPS` 連接來傳輸 `Cookie`。

```php
public function withSecure(bool $secure = false): \Swoole\Http\Cookie
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$secure` | 規定是否通過安全的 `HTTPS` 連接來傳輸 `Cookie` | `false` |

**返回值**：返回 `Swoole\Http\Cookie` 對象。

### withHttpOnly

是否允許瀏覽器的 JavaScript 訪問帶有 `HttpOnly` 屬性的 `Cookie`，`true` 表示不允許，`false` 表示允許。

```php
public function withHttpOnly(bool $httpOnly = false): \Swoole\Http\Cookie
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$httpOnly` | 是否允許瀏覽器的 JavaScript 訪問帶有 `HttpOnly` 屬性的 `Cookie`，`true` 表示不允許，`false` 表示允許 | `false` |

**返回值**：返回 `Swoole\Http\Cookie` 對象。

### withSameSite

限制第三方 `Cookie`，從而減少安全風險，可選值爲 `Strict`，`Lax`，`None`。

```php
public function withSameSite(string $sameSite = ''): \Swoole\Http\Cookie
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$sameSite` | 限制第三方 `Cookie`，從而減少安全風險，可選值爲 `Strict`，`Lax`，`None` | `''` |

**返回值**：返回 `Swoole\Http\Cookie` 對象。

### withPriority

`Cookie` 優先級，當 `Cookie` 數量超過規定，低優先級的會先被刪除，可選值爲 `Low`，`Medium`，`High`。

```php
public function withPriority(string $priority = ''): \Swoole\Http\Cookie
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$priority` | `Cookie` 優先級，當 `Cookie` 數量超過規定，低優先級的會先被刪除，可選值爲 `Low`，`Medium`，`High` | `''` |

**返回值**：返回 `Swoole\Http\Cookie` 對象。

### withPartitioned

讓第三方 `Cookie` 不再跨所有網站通用，而是綁定到它最初被設置時所在的那個特定網站（即“頂級站點”），從而在保留必要功能的同時，有效阻止跨站跟蹤。

```php
public function withPartitioned(bool $partitioned = false): \Swoole\Http\Cookie
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$partitioned` | 讓第三方 `Cookie` 不再跨所有網站通用，其它值：`true` | `false` |

**返回值**：返回 `Swoole\Http\Cookie` 對象。

### toArray

將 `Swoole\Http\Cookie` 對象轉化數組。

```php
public function toArray(): array
```

**返回值**：返回一個數組。

### toString

將 `Swoole\Http\Cookie` 對象轉化 `Cookie` 的字符串。

```php
public function toString(): string | false
```

**返回值**：操作成功返回字符串，操作失敗返回 `false`。

### reset

重置整個 `Swoole\Http\Cookie` 對象，將所有屬性設置爲默認值。

```php
public function reset(): void
```

## 示例

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\Http\Cookie;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function(Request $request, Response $response) {
    $cookie = new Cookie();
    $cookie->withName('key1')
        ->withValue('val1')
        ->withExpires(time() + 84600)
        ->withPath('/')
        ->withDomain('id.test.com')
        ->withSecure(true)
        ->withHttpOnly(true)
        ->withSameSite('None')
        ->withPriority('High')
        ->withPartitioned(true);
    
    var_dump($cookie->toArray());
    var_dump($cookie->toString());
    $response->cookie($cookie);
    $response->end('Hello World');
});
$server->start();
```
