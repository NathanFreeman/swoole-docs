# Swoole\Http\Cookie

[cookie](/en/server/class/response.html#cookie-1) and [rawcookie](/en/server/class/response.html#rawcookie) were originally designed to mirror PHP's [setcookie](https://www.php.net/manual/en/function.setcookie.php), but this approach has some problems:

- The parameter list is too long; during development you often have to consult the documentation to confirm the meaning of each parameter.
- Poor extensibility: if the Cookie protocol changes in the future, new parameters would have to be added to adapt.

To solve these problems, we introduced `Swoole\Http\Cookie` to simplify how `Cookie` is set and used.

## Methods

### __construct

Creates a `Cookie` class instance.

```php
public function __construct(bool $encode = true)
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$encode` | Whether to encode the `Cookie`'s `Value`. Other value: `false` | `true` |

### withName

Sets the `Cookie`'s `key`.

```php
public function withName(string $name): \Swoole\Http\Cookie
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$name` | The `Cookie`'s `Key` | Required |

**Return value**: Returns a `Swoole\Http\Cookie` object.

### withValue

Sets the `Cookie`'s `value`.

```php
public function withValue(string $value = ''): \Swoole\Http\Cookie
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$value` | The `Cookie`'s `value` | `''` |

**Return value**: Returns a `Swoole\Http\Cookie` object.

### withExpires

The `Cookie`'s `expiration time`.

```php
public function withExpires(int $expires = 0): \Swoole\Http\Cookie
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$expires` | The `Cookie`'s `expiration time` | `0`, never expires |

**Return value**: Returns a `Swoole\Http\Cookie` object.

### withPath

Specifies the server path of the `Cookie`.

```php
public function withPath(string $path = '/'): \Swoole\Http\Cookie
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$path` | Specifies the server path of the `Cookie` | `/` |

**Return value**: Returns a `Swoole\Http\Cookie` object.

### withDomain

Specifies the domain of the `Cookie`.

```php
public function withDomain(string $domain = ''): \Swoole\Http\Cookie
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$domain` | Specifies the domain of the `Cookie` | `''` |

**Return value**: Returns a `Swoole\Http\Cookie` object.

### withSecure

Specifies whether the `Cookie` should be transmitted over a secure `HTTPS` connection.

```php
public function withSecure(bool $secure = false): \Swoole\Http\Cookie
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$secure` | Specifies whether the `Cookie` should be transmitted over a secure `HTTPS` connection | `false` |

**Return value**: Returns a `Swoole\Http\Cookie` object.

### withHttpOnly

Whether the browser's JavaScript is allowed to access a `Cookie` with the `HttpOnly` attribute. `true` means not allowed, `false` means allowed.

```php
public function withHttpOnly(bool $httpOnly = false): \Swoole\Http\Cookie
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$httpOnly` | Whether the browser's JavaScript is allowed to access a `Cookie` with the `HttpOnly` attribute. `true` means not allowed, `false` means allowed | `false` |

**Return value**: Returns a `Swoole\Http\Cookie` object.

### withSameSite

Restricts third-party `Cookie` usage to reduce security risks. Possible values are `Strict`, `Lax`, `None`.

```php
public function withSameSite(string $sameSite = ''): \Swoole\Http\Cookie
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$sameSite` | Restricts third-party `Cookie` usage to reduce security risks. Possible values are `Strict`, `Lax`, `None` | `''` |

**Return value**: Returns a `Swoole\Http\Cookie` object.

### withPriority

The `Cookie` priority. When the number of `Cookie`s exceeds the allowed limit, low-priority ones are deleted first. Possible values are `Low`, `Medium`, `High`.

```php
public function withPriority(string $priority = ''): \Swoole\Http\Cookie
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$priority` | The `Cookie` priority. When the number of `Cookie`s exceeds the allowed limit, low-priority ones are deleted first. Possible values are `Low`, `Medium`, `High` | `''` |

**Return value**: Returns a `Swoole\Http\Cookie` object.

### withPartitioned

Makes a third-party `Cookie` no longer shared across all websites, but instead bound to the specific site where it was originally set (the "top-level site"), effectively preventing cross-site tracking while preserving necessary functionality.

```php
public function withPartitioned(bool $partitioned = false): \Swoole\Http\Cookie
```

| Parameter | Description | Default |
|:---|:---|:---|
| `$partitioned` | Makes a third-party `Cookie` no longer shared across all websites. Other value: `true` | `false` |

**Return value**: Returns a `Swoole\Http\Cookie` object.

### toArray

Converts the `Swoole\Http\Cookie` object to an array.

```php
public function toArray(): array
```

**Return value**: Returns an array.

### toString

Converts the `Swoole\Http\Cookie` object to a `Cookie` string.

```php
public function toString(): string | false
```

**Return value**: Returns a string on success, or `false` on failure.

### reset

Resets the entire `Swoole\Http\Cookie` object, setting all properties to their default values.

```php
public function reset(): void
```

## Examples

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