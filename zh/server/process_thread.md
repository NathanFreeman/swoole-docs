# 进程/线程和工作模式

- `Swoole` 异步服务器包含 [`master`](#master)、[`manager`](#manager)、[`worker`](#worker)、[`task`](#task)、[`user`](#user) 五种进程/线程角色，以及 `master` 进程内负责网络 `I/O` 的 `reactor` 线程。
- 它支持三种运行模式：[`SWOOLE_PROCESS`](#swoole-process)、[`SWOOLE_BASE`](#swoole-base)、[`SWOOLE_THREAD`](#swoole-thread)，分别对应多线程+多进程、多进程、多线程。`进程/线程` 与 `运行模式` 紧密依赖，提前理解它们对学习后续章节十分重要。

## 进程/线程

### 工厂类比

把**异步服务器**比作一家**工厂**：

- **master（厂长）**：负责整体稳定运行，制定规则、处理重大问题；销售前台直接向厂长汇报。
- **reactor（销售前台）**：接待客户、接单登记，不参与实际生产；记录需求后把订单传给工人，自己继续接待下一位。
- **manager（副厂长）**：管理工人和行政事务；厂长不在时承担部分决策，确保运转不中断。
- **worker（产线工人）**：核心生产，真正做出产品；小厂里也可能自己接单、自己生产（兼职销售）。
- **task（行政/后勤）**：处理整理文件、回复邮件等非核心事务，让工人专心生产、不被频繁打断。
- **user（设备监控）**：不参与核心业务，只记录和上报设备运行情况。

`SWOOLE_PROCESS` 模式下的角色关系：

```text
客户端 ──TCP──> master 进程
                  ├── reactor 线程 ×N   网络 I/O、协议解析（不执行 PHP）
                  │        │ unixSocket
                  │        ▼
                  └── manager 进程      创建 / 监控 / 回收
                           ├── worker 进程 ×N   业务逻辑（PHP）
                           ├── task 进程 ×N     异步任务（PHP）
                           └── user 进程 ×N     addProcess 自定义
```

### master

`master` 进程是多线程的管理与通信中枢，创建并管理多个 `reactor` 线程，并管理整个服务的生命周期。

- **reactor 线程**：维护客户端连接，处理网络 `I/O`、协议解析与数据收发；通过 `unixSocket` 把数据拼成完整数据包转发给 `worker`，再把 `worker` 的结果返回客户端。reactor 只负责网络层，**不执行任何 PHP 代码**。
- **信号**：`SIGTERM` 停止服务；`SIGUSR1` 重启所有 `worker` 和 `task`；`SIGUSR2` 仅重启 `task`。

> [!IMPORTANT]
> `master` 进程仅在 `SWOOLE_PROCESS` 模式下存在，其他模式无此进程。

### manager

`manager` 进程管理 `worker` 和 `task` 进程的生命周期（创建、监控、回收）。

- **信号**：`SIGUSR1` 重启所有 `worker` 和 `task`；`SIGUSR2` 仅重启 `task`。
- **BASE 模式**：`manager` 接管整个服务的生命周期，向 `manager` 发送 `SIGTERM` 即可停止服务。

> [!IMPORTANT]
> `SWOOLE_THREAD` 模式下 `manager` 进程变为 `manager` 线程，其余不变。

### worker

`worker` 进程执行所有业务逻辑代码。

- **SWOOLE_PROCESS**：与 `reactor` 线程分离；接收 reactor 转发的完整数据包，处理后将结果交回 reactor 发送给客户端。
- **其他模式（如 SWOOLE_BASE）**：集网络 `I/O` 与业务逻辑于一身，直接收发客户端数据并处理。

> [!IMPORTANT]
> `SWOOLE_THREAD` 模式下 `worker` 进程变为 `worker` 线程，其余不变。

### task

`task` 进程专为异步任务设计，整合任务投递、队列管理与 PHP 任务处理，通过底层 API 即可实现异步任务。

- **应用场景**：传统 PHP-FPM 需借助 Redis 等外部队列 + 后台脚本异步处理耗时任务；`task` 内置异步任务能力，无需外部组件即可高效调度。
- **结果反馈**：任务执行完毕后可将结果返回给 `worker`，形成完整数据闭环。

> [!IMPORTANT]
> `SWOOLE_THREAD` 模式下 `task` 进程变为 `task` 线程，其余不变。

### user

`user` 进程完全由用户自定义，通过 [Swoole\Server->addProcess()](/zh/server/methods.html#addprocess) 创建，常用于监控、状态上报等定制任务。

- **生命周期**：与 `master`/`manager` 一致，由 `manager` 统一托管，不触发 [workerStop](/zh/server/events.html#workerstop) 等事件。
- **重启免疫**：向 `master`/`manager` 发送 `SIGUSR1`/`SIGUSR2` 不会波及 user 进程；服务器 shutdown 时向其发送 `SIGTERM` 安全关闭。
- **异常恢复**：user 进程运行时退出，`manager` 会自动检测并重建新进程。

## 工作模式

三种模式对比：

| 维度 | `SWOOLE_PROCESS` | `SWOOLE_BASE` | `SWOOLE_THREAD` |
|:---|:---|:---|:---|
| 进程结构 | master + manager + worker/task/user 多进程 | manager（可选）+ worker 多进程 | 单进程，多线程 |
| 网络 `I/O` 承担者 | master 内的 reactor 线程 | worker 进程 | worker 线程 |
| 进程间通信 | 需要（`unixSocket`，两次 IPC） | 不需要 | 不需要（线程共享内存） |
| 连接与 worker | 连接由 master 统一管理，与 worker 解耦 | 静态绑定到 worker | — |
| worker 崩溃影响 | 已建立连接不断 | 该 worker 的连接全部断开 | 整个进程退出 |
| 性能 | 有 IPC 开销 | 最佳（无 IPC） | 较 NTS 多进程约低 `10%` |
| 典型场景 | 业务复杂、长连接需稳定 | 追求性能、无状态服务 | 任务并行 + 共享内存 |
| 编译依赖 | 默认 | 默认 | PHP ZTS + `--enable-swoole-thread` |

### SWOOLE_PROCESS

所有客户端连接由 `master` 进程统一管理，内部涉及大量进程间通信（IPC）与进程管理，实现较复杂。适用于业务逻辑极其复杂的场景：完善的进程管理与内存保护机制确保长期稳定运行。`reactor` 线程还提供 `Buffer` 缓冲，应对大量慢速连接及逐字节发送数据的恶意客户端。

```text
客户端 ──TCP──> master 进程
                  ├── reactor 线程 ×N   网络 I/O、协议解析（不执行 PHP）
                  │        │ unixSocket
                  │        ▼
                  └── manager 进程      创建 / 监控 / 回收
                           ├── worker 进程 ×N   业务逻辑（PHP）
                           ├── task 进程 ×N     异步任务（PHP）
                           └── user 进程 ×N     addProcess 自定义
```

**优点**

- 连接与数据请求处理分离，避免部分连接数据量过大导致 `worker` 负载不均。
- `worker` 正常重启或致命错误退出时，已建立的连接不会被切断。
- 支持单连接并发：维持少量 `TCP` 连接，请求即可在多个 `worker` 中并发处理。

**缺点**

- 两次 IPC 开销：master 的 `reactor` 线程与 `worker` 之间需经 `unixSocket` 交换数据。
- 设置 [dispatch_func](/zh/server/setting.html#dispatch-func) 自定义分发策略后，会强制 [reactor_num](/zh/server/setting.html#reactor-num) 为 `1`，无法多 reactor 线程并行处理网络事件。

### SWOOLE_BASE

通常被视为性能最优的选择，采用扁平化架构，极大减少进程间交互开销。

```text
客户端 ──TCP──> worker 进程 ×N        网络 I/O + 业务逻辑（PHP）
                  ▲
                  │ 创建 / 监控 / 回收
               manager 进程（可选）
```

**优点**

- 无 `master` 进程，仅保留 `manager`（极简场景下甚至没有 `manager`）。
- 每个 `worker` 身兼数职：客户端连接维护、数据收发、业务逻辑处理一肩挑。
- `manager` 可选：设置 [`worker_num=1`](/zh/server/setting.html#worker-num) 且未开启 `task` 或 [max_request](/zh/server/setting.html#max-request) 时，底层直接创建单个 `worker`，完全不创建 `manager`。
- 去除 master 后数据无需 IPC 转发，消除通信瓶颈，性能最佳。
- 代码逻辑直观简单，减少复杂的进程管理与调度，降低出错概率。

**缺点**

- 连接直接绑定 `worker`：某个 `worker` 崩溃，其维持的所有连接被强制关闭。
- 连接与 `worker` 静态绑定：少量长连接无法用满所有 `worker`。例如 `100` 个 `worker` 只有 `80` 个连接，必有 `20` 个进程空闲。
- 长连接中数据量大的连接使其 `worker` 负载极高，轻量连接的 `worker` 却空闲，无法均衡。
- 回调中存在阻塞操作时服务器退化为同步模式，事件循环停滞，极易塞满 `TCP backlog` 队列导致拒绝服务。

### SWOOLE_THREAD

`Swoole 6.0` 引入的全新运行模式，基于 `PHP` 的 `ZTS（Zend Thread Safety）` 能力支持多线程服务。整个服务只有一个进程，`worker` 等全部变为线程处理客户端请求。

```text
┌─ 单一进程 ──────────────────────────┐
│  manager 线程                       │
│  worker 线程 ×N    网络 I/O + 业务  │
│  task 线程 ×N      异步任务         │
│  user 线程 ×N      自定义           │
│  线程间共享内存，无需 IPC           │
└─────────────────────────────────────┘
```

**优点**

- 线程间无需 IPC，减少额外开销。
- 单一进程结构使 `gdb -p` 调试更直观。
- 既享协程高并发 `I/O` 编程便利，又能用多线程实现任务并行与共享内存堆栈。

**缺点**

- 线程崩溃会导致整个进程退出，需客户端实现错误重试、断线重连等容错，并配合 `Supervisor、Docker/K8s` 自动恢复进程。
- `ZTS` 与 `锁` 带来额外开销，性能较 `NTS` 多进程模式降低约 `10%`；无状态服务仍建议 `NTS` 多进程模型。
- 不支持线程间传递对象或资源类型数据，必须使用 `Swoole` 的并发安全容器。

> [!IMPORTANT]
> `PHP` 必须是 `ZTS（Zend Thread Safety）` 模式，并且编译 `Swoole` 时需加入 [`--enable-swoole-thread`](/zh/start/install.html#通用功能选项)。