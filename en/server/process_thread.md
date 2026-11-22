# Processes/Threads and Working Modes

- The `Swoole` async server contains `5` process/thread roles: [`master`](#master), [`manager`](#manager), [`worker`](#worker), [`task`](#task), and [`user`](#user).
- At the same time, it supports three working modes: [`SWOOLE_PROCESS`](#swoole-process), [`SWOOLE_BASE`](#swoole-base), and [`SWOOLE_THREAD`](#swoole-thread), corresponding to multi-thread + multi-process, multi-process, and multi-thread operation respectively. `Processes/threads` and `working modes` are tightly coupled. Understanding them in advance is essential for studying the chapters that follow.

## Processes/Threads

### Examples

- To make this easier to understand, we can compare the **async server** to a **factory**:
    - **master (factory director)**: responsible for the overall stable operation of the factory, setting rules and handling major issues. The sales front desk reports directly to the director.

    - **reactor (sales front desk)**: responsible for greeting customers and registering orders, but does not take part in actual production. When a customer arrives, sales first records the requirements, then passes the order back to the workers and continues serving the next customer.

    - **manager (deputy factory director)**: manages the workers and administrative affairs. When the director is away, the deputy can take on some decision-making duties to keep the factory running without interruption.

    - **worker (production-line worker)**: responsible for core production, actually making the products the customers want. After finishing, the worker can hand the finished goods to sales for shipping, but sometimes the worker also doubles as sales (for example, in a small factory the worker takes orders and produces them personally).

    - **task (administration/logistics)**: responsible for handling various non-core affairs, such as organizing documents, replying to emails, and coordinating resources. While workers are busy producing, these chores can be handed to administration so workers can focus on making products without frequent interruptions.

    - **user (equipment monitoring)**: does not take part in core business; it only records and reports on equipment operation.

### master

- **Core role**: as the management and communication hub of multiple threads, the `master` process creates and manages multiple `reactor` threads.

- **Responsibilities of reactor threads**:
    - Each `reactor` thread focuses on maintaining client connections, handling network I/O, protocol parsing, and data sending/receiving.

    - **Data flow**: received data is assembled into complete packets via `unixSocket` sockets and forwarded to `worker` processes, while the processing results from `worker` processes are returned to clients.

    - **Note**: `reactor` threads handle only the network layer and **do not execute any PHP code**.

- **Lifecycle management**:
    - The `master` process manages the lifecycle of the entire service.

    - **SIGTERM**: sending this signal to the `master` process stops the service.

    - **SIGUSR1**: restarts all `worker` and `task` processes.

    - **SIGUSR2**: restarts only the `task` processes.

> [!IMPORTANT]
> **Note**: the `master` process exists only in `SWOOLE_PROCESS` mode; other working modes have no such process.

### manager

- **Core responsibility**: manages the lifecycle of `worker` and `task` processes, including process creation, monitoring, and reaping.

- **Signal handling**:
    - **SIGUSR1**: sending this signal to the `manager` process restarts all `worker` and `task` processes.

    - **SIGUSR2**: sending this signal to the `manager` process restarts only the `task` processes.

- **BASE mode characteristics**:
    - In `SWOOLE_BASE` mode, the `manager` process takes over lifecycle management of the entire service.

    - **SIGTERM**: in this mode, sending this signal to the `manager` process stops the service.

> [!IMPORTANT]
> In `SWOOLE_THREAD` working mode, the `manager` process becomes a `manager` thread; everything else stays the same.

### worker

- **Core responsibility**: the `worker` process focuses on executing all business logic code.

- **SWOOLE_PROCESS mode**:
    - **Division of labor**: `worker` processes are separated from `reactor` threads.

    - **Workflow**: the `worker` receives complete packets forwarded by `reactor` threads, executes the business logic, and returns the results to the `reactor` threads, which send them to the clients.

- **Other modes (such as SWOOLE_BASE)**:
    - **Full responsibility**: the `worker` process combines network I/O and business logic in one.

    - **Workflow**: it directly receives client data, executes the business logic, and returns the processing results to the clients.

> [!IMPORTANT]
> In `SWOOLE_THREAD` working mode, the `worker` process becomes a `worker` thread; everything else stays the same.

### task

- **Core role**: the `task` process is built specifically for handling async tasks. It integrates task dispatching, queue management, and PHP task-processing processes into one, so async task processing can be easily implemented through the underlying API.

- **Use cases**:
    - In traditional PHP-FPM applications, we often rely on external queues such as Redis plus background scripts to process time-consuming tasks asynchronously, avoiding blocking the main process and maintaining high concurrency.

    - Swoole's `task` process exists precisely to solve this pain point: it has built-in async task processing, enabling efficient background task scheduling without depending on external components.

- **Result feedback**:
    - The `task` process not only executes tasks but also supports returning the results to the `worker` process after execution completes, forming a complete data loop.

> [!IMPORTANT]
> In `SWOOLE_THREAD` working mode, the `task` process becomes a `task` thread; everything else stays the same.

### user

- **Core role**: unlike the other built-in processes, the `user` process is fully user-defined. It is typically used to create special worker processes for monitoring, status reporting, or other customized tasks.

- The `user` process is created via [Swoole\Server->addProcess()](/en/server/methods.html#addprocess).

- **Lifecycle and stability**:
    - The `user` process shares the same lifecycle as the `master` and `manager` processes and is highly stable.

    - **Restart immunity**: when `SIGUSR1` or `SIGUSR2` is sent to the `master` or `manager` process, the system sends no signal to user processes, ensuring they keep running.

    - **Shutdown handling**: when the server shuts down, the system sends `SIGTERM` to user processes to ensure they are closed safely.

- **Process supervision and daemonizing**:
    - `user` processes are supervised uniformly by the `manager` process. Events such as [workerStop](/en/server/events.html#workerstop) are not triggered.

    - **Failure recovery**: if a user process exits at runtime, the `manager` process automatically detects it and creates a new process, ensuring high availability of the task.

## Working Modes

### SWOOLE_PROCESS

- In `SWOOLE_PROCESS` mode, all client connections are managed uniformly by the `master` process. The internal implementation is relatively complex, involving extensive inter-process communication (IPC) and process management mechanisms. This mode suits scenarios with extremely complex business logic: `Swoole` provides comprehensive process management and memory protection mechanisms, ensuring long-term stable operation even under complex business logic.

- In addition, `Swoole` provides `Buffer` buffering in `reactor` threads, which effectively handles large numbers of slow connections and malicious clients that send data byte by byte.

**Advantages:**

- Connection handling is separated from data request processing, avoiding uneven `worker` process load caused by some connections carrying too much data.

- Established connections are not dropped when `worker` processes restart normally or exit due to fatal errors.

- Supports concurrency over a single connection: only a few `TCP` connections need to be maintained, and requests can be processed concurrently across multiple `worker` processes.

**Disadvantages:**

- There are two rounds of inter-process communication overhead: the `reactor` threads in the `master` process and the `worker` processes must exchange data via `unixSocket`.

- `SWOOLE_PROCESS` mode does not support PHP ZTS (Zend Thread Safety). To run in a `ZTS` environment, you must use `SWOOLE_BASE`/`SWOOLE_THREAD` mode, or set the [single_thread](/en/server/setting.html#single-thread) parameter to `true`.

### SWOOLE_BASE

- Among Swoole's working modes, `SWOOLE_BASE` is generally regarded as the best-performing choice. It uses a flattened architecture design that greatly reduces inter-process interaction overhead.

**Advantages:**

- In `SWOOLE_BASE` mode there is no `master` process role; only the `manager` process remains (in some minimal scenarios there is not even a `manager` process).

- Each `worker` process wears multiple hats, handling **client connection maintenance**, **data sending/receiving**, and **business logic processing** all at once.

- The `manager` process is optional in `SWOOLE_BASE` mode. If [`worker_num=1`](/en/server/setting.html#worker-num) is set and neither `task` processes nor the [max_request](/en/server/setting.html#max-request) feature is enabled, the underlying layer directly creates a single standalone `worker` process and no `manager` process at all.

- With the `master` process removed, data no longer needs to be forwarded through inter-process communication (IPC). This direct processing mechanism eliminates the communication bottleneck, giving `SWOOLE_BASE` mode the best performance.

- The code logic is more intuitive and simple, with fewer complex process management and scheduling steps, reducing the probability of errors.

**Disadvantages:**

- Client connections are bound directly to `worker` processes. If a `worker` process crashes, all client connections it maintains are forcibly closed.

- Client connections are statically bound to `worker` processes. With a small number of long-lived client connections, the resources of all `worker` processes cannot be utilized. For example, with `100` `worker` processes but only `80` connections, `20` processes are necessarily idle.

- In long-connection applications, if some connections carry large amounts of data, their `worker` processes are heavily loaded while those handling lightweight connections sit idle, making load balancing across `worker` processes impossible.

- If a callback contains blocking operations, the server degrades to synchronous mode. This stalls the event loop and can easily fill the `TCP backlog` queue, leading to denial of service.

### SWOOLE_THREAD

- `SWOOLE_THREAD` is a brand-new working mode introduced in `Swoole 6.0`. Based on `PHP`'s `ZTS (Zend Thread Safety)` capability, it supports running a multi-threaded service.

- In this mode, the entire service has only one process; `worker` processes and the like all become threads that handle client requests.

**Advantages:**

- Threads do not need inter-process communication (IPC), reducing extra overhead.

- The single-process structure makes `gdb -p` debugging more straightforward.

- You get both the convenience of coroutine-based high-concurrency I/O programming and multi-threaded task parallelism with a shared memory heap/stack.

**Disadvantages:**

- If a thread crashes, the entire process exits. Clients must implement fault-tolerance mechanisms such as error retries and reconnection, combined with `Supervisor, Docker/K8s` for automatic process recovery.

- `ZTS` and `lock` operations introduce extra overhead; performance is about `10%` lower than the `NTS` multi-process mode. Stateless services are still recommended to use the `NTS` multi-process model.

- Passing objects or resource-type data between threads is not supported. You must use the concurrency-safe containers provided by `Swoole`.

> [!IMPORTANT]
> `PHP` must be in `ZTS (Zend Thread Safety)` mode, and `Swoole` must be compiled with the [`--enable-swoole-thread`](/en/start/install.html#general-feature-options) option.