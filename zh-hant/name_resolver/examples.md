# 使用示例

三個可直接運行的例子，覆蓋自定義解析、`Redis` 服務發現和多節點負載均衡。

> [!NOTE]
> 名字解析只在協程客戶端連接**非 `IP` 的主機名**時觸發；連接 `127.0.0.1` 這類字面 `IP` 不會走解析器。

## 示例一：自定義解析器把服務名映射到固定地址

適合用服務名代替硬編碼 `IP` 的內部調用。

```php
<?php
class StaticResolver extends Swoole\NameResolver
{
    public function __construct() {}
    public function join(string $name, string $ip, int $port, array $options = []): bool { return true; }
    public function leave(string $name, string $ip, int $port): bool { return true; }
    public function getCluster(string $name): ?Swoole\NameResolver\Cluster { return null; }

    public function lookup(string $name)
    {
        // 只解析 user_service，其它名字返回 null 交回 DNS
        return $name === 'user_service' ? '127.0.0.1' : null;
    }
}
swoole_name_resolver_add(new StaticResolver());

Co\run(function () {
    // 用服務名連接，端口仍由自己指定
    $cli = new Co\Http\Client('user_service', 9501);
    $cli->get('/');
    echo $cli->body;
    $cli->close();
});
```

## 示例二：Redis 服務發現（服務端註冊 + 客戶端按名字連接）

`server.php`：啓動時把自己註冊進 `Redis`，退出時摘除。

```php
<?php
$resolver = new Swoole\NameResolver\Redis('redis://127.0.0.1:6379');
swoole_name_resolver_add($resolver);

$server = new Swoole\Http\Server('0.0.0.0', 9501);
$server->on('request', function ($req, $resp) {
    $resp->end("hello from user_service\n");
});
$server->on('shutdown', function () use ($resolver) {
    $resolver->leave('user_service', '127.0.0.1', 9501);
});

// 註冊節點：服務名 user_service -> 127.0.0.1:9501
$resolver->join('user_service', '127.0.0.1', 9501);
$server->start();
```

`client.php`：只認識服務名，不需要知道真實 `IP` 和端口。

```php
<?php
swoole_name_resolver_add(new Swoole\NameResolver\Redis('redis://127.0.0.1:6379'));

Co\run(function () {
    // 端口傳 0：端口也交給解析器決定（否則默認 80/443）
    $cli = new Co\Http\Client('user_service', 0);
    $cli->get('/');
    echo $cli->body;   // hello from user_service
    $cli->close();
});
```

> [!TIP]
> `Co\Http\Client` 端口傳 `0` 時底層會開啓 `withPort`，解析器返回的節點端口（這裏是 `9501`）覆蓋默認端口；端口傳具體值時只解析 `IP`，端口仍用你傳的值。

> [!NOTE]
> 端口隨解析返回只對 `Co\Http\Client` 的 `port = 0` 生效。`Co\Socket`、`Co\Client` 等需要自行用 [swoole_name_resolver_lookup](/zh-hant/name_resolver/functions.html#swoole-name-resolver-lookup) 配合 `new Swoole\NameResolver\Context(AF_INET, true)` 取回 `IP:端口` 再連接。

## 示例三：Cluster 多節點負載均衡

返回 [Cluster](/zh-hant/name_resolver/cluster.html) 時，底層每次解析隨機取一個節點，實現負載均衡。

```php
<?php
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
        $cluster->add('127.0.0.1', 9502);
        $cluster->add('127.0.0.1', 9503);
        return $cluster;
    }
}
swoole_name_resolver_add(new ClusterResolver());

Co\run(function () {
    // 三次請求會隨機落到不同節點
    for ($i = 0; $i < 3; $i++) {
        $cli = new Co\Http\Client('user_service', 0);
        $cli->get('/');
        echo $cli->body;
        $cli->close();
    }
});
```

> [!NOTE]
> 底層緩存返回的 `Cluster` 並每次 `pop()` 一個節點（隨機、不放回），節點取空後再次調用 `lookup` 重建；配合 `Co\Http\Client` 的 `max_retries` 可在請求失敗時重新解析、換節點重試。