# 自定義解析器

`Swoole\NameResolver` 是抽象基類。繼承它並實現 `join`、`leave`、`getCluster` 三個抽象方法，即可註冊自定義名字解析器；也可以直接覆蓋 `lookup` 方法接管解析邏輯。

## __construct

```php
public function __construct($url, protected $prefix = 'swoole_service_')
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$url` | 註冊中心地址，必須包含 scheme 和 host，例如 `http://127.0.0.1:8500` | 必填 |
| `$prefix` | 服務名前綴，註冊和查詢時都會拼接到名字前 | `'swoole_service_'` |

> [!NOTE]
> 構造時會校驗 URL；host 不是合法 `IP` 時會先解析爲 `IP`。僅做解析、不連接註冊中心的自定義解析器可以覆蓋構造函數。

## join

抽象方法，向註冊中心註冊一個服務節點。

```php
abstract public function join(string $name, string $ip, int $port, array $options = []): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$name` | 服務名 | 必填 |
| `$ip` | 節點 `IP` | 必填 |
| `$port` | 節點端口 | 必填 |
| `$options` | 額外選項，由子類自行解釋 | `[]` |

**返回值**：註冊成功返回 `true`，失敗返回 `false`。

## leave

抽象方法，從註冊中心摘除一個服務節點。

```php
abstract public function leave(string $name, string $ip, int $port): bool
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$name` | 服務名 | 必填 |
| `$ip` | 節點 `IP` | 必填 |
| `$port` | 節點端口 | 必填 |

**返回值**：摘除成功返回 `true`，失敗返回 `false`。

## getCluster

抽象方法，查詢服務名對應的節點集羣。

```php
abstract public function getCluster(string $name): ?Swoole\NameResolver\Cluster
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$name` | 服務名 | 必填 |

**返回值**：返回 [Cluster](/zh-hant/name_resolver/cluster.html) 對象；沒有可用節點時返回 `null`。

## withFilter

設置名字過濾器，鏈式返回自身。

```php
public function withFilter(callable $fn): self
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$fn` | 過濾回調，接收名字字符串；僅當返回 `true` 時基類 `lookup` 纔處理該名字 | 必填 |

**返回值**：返回當前解析器對象。

## getFilter

獲取已設置的過濾器回調。

```php
public function getFilter(): mixed
```

**返回值**：返回過濾器回調；未設置時返回 `null`。

## hasFilter

判斷是否設置了過濾器。

```php
public function hasFilter(): bool
```

**返回值**：已設置過濾器返回 `true`，否則返回 `false`。

## lookup

執行名字解析。基類已提供默認實現：先檢查過濾器，再調用 `getCluster` 獲取集羣。

```php
public function lookup(string $name): Swoole\NameResolver\Cluster|string|false|null
```

| 參數 | 說明 | 默認值 |
|:---|:---|:---|
| `$name` | 要解析的名字 | 必填 |

**返回值契約**

| 返回值 | 含義 |
|:---|:---|
| `Swoole\NameResolver\Cluster` 對象 | 多節點集羣，底層按權重隨機彈出節點，逐個嘗試直到耗盡 |
| 非空 `IP` 字符串 | 最終解析結果，必須是合法 `IP`；`withPort` 爲 `true` 時可附帶端口 |
| `''`（空字符串） | 終止解析，不再查詢後續解析器 |
| `false` / `null` | 跳過本解析器，交給下一個；全部落空則回退普通 `DNS` |

> [!WARNING]
> 底層只把 `Cluster` 對象和字符串當作有效解析結果；返回其他類型會按跳過處理。自定義 `lookup` 不要返回節點數組，單節點請直接返回 `IP` 字符串或只含一個節點的 `Cluster`。

> [!TIP]
> 未設置過濾器時，註冊中心故障拋出的異常會被底層吞掉並回退 `DNS`，避免影響普通域名解析；設置了過濾器則異常原樣拋出。

**示例**

```php
<?php
$resolver = new class extends Swoole\NameResolver {
    public function __construct() {}
    public function join(string $name, string $ip, int $port, array $options = []): bool { return true; }
    public function leave(string $name, string $ip, int $port): bool { return true; }
    public function getCluster(string $name): ?Swoole\NameResolver\Cluster { return null; }
    public function lookup(string $name) {
        if ($name === 'my-service') {
            return '127.0.0.2';
        }
        return null; // 交給下一個解析器或回退 DNS
    }
};
swoole_name_resolver_add($resolver);
```