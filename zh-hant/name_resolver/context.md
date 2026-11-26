# Context

`Swoole\NameResolver\Context` 是**手動**調用 [swoole_name_resolver_lookup](/zh-hant/name_resolver/functions.html#swoole-name-resolver-lookup) 時傳入的第二個參數，告訴底層兩件事：要 `IPv4` 還是 `IPv6`、解析結果要不要附帶端口。

> [!TIP]
> 客戶端自動 `connect` 域名時，底層會自己創建 `Context`，你通常不需要手動 `new`。例如 `Co\Http\Client` 端口傳 `0` 時，底層自動把 `withPort` 設爲 `true`。只有想「先解析出地址、再自己決定怎麼連」時才需要手動構造 `Context`。

## 有什麼用：withPort 對照

最典型的用途是配合 `Co\Socket` 這類需要自己拿到 `IP:端口` 的客戶端。

```php
<?php
use Swoole\NameResolver\Context;

class ClusterResolver extends Swoole\NameResolver
{
    public function __construct() {}
    public function join(string $name, string $ip, int $port, array $options = []): bool { return true; }
    public function leave(string $name, string $ip, int $port): bool { return true; }
    public function getCluster(string $name): ?Swoole\NameResolver\Cluster { return null; }

    public function lookup(string $name)
    {
        if ($name !== 'user_service') {
            return null;
        }
        $cluster = new Swoole\NameResolver\Cluster();
        $cluster->add('127.0.0.1', 9501);
        return $cluster;
    }
}
swoole_name_resolver_add(new ClusterResolver());

// 默認 withPort=false：只拿到 IP
var_dump(swoole_name_resolver_lookup('user_service', new Context()));              // '127.0.0.1'
// withPort=true：拿到 IP:端口
var_dump(swoole_name_resolver_lookup('user_service', new Context(AF_INET, true))); // '127.0.0.1:9501'

// 用帶端口的結果手動連接
Co\run(function () {
    $addr = swoole_name_resolver_lookup('user_service', new Context(AF_INET, true));
    [$host, $port] = explode(':', $addr);
    $sock = new Co\Socket(AF_INET, SOCK_STREAM, 0);
    $sock->connect($host, (int) $port);
    $sock->send("GET / HTTP/1.0\r\n\r\n");
    echo $sock->recv();
    $sock->close();
});
```

> [!NOTE]
> `withPort` 只對返回 [Cluster](/zh-hant/name_resolver/cluster.html) 的解析器生效（彈出節點時拼上端口）；解析器直接返回字符串時原樣返回，端口由解析器自己決定。

## family

`$family` 取 `AF_INET`（`IPv4`）或 `AF_INET6`（`IPv6`），主要影響**所有解析器都落空時**的 `DNS` 回退記錄類型（`A` / `AAAA`）。`PHP` 解析器自身返回的結果不受它約束。

## __construct

```php
public function __construct(int $family = AF_INET, bool $withPort = false)
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$family` | 期望的 `IP` 族，`AF_INET` 或 `AF_INET6` | `AF_INET` |
| `$withPort` | 結果是否附帶端口（僅對返回 `Cluster` 的解析器生效） | `false` |

**端口格式**

- `IPv4`：`ip:port`，例如 `127.0.0.1:9501`。
- `IPv6`：協程 `Socket` 內部用 `ip@port` 分隔地址和端口。

> [!WARNING]
> 同一個 `Context` 不要用於解析不同的名字。解析器返回 `Cluster` 時，`Context` 會緩存該集羣並逐個彈出節點；節點未耗盡時再次 `lookup` 不會重新查詢解析器，而是繼續消費舊集羣。解析不同名字請每次 `new` 新的 `Context`。

> [!NOTE]
> `Context` 不可序列化、不可克隆，也不能動態 unset 屬性。