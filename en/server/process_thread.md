# Processes/Threads and Working Modes

- The `Swoole` async server contains five process/thread roles — [`master`](#master), [`manager`](#manager), [`worker`](#worker), [`task`](#task), [`user`](#user) — plus the `reactor` threads inside the `master` process that handle network `I/O`.
- It supports three working modes: [`SWOOLE_PROCESS`](#swoole-process), [`SWOOLE_BASE`](#swoole-base), and [`SWOOLE_THREAD`](#swoole-thread), corresponding to multi-thread + multi-process, multi-process, and multi-thread respectively. `Processes/threads` and `working modes` are tightly coupled; understanding them early is essential for the chapters that follow.

## Processes/Threads

### Factory Analogy

Compare the **async server** to a **factory**:

- **master (factory director)**: keeps the whole factory running stably, sets rules and handles major issues; the sales front desk reports directly to the director.
- **reactor (sales front desk)**: greets customers and registers orders but does not produce; records requirements, passes the order to the workers, then serves the next customer.
- **manager (deputy director)**: manages workers and administration; takes on some decisions when the director is away so the factory keeps running.
- **worker (production-line worker)**: core production, actually making the products; in a small factory may also take orders personally (doubling as sales).
- **task (administration/logistics)**: handles non-core chores such as organizing documents and replying to emails, so workers can focus without frequent interruptions.
- **user (equipment monitoring)**: not part of core business; only records and reports equipment operation.

Role relationships in `SWOOLE_PROCESS` mode:

```text
client ──TCP──> master process
                  ├── reactor threads ×N   network I/O, protocol parsing (no PHP)
                  │        │ unixSocket
                  │        ▼
                  └── manager process      create / monitor / reap
                           ├── worker processes ×N   business logic (PHP)
                           ├── task processes ×N     async tasks (PHP)
                           └── user processes ×N     addProcess custom
```

### master

The `master` process is the management and communication hub of multiple threads; it creates and manages multiple `reactor` threads and manages the lifecycle of the entire service.

- **reactor threads**: maintain client connections, handle network `I/O`, protocol parsing, and data sending/receiving; assemble data into complete packets via `unixSocket` and forward them to `worker`, then return the `worker`'s results to clients. Reactors handle only the network layer and **execute no PHP code**.
- **Signals**: `SIGTERM` stops the service; `SIGUSR1` restarts all `worker` and `task`; `SIGUSR2` restarts only `task`.

> [!IMPORTANT]
> The `master` process exists only in `SWOOLE_PROCESS` mode; other modes have no such process.

### manager

The `manager` process manages the lifecycle of `worker` and `task` processes (creation, monitoring, reaping).

- **Signals**: `SIGUSR1` restarts all `worker` and `task`; `SIGUSR2` restarts only `task`.
- **BASE mode**: `manager` takes over the lifecycle of the entire service; sending `SIGTERM` to `manager` stops the service.

> [!IMPORTANT]
> In `SWOOLE_THREAD` mode the `manager` process becomes a `manager` thread; everything else stays the same.

### worker

The `worker` process executes all business logic code.

- **SWOOLE_PROCESS**: separated from `reactor` threads; receives complete packets forwarded by reactors, processes them, and returns results to the reactor to send to clients.
- **Other modes (such as SWOOLE_BASE)**: combines network `I/O` and business logic in one, directly sending/receiving client data and processing it.

> [!IMPORTANT]
> In `SWOOLE_THREAD` mode the `worker` process becomes a `worker` thread; everything else stays the same.

### task

The `task` process is built for async tasks, integrating task dispatching, queue management, and PHP task processing; async tasks can be implemented through the underlying API.

- **Use cases**: traditional PHP-FPM relies on external queues such as Redis plus background scripts to process time-consuming tasks asynchronously; `task` has built-in async task capability and schedules efficiently without external components.
- **Result feedback**: after a task completes, its result can be returned to the `worker`, forming a complete data loop.

> [!IMPORTANT]
> In `SWOOLE_THREAD` mode the `task` process becomes a `task` thread; everything else stays the same.

### user

The `user` process is fully user-defined, created via [Swoole\Server->addProcess()](/en/server/methods.html#addprocess), and is commonly used for monitoring, status reporting, and other custom tasks.

- **Lifecycle**: same as `master`/`manager`, supervised uniformly by `manager`; events such as [workerStop](/en/server/events.html#workerstop) are not triggered.
- **Restart immunity**: sending `SIGUSR1`/`SIGUSR2` to `master`/`manager` does not affect user processes; on server shutdown they receive `SIGTERM` to close safely.
- **Failure recovery**: if a user process exits at runtime, `manager` automatically detects it and creates a new process.

## Working Modes

Comparison of the three modes:

| Dimension | `SWOOLE_PROCESS` | `SWOOLE_BASE` | `SWOOLE_THREAD` |
|:---|:---|:---|:---|
| Process structure | master + manager + worker/task/user, multi-process | manager (optional) + worker, multi-process | single process, multi-thread |
| Network `I/O` handler | reactor threads in master | worker processes | worker threads |
| Inter-process communication | required (`unixSocket`, two IPC rounds) | not required | not required (threads share memory) |
| Connection vs worker | connections managed by master, decoupled from worker | statically bound to worker | — |
| Worker crash impact | established connections survive | all connections of that worker drop | the whole process exits |
| Performance | IPC overhead | best (no IPC) | about `10%` lower than NTS multi-process |
| Typical scenario | complex business, stable long connections | performance-first, stateless services | task parallelism + shared memory |
| Compile dependency | default | default | PHP ZTS + `--enable-swoole-thread` |

### SWOOLE_PROCESS

All client connections are managed uniformly by the `master` process, involving extensive inter-process communication (IPC) and process management; the implementation is relatively complex. It suits extremely complex business logic: comprehensive process management and memory protection ensure long-term stable operation. `reactor` threads also provide `Buffer` buffering to handle many slow connections and malicious clients that send data byte by byte.

```text
client ──TCP──> master process
                  ├── reactor threads ×N   network I/O, protocol parsing (no PHP)
                  │        │ unixSocket
                  │        ▼
                  └── manager process      create / monitor / reap
                           ├── worker processes ×N   business logic (PHP)
                           ├── task processes ×N     async tasks (PHP)
                           └── user processes ×N     addProcess custom
```

**Advantages**

- Connection handling is separated from request processing, avoiding uneven `worker` load caused by some connections carrying too much data.
- Established connections are not dropped when `worker` processes restart normally or exit on fatal errors.
- Supports concurrency over a single connection: maintain a few `TCP` connections and requests are processed concurrently across multiple `worker` processes.

**Disadvantages**

- Two rounds of IPC overhead: the `reactor` threads in master and the `worker` processes exchange data via `unixSocket`.
- Setting [dispatch_func](/en/server/setting.html#dispatch-func) to customize dispatch forces [reactor_num](/en/server/setting.html#reactor-num) to `1`, so multiple reactor threads cannot process network events in parallel.

### SWOOLE_BASE

Generally regarded as the best-performing choice, using a flattened architecture that greatly reduces inter-process interaction overhead.

```text
client ──TCP──> worker processes ×N        network I/O + business logic (PHP)
                  ▲
                  │ create / monitor / reap
               manager process (optional)
```

**Advantages**

- No `master` process; only `manager` remains (in minimal scenarios there is not even a `manager`).
- Each `worker` wears multiple hats: client connection maintenance, data sending/receiving, and business logic processing.
- `manager` is optional: with [`worker_num=1`](/en/server/setting.html#worker-num) and neither `task` nor [max_request](/en/server/setting.html#max-request) enabled, the underlying layer creates a single standalone `worker` and no `manager` at all.
- With master removed, data no longer needs IPC forwarding, eliminating the communication bottleneck for the best performance.
- The code logic is intuitive and simple, with fewer complex process management and scheduling steps, reducing the probability of errors.

**Disadvantages**

- Connections are bound directly to `worker`: if a `worker` crashes, all connections it maintains are forcibly closed.
- Connections are statically bound to `worker`: a few long-lived connections cannot use all `worker` processes. For example, with `100` `worker` processes but only `80` connections, `20` processes are necessarily idle.
- In long-connection applications, connections carrying large data heavily load their `worker` while those handling lightweight connections sit idle, so load cannot be balanced.
- If a callback contains blocking operations, the server degrades to synchronous mode, stalling the event loop and easily filling the `TCP backlog` queue, leading to denial of service.

### SWOOLE_THREAD

A brand-new working mode introduced in `Swoole 6.0`, based on `PHP`'s `ZTS (Zend Thread Safety)` capability to support a multi-threaded service. The entire service has only one process; `worker` and the like all become threads handling client requests.

```text
┌─ single process ────────────────────┐
│  manager thread                     │
│  worker threads ×N   network I/O +  │
│                      business logic │
│  task threads ×N     async tasks    │
│  user threads ×N     custom         │
│  threads share memory, no IPC       │
└─────────────────────────────────────┘
```

**Advantages**

- Threads need no IPC, reducing extra overhead.
- The single-process structure makes `gdb -p` debugging more straightforward.
- You get both coroutine-based high-concurrency `I/O` programming and multi-threaded task parallelism with a shared memory heap/stack.

**Disadvantages**

- A thread crash exits the entire process; clients must implement fault tolerance such as error retries and reconnection, combined with `Supervisor, Docker/K8s` for automatic process recovery.
- `ZTS` and `lock` operations introduce extra overhead; performance is about `10%` lower than the `NTS` multi-process mode. Stateless services are still recommended to use the `NTS` multi-process model.
- Passing objects or resource-type data between threads is not supported; you must use the concurrency-safe containers provided by `Swoole`.

> [!IMPORTANT]
> `PHP` must be in `ZTS (Zend Thread Safety)` mode, and `Swoole` must be compiled with the [`--enable-swoole-thread`](/en/start/install.html#general-feature-options) option.