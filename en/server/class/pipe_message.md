# Swoole\Server\PipeMessage

`Swoole\Server\PipeMessage` is the pipe message object passed by the `Swoole` server in **object-oriented event mode**. Processes send messages to each other via [sendMessage](/en/server/methods.html#sendmessage), and the receiver gets this object in the [pipeMessage](/en/server/events.html#pipemessage) event. After setting [event_object](/en/server/setting.html#event-object) to `true`, the second parameter of this event is no longer the two separate parameters `$source_worker_id` and `$data`, but this single encapsulated object.

## Properties

### source_worker_id

The `ID` of the `worker` process that the data comes from. This property is an `int`.

```php
public int $source_worker_id
```

### dispatch_time

The arrival time of the pipe message. This property is a `double`.

```php
public float $dispatch_time
```

### data

The data carried by the pipe message. This property is a `string`.

```php
public string $data
```

> [!TIP]
> `source_worker_id` indicates which process the message came from. To reply to the peer, you can call [sendMessage](/en/server/methods.html#sendmessage) again in the `pipeMessage` callback to send data back to the source process or to a specified `worker` or `task` process.

## Examples

```php
<?php
use Swoole\Server;
use Swoole\Server\Event;
use Swoole\Server\PipeMessage;

$server = new Server('127.0.0.1', 9501, SWOOLE_PROCESS);
// Enable object-oriented event mode
$server->set([
    'event_object' => true,
]);

$server->on('pipeMessage', function (Server $server, PipeMessage $message) {
    printf("from worker %d: %s\n", $message->source_worker_id, $message->data);
});

$server->on('receive', function (Server $server, Event $event) {
    // Send the received data as a pipe message to worker process 1
    $server->sendMessage($event->data, 1);
    $server->send($event->fd, 'Hello Swoole');
});

$server->start();
```