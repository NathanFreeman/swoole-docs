# Swoole\Http\Cookie

[cookie](/zh/server/class/response.html#cookie-1) 和 [rawcookie](/zh/server/class/response.html#rawcookie) 在设计之初，是对照 PHP 的 [setcookie](https://www.php.net/manual/en/function.setcookie.php) 来设计的，但是这样做有个问题：

- 函数参数过长，开发时经常需要查阅文档才能确认每个参数的含义。
- 扩展性差，若 Cookie 协议未来发生变更，不得不新增参数来适配。

为解决这些问题，我们引入了 `Swoole\Http\Cookie`，以简化 `Cookie` 的设置与调用方式。

## 方法

### __construct

创建一个 `Cookie` 类。

```php
public function __construct(bool $encode = true)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$encode` | 是否对 `Cookie` 的 `Value` 进行编码，其它值：`false` | `true` |

### withName

设置 `Cookie` 的 `key`。

```php
public function withName(string $name): \Swoole\Http\Cookie
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$name` | `Cookie` 的 `Key` | 必填 |

**返回值**：返回 `Swoole\Http\Cookie` 对象。

### withValue

设置 `Cookie` 的 `value`。

```php
public function withValue(string $value = ''): \Swoole\Http\Cookie
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$value` | `Cookie` 的 `value` | `''` |

**返回值**：返回 `Swoole\Http\Cookie` 对象。

### withExpires

`Cookie` 的 `过期时间`。

```php
public function withExpires(int $expires = 0): \Swoole\Http\Cookie
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$expires` | `Cookie` 的 `过期时间` | `0`，不过期 |

**返回值**：返回 `Swoole\Http\Cookie` 对象。

### withPath

规定 `Cookie` 的服务器路径。

```php
public function withPath(string $path = '/'): \Swoole\Http\Cookie
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$path` | 规定 `Cookie` 的服务器路径 | `/` |

**返回值**：返回 `Swoole\Http\Cookie` 对象。

### withDomain

规定 `Cookie` 的域名。

```php
public function withDomain(string $domain = ''): \Swoole\Http\Cookie
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$domain` | 规定 `Cookie` 的域名 | `''` |

**返回值**：返回 `Swoole\Http\Cookie` 对象。

### withSecure

规定是否通过安全的 `HTTPS` 连接来传输 `Cookie`。

```php
public function withSecure(bool $secure = false): \Swoole\Http\Cookie
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$secure` | 规定是否通过安全的 `HTTPS` 连接来传输 `Cookie` | `false` |

**返回值**：返回 `Swoole\Http\Cookie` 对象。

### withHttpOnly

是否允许浏览器的 JavaScript 访问带有 `HttpOnly` 属性的 `Cookie`，`true` 表示不允许，`false` 表示允许。

```php
public function withHttpOnly(bool $httpOnly = false): \Swoole\Http\Cookie
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$httpOnly` | 是否允许浏览器的 JavaScript 访问带有 `HttpOnly` 属性的 `Cookie`，`true` 表示不允许，`false` 表示允许 | `false` |

**返回值**：返回 `Swoole\Http\Cookie` 对象。

### withSameSite

限制第三方 `Cookie`，从而减少安全风险，可选值为 `Strict`，`Lax`，`None`。

```php
public function withSameSite(string $sameSite = ''): \Swoole\Http\Cookie
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$sameSite` | 限制第三方 `Cookie`，从而减少安全风险，可选值为 `Strict`，`Lax`，`None` | `''` |

**返回值**：返回 `Swoole\Http\Cookie` 对象。

### withPriority

`Cookie` 优先级，当 `Cookie` 数量超过规定，低优先级的会先被删除，可选值为 `Low`，`Medium`，`High`。

```php
public function withPriority(string $priority = ''): \Swoole\Http\Cookie
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$priority` | `Cookie` 优先级，当 `Cookie` 数量超过规定，低优先级的会先被删除，可选值为 `Low`，`Medium`，`High` | `''` |

**返回值**：返回 `Swoole\Http\Cookie` 对象。

### withPartitioned

让第三方 `Cookie` 不再跨所有网站通用，而是绑定到它最初被设置时所在的那个特定网站（即“顶级站点”），从而在保留必要功能的同时，有效阻止跨站跟踪。

```php
public function withPartitioned(bool $partitioned = false): \Swoole\Http\Cookie
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$partitioned` | 让第三方 `Cookie` 不再跨所有网站通用，其它值：`true` | `false` |

**返回值**：返回 `Swoole\Http\Cookie` 对象。

### toArray

将 `Swoole\Http\Cookie` 对象转化数组。

```php
public function toArray(): array
```

**返回值**：返回一个数组。

### toString

将 `Swoole\Http\Cookie` 对象转化 `Cookie` 的字符串。

```php
public function toString(): string | false
```

**返回值**：操作成功返回字符串，操作失败返回 `false`。

### reset

重置整个 `Swoole\Http\Cookie` 对象，将所有属性设置为默认值。

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
