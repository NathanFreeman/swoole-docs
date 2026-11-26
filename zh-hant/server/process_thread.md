# 進程/線程和工作模式

- `Swoole` 異步服務器包含 [`master`](#master)、[`manager`](#manager)、[`worker`](#worker)、[`task`](#task)、[`user`](#user) 五種進程/線程角色，以及 `master` 進程內負責網絡 `I/O` 的 `reactor` 線程。
- 它支持三種運行模式：[`SWOOLE_PROCESS`](#swoole-process)、[`SWOOLE_BASE`](#swoole-base)、[`SWOOLE_THREAD`](#swoole-thread)，分別對應多線程+多進程、多進程、多線程。`進程/線程` 與 `運行模式` 緊密依賴，提前理解它們對學習後續章節十分重要。

## 進程/線程

### 工廠類比

把**異步服務器**比作一家**工廠**：

- **master（廠長）**：負責整體穩定運行，制定規則、處理重大問題；銷售前臺直接向廠長彙報。
- **reactor（銷售前臺）**：接待客戶、接單登記，不參與實際生產；記錄需求後把訂單傳給工人，自己繼續接待下一位。
- **manager（副廠長）**：管理工人和行政事務；廠長不在時承擔部分決策，確保運轉不中斷。
- **worker（產線工人）**：核心生產，真正做出產品；小廠裏也可能自己接單、自己生產（兼職銷售）。
- **task（行政/後勤）**：處理整理文件、回覆郵件等非核心事務，讓工人專心生產、不被頻繁打斷。
- **user（設備監控）**：不參與核心業務，只記錄和上報設備運行情況。

`SWOOLE_PROCESS` 模式下的角色關係：

```text
客戶端 ──TCP──> master 進程
                  ├── reactor 線程 ×N   網絡 I/O、協議解析（不執行 PHP）
                  │        │ unixSocket
                  │        ▼
                  └── manager 進程      創建 / 監控 / 回收
                           ├── worker 進程 ×N   業務邏輯（PHP）
                           ├── task 進程 ×N     異步任務（PHP）
                           └── user 進程 ×N     addProcess 自定義
```

### master

`master` 進程是多線程的管理與通信中樞，創建並管理多個 `reactor` 線程，並管理整個服務的生命週期。

- **reactor 線程**：維護客戶端連接，處理網絡 `I/O`、協議解析與數據收發；通過 `unixSocket` 把數據拼成完整數據包轉發給 `worker`，再把 `worker` 的結果返回客戶端。reactor 只負責網絡層，**不執行任何 PHP 代碼**。
- **信號**：`SIGTERM` 停止服務；`SIGUSR1` 重啓所有 `worker` 和 `task`；`SIGUSR2` 僅重啓 `task`。

> [!IMPORTANT]
> `master` 進程僅在 `SWOOLE_PROCESS` 模式下存在，其他模式無此進程。

### manager

`manager` 進程管理 `worker` 和 `task` 進程的生命週期（創建、監控、回收）。

- **信號**：`SIGUSR1` 重啓所有 `worker` 和 `task`；`SIGUSR2` 僅重啓 `task`。
- **BASE 模式**：`manager` 接管整個服務的生命週期，向 `manager` 發送 `SIGTERM` 即可停止服務。

> [!IMPORTANT]
> `SWOOLE_THREAD` 模式下 `manager` 進程變爲 `manager` 線程，其餘不變。

### worker

`worker` 進程執行所有業務邏輯代碼。

- **SWOOLE_PROCESS**：與 `reactor` 線程分離；接收 reactor 轉發的完整數據包，處理後將結果交回 reactor 發送給客戶端。
- **其他模式（如 SWOOLE_BASE）**：集網絡 `I/O` 與業務邏輯於一身，直接收發客戶端數據並處理。

> [!IMPORTANT]
> `SWOOLE_THREAD` 模式下 `worker` 進程變爲 `worker` 線程，其餘不變。

### task

`task` 進程專爲異步任務設計，整合任務投遞、隊列管理與 PHP 任務處理，通過底層 API 即可實現異步任務。

- **應用場景**：傳統 PHP-FPM 需藉助 Redis 等外部隊列 + 後臺腳本異步處理耗時任務；`task` 內置異步任務能力，無需外部組件即可高效調度。
- **結果反饋**：任務執行完畢後可將結果返回給 `worker`，形成完整數據閉環。

> [!IMPORTANT]
> `SWOOLE_THREAD` 模式下 `task` 進程變爲 `task` 線程，其餘不變。

### user

`user` 進程完全由用戶自定義，通過 [Swoole\Server->addProcess()](/zh-hant/server/methods.html#addprocess) 創建，常用於監控、狀態上報等定製任務。

- **生命週期**：與 `master`/`manager` 一致，由 `manager` 統一託管，不觸發 [workerStop](/zh-hant/server/events.html#workerstop) 等事件。
- **重啓免疫**：向 `master`/`manager` 發送 `SIGUSR1`/`SIGUSR2` 不會波及 user 進程；服務器 shutdown 時向其發送 `SIGTERM` 安全關閉。
- **異常恢復**：user 進程運行時退出，`manager` 會自動檢測並重建新進程。

## 工作模式

三種模式對比：

| 維度 | `SWOOLE_PROCESS` | `SWOOLE_BASE` | `SWOOLE_THREAD` |
|:---|:---|:---|:---|
| 進程結構 | master + manager + worker/task/user 多進程 | manager（可選）+ worker 多進程 | 單進程，多線程 |
| 網絡 `I/O` 承擔者 | master 內的 reactor 線程 | worker 進程 | worker 線程 |
| 進程間通信 | 需要（`unixSocket`，兩次 IPC） | 不需要 | 不需要（線程共享內存） |
| 連接與 worker | 連接由 master 統一管理，與 worker 解耦 | 靜態綁定到 worker | — |
| worker 崩潰影響 | 已建立連接不斷 | 該 worker 的連接全部斷開 | 整個進程退出 |
| 性能 | 有 IPC 開銷 | 最佳（無 IPC） | 較 NTS 多進程約低 `10%` |
| 典型場景 | 業務複雜、長連接需穩定 | 追求性能、無狀態服務 | 任務並行 + 共享內存 |
| 編譯依賴 | 默認 | 默認 | PHP ZTS + `--enable-swoole-thread` |

### SWOOLE_PROCESS

所有客戶端連接由 `master` 進程統一管理，內部涉及大量進程間通信（IPC）與進程管理，實現較複雜。適用於業務邏輯極其複雜的場景：完善的進程管理與內存保護機制確保長期穩定運行。`reactor` 線程還提供 `Buffer` 緩衝，應對大量慢速連接及逐字節發送數據的惡意客戶端。

```text
客戶端 ──TCP──> master 進程
                  ├── reactor 線程 ×N   網絡 I/O、協議解析（不執行 PHP）
                  │        │ unixSocket
                  │        ▼
                  └── manager 進程      創建 / 監控 / 回收
                           ├── worker 進程 ×N   業務邏輯（PHP）
                           ├── task 進程 ×N     異步任務（PHP）
                           └── user 進程 ×N     addProcess 自定義
```

**優點**

- 連接與數據請求處理分離，避免部分連接數據量過大導致 `worker` 負載不均。
- `worker` 正常重啓或致命錯誤退出時，已建立的連接不會被切斷。
- 支持單連接併發：維持少量 `TCP` 連接，請求即可在多個 `worker` 中併發處理。

**缺點**

- 兩次 IPC 開銷：master 的 `reactor` 線程與 `worker` 之間需經 `unixSocket` 交換數據。
- 設置 [dispatch_func](/zh-hant/server/setting.html#dispatch-func) 自定義分發策略後，會強制 [reactor_num](/zh-hant/server/setting.html#reactor-num) 爲 `1`，無法多 reactor 線程並行處理網絡事件。

### SWOOLE_BASE

通常被視爲性能最優的選擇，採用扁平化架構，極大減少進程間交互開銷。

```text
客戶端 ──TCP──> worker 進程 ×N        網絡 I/O + 業務邏輯（PHP）
                  ▲
                  │ 創建 / 監控 / 回收
               manager 進程（可選）
```

**優點**

- 無 `master` 進程，僅保留 `manager`（極簡場景下甚至沒有 `manager`）。
- 每個 `worker` 身兼數職：客戶端連接維護、數據收發、業務邏輯處理一肩挑。
- `manager` 可選：設置 [`worker_num=1`](/zh-hant/server/setting.html#worker-num) 且未開啓 `task` 或 [max_request](/zh-hant/server/setting.html#max-request) 時，底層直接創建單個 `worker`，完全不創建 `manager`。
- 去除 master 後數據無需 IPC 轉發，消除通信瓶頸，性能最佳。
- 代碼邏輯直觀簡單，減少複雜的進程管理與調度，降低出錯概率。

**缺點**

- 連接直接綁定 `worker`：某個 `worker` 崩潰，其維持的所有連接被強制關閉。
- 連接與 `worker` 靜態綁定：少量長連接無法用滿所有 `worker`。例如 `100` 個 `worker` 只有 `80` 個連接，必有 `20` 個進程空閒。
- 長連接中數據量大的連接使其 `worker` 負載極高，輕量連接的 `worker` 卻空閒，無法均衡。
- 回調中存在阻塞操作時服務器退化爲同步模式，事件循環停滯，極易塞滿 `TCP backlog` 隊列導致拒絕服務。

### SWOOLE_THREAD

`Swoole 6.0` 引入的全新運行模式，基於 `PHP` 的 `ZTS（Zend Thread Safety）` 能力支持多線程服務。整個服務只有一個進程，`worker` 等全部變爲線程處理客戶端請求。

```text
┌─ 單一進程 ──────────────────────────┐
│  manager 線程                       │
│  worker 線程 ×N    網絡 I/O + 業務  │
│  task 線程 ×N      異步任務         │
│  user 線程 ×N      自定義           │
│  線程間共享內存，無需 IPC           │
└─────────────────────────────────────┘
```

**優點**

- 線程間無需 IPC，減少額外開銷。
- 單一進程結構使 `gdb -p` 調試更直觀。
- 既享協程高併發 `I/O` 編程便利，又能用多線程實現任務並行與共享內存堆棧。

**缺點**

- 線程崩潰會導致整個進程退出，需客戶端實現錯誤重試、斷線重連等容錯，並配合 `Supervisor、Docker/K8s` 自動恢復進程。
- `ZTS` 與 `鎖` 帶來額外開銷，性能較 `NTS` 多進程模式降低約 `10%`；無狀態服務仍建議 `NTS` 多進程模型。
- 不支持線程間傳遞對象或資源類型數據，必須使用 `Swoole` 的併發安全容器。

> [!IMPORTANT]
> `PHP` 必須是 `ZTS（Zend Thread Safety）` 模式，並且編譯 `Swoole` 時需加入 [`--enable-swoole-thread`](/zh-hant/start/install.html#通用功能選項)。