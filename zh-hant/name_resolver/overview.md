# 名字解析器

`Swoole\NameResolver` 用於自定義域名解析和服務發現。協程客戶端連接域名時，會先按註冊順序查詢名字解析器，由解析器決定實際連接的 `IP` 和端口；所有解析器都未給出結果時，回退到普通的 `DNS` 解析。

> [!NOTE]
> `name_resolver` 選項自 Swoole `v5.0.0` 起可用。

## 工作原理

- 解析的唯一入口是協程 [Socket::connect](/zh-hant/client/socket.html#connect)。所有基於協程 `Socket` 的客戶端（`TCP`、`HTTP`、`Redis` 等）連接域名時都會走名字解析器；開啓 [SWOOLE_HOOK_TCP](/zh-hant/coroutine/hook.html#swoole-hook-tcp) 後，原生 `stream` 也會轉爲協程 `Socket`，間接受解析器影響。
- 多個解析器按**註冊順序**依次查詢，先返回非空結果者勝出。
- 解析器列表是線程本地的；`PHP` 解析器在請求結束時自動清除。

> [!TIP]
> [System::gethostbyname](/zh-hant/coroutine/system_api.html#gethostbyname) 本身不走名字解析器，它就是解析器全部落空時的回退實現。

## 子頁面

- [使用示例](/zh-hant/name_resolver/examples.html)：自定義解析、`Redis` 服務發現、`Cluster` 負載均衡三個完整例子。
- [註冊與調用](/zh-hant/name_resolver/functions.html)：`swoole_name_resolver_add`、`swoole_name_resolver_remove`、`swoole_name_resolver_lookup` 和 `name_resolver` 選項。
- [Context](/zh-hant/name_resolver/context.html)：解析上下文，控制 `IP` 族和是否附帶端口。
- [自定義解析器](/zh-hant/name_resolver/resolver.html)：`Swoole\NameResolver` 抽象類的方法與 `lookup` 返回值契約。
- [Cluster](/zh-hant/name_resolver/cluster.html)：節點容器，用於返回一組可故障轉移的節點。
- [內置解析器](/zh-hant/name_resolver/builtin.html)：`Redis`、`Nacos`、`Consul` 解析器。