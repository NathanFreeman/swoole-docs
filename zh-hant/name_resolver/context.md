# Context

`Swoole\NameResolver\Context` 是名字解析的上下文對象，用於指定期望的 `IP` 族，以及解析結果是否附帶端口。

> [!NOTE]
> `Context` 不可序列化、不可克隆，也不能動態 unset 屬性。

## __construct

```php
public function __construct(int $family = AF_INET, bool $withPort = false)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$family` | 期望的 `IP` 族，通常使用 `AF_INET`（`IPv4`）或 `AF_INET6`（`IPv6`） | `AF_INET` |
| `$withPort` | 爲 `true` 時解析結果附帶端口；客戶端 `connect` 時會用解析出的端口覆蓋目標端口 | `false` |

**端口格式**

- `IPv4`：`ip:port`，例如 `127.0.0.2:8080`。
- `IPv6`：協程 `Socket` 內部使用 `ip@port` 形式分隔地址和端口。

> [!WARNING]
> 同一個 `Context` 對象不要用於解析不同的名字。解析器返回 [Cluster](/zh-hant/name_resolver/cluster.html) 時，`Context` 會緩存該集羣並逐個彈出節點；節點未耗盡時再次調用 `swoole_name_resolver_lookup` 不會重新查詢解析器，而是繼續消費舊集羣。每次解析不同名字請使用新的 `Context`。

**示例**

```php
<?php
use Swoole\NameResolver\Context;

$ctx = new Context(AF_INET, true);
$addr = swoole_name_resolver_lookup('my-service', $ctx);
var_dump($addr); // 形如 '127.0.0.2:8080'
```