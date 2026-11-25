# Swoole\SendFile

`Swoole\SendFile` 是 `v6.3.0` 版本引入的辅助类，是专门描述「待发送文件」的对象。它将文件路径、偏移量、发送长度以及「发送后自动删除」选项封装为一个对象，可直接传递给 [Swoole\Http\Response::sendfile()](/zh/server/class/response.html#sendfile) 和 [Swoole\Server::sendfile()](/zh/server/methods.html#sendfile)。

针对「先生成临时报表再发送」的业务场景，将 `deleteAfterSend` 设为 `true` 后，文件在发送任务结束时会自动删除，无需业务代码手动执行 `unlink`，大幅简化了文件生命周期管理。

## 属性

| 属性 | 类型 | 说明 | 默认值 |
|:---|:---|:---|:---|
| `$filename` | `string` | 文件路径，通过构造函数传入，只读 | 必填 |
| `$offset` | `int` | 文件偏移量，从文件的指定位置开始发送，必须大于或等于 `0` | `0` |
| `$length` | `int` | 发送数据的长度，必须大于或等于 `0`，`0` 表示发送从 `$offset` 起的全部剩余内容 | `0` |
| `$deleteAfterSend` | `bool` | 发送任务结束时是否自动删除文件 | `false` |

## 方法

### __construct

构造一个待发送文件对象。

```php
public function __construct(string $filename)
```

| 参数 | 说明 | 默认值 |
|:---|:---|:---|
| `$filename` | 文件路径，不能为空，不能包含 `null` 字节 | 必填 |

## 示例

```php
<?php
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;
use Swoole\SendFile;

$server = new Server('127.0.0.1', 9501, SWOOLE_BASE);
$server->on('request', function (Request $request, Response $response) {
    // 先生成临时报表
    $filename = tempnam(sys_get_temp_dir(), 'report_');
    file_put_contents($filename, 'report content');

    // 发送完成后自动删除临时文件
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
> - 向 `sendfile()` 传入 `SendFile` 对象时，不得再传入 `$offset`、`$length`、`$delete_file` 参数，否则抛出 `ValueError`，发送选项以对象属性为准。
> - `$filename` 为只读属性，构造函数只能调用一次。
> - `deleteAfterSend` 为 `true` 时，发送请求一旦被底层接受，文件清理的所有权即转移给底层，该对象不能再次用于 `sendfile()`，否则抛出 `Error`。
> - 文件在发送任务结束时自动删除，包括发送失败或连接提前关闭的情况；若参数校验失败（如文件不存在），文件会保留。
> - 该类为 `final`，不可序列化、不可克隆。