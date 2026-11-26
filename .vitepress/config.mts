import {defineConfig} from 'vitepress'

export default defineConfig({
    locales: {
        root: {
            link: '/zh/',
            title: "Swoole 文档",
            description: "Swoole 文档",
            label: '简体中文',
            lang: 'zh-cn',
            themeConfig: {
                logoLink: '/zh/start/swoole',
                sidebar: [
                    {
                        text: '快速开始',
                        collapsed: true,
                        items: [
                            {text: '什么是Swoole', link: '/zh/start/swoole.md'},
                            {text: '安装', link: '/zh/start/install.md'},
                        ]
                    },
                    {
                        text: '协程',
                        collapsed: true,
                        items: [
                            {text: '什么是协程', link: '/zh/coroutine/coroutine.md'},
                            {text: '协程容器', link: '/zh/coroutine/container.md'},
                            {text: '协程调度器', link: '/zh/coroutine/scheduler.md'},
                            {text: '一键协程化', link: '/zh/coroutine/hook.md'},
                            {text: '协程方法', link: '/zh/coroutine/coroutine_api.md'},
                            {text: '系统方法', link: '/zh/coroutine/system_api.md'},
                            {text: '通道', link: '/zh/coroutine/channel.md'},
                            {text: '等待组', link: '/zh/coroutine/waitGroup.md'},
                            {text: '协程栅栏', link: '/zh/coroutine/barrier.md'},
                            {text: 'MongoDB', link: '/zh/coroutine/mongodb.md'},
                            {text: '其他', link: '/zh/coroutine/others.md'},
                        ]
                    },
                    {
                        text: '异步服务器',
                        collapsed: true,
                        items: [
                            {text: 'TCP/UDP服务器', link: '/zh/server/tcp_udp.md'},
                            {text: 'HTTP/HTTPS/HTTP2服务器', link: '/zh/server/http.md'},
                            {text: 'WebSocket服务器', link: '/zh/server/websocket.md'},
                            {text: 'Redis服务器', link: '/zh/server/redis.md'},
                            {text: 'MQTT （物联网）服务器', link: '/zh/server/mqtt.md'},
                            {text: '进程/线程和工作模式', link: '/zh/server/process_thread.md'},
                            {text: '事件回调', link: '/zh/server/events.md'},
                            {text: '多端口监听', link: '/zh/server/port.md'},
                            {text: '属性', link: '/zh/server/properties.md'},
                            {text: '方法', link: '/zh/server/methods.md'},
                            {text: '配置', link: '/zh/server/setting.md'}
                        ]
                    },
                    {
                        text: '协程服务器',
                        collapsed: true,
                        items: [
                            {text: 'TCP/UDP服务器', link: '/zh/server/coroutine/tcp_udp.md'},
                            {
                                text: 'HTTP/WebSocket服务器',
                                collapsed: true,
                                items: [
                                    {text: 'HTTP服务器', link: '/zh/server/coroutine/http.md'},
                                    {text: 'WebSocket服务器', link: '/zh/server/coroutine/websocket.md'},
                                ]
                            }
                        ]
                    },
                    {
                        text: '辅助类',
                        collapsed: true,
                        items: [
                            {text: 'Request类', link: '/zh/server/class/request.md'},
                            {text: 'Response类', link: '/zh/server/class/response.md'},
                            {text: 'SendFile类', link: '/zh/server/class/send_file.md'},
                            {text: 'Cookie类', link: '/zh/server/class/cookie.md'},
                            {text: 'Frame类', link: '/zh/server/class/frame.md'},
                            {text: 'CloseFrame类', link: '/zh/server/class/close_frame.md'},
                            {text: 'Port类', link: '/zh/server/class/port.md'},
                            {text: 'Connection类', link: '/zh/server/class/connection.md'},
                            {text: 'ExitException类', link: '/zh/server/class/exit_exception.md'},
                            {text: 'CanceledException类', link: '/zh/server/class/canceled_exception.md'},
                            {text: 'Event类', link: '/zh/server/class/event.md'},
                            {text: 'Packet类', link: '/zh/server/class/packet.md'},
                            {text: 'PipeMessage类', link: '/zh/server/class/pipe_message.md'},
                            {text: 'TaskResult类', link: '/zh/server/class/task_result.md'},
                            {text: 'Task类', link: '/zh/server/class/task.md'},
                            {text: 'StatusInfo类', link: '/zh/server/class/status_info.md'},
                        ]
                    },
                    {
                        text: '客户端',
                        collapsed: true,
                        items: [
                            {text: '同步阻塞客户端', link: '/zh/client/sync.md'},
                            {text: '异步回调客户端', link: '/zh/client/async.md'},
                            {
                                text: '协程客户端',
                                collapsed: true,
                                items: [
                                    {text: 'TCP/UDP客户端', link: '/zh/client/tcp_udp.md'},
                                    {text: 'Socket客户端', link: '/zh/client/socket.md'},
                                    {text: 'HTTP/WebSocket客户端', link: '/zh/client/http_websocket.md'},
                                    {
                                        text: 'HTTP2',
                                        collapsed: true,
                                        items: [
                                            {text: 'HTTP2客户端', link: '/zh/client/http2.md'},
                                            {text: 'Request类', link: '/zh/client/request.md'},
                                            {text: 'Response类', link: '/zh/client/response.md'},
                                        ]
                                    }

                                ]
                            }
                        ]
                    },
                    {
                        text: '进程',
                        collapsed: true,
                        items: [
                            {text: '创建进程', link: '/zh/process/process.md'},
                            {text: '进程池', link: '/zh/process/pool.md'},
                            {text: '进程管理', link: '/zh/process/manager.md'},
                        ]
                    },
                    {
                        text: '线程',
                        collapsed: true,
                        items: [
                            {text: '创建线程', link: '/zh/thread/create.md'},
                            {text: '线程池', link: '/zh/thread/pool.md'},
                            {text: '并发容器', link: '/zh/thread/container.md'},
                            {text: '同步屏障', link: '/zh/thread/barrier.md'},
                        ]
                    },
                    {
                        text: '名字解析器',
                        collapsed: true,
                        items: [
                            {text: '概述', link: '/zh/name_resolver/overview.md'},
                            {text: '使用示例', link: '/zh/name_resolver/examples.md'},
                            {text: '注册与调用', link: '/zh/name_resolver/functions.md'},
                            {text: 'Context', link: '/zh/name_resolver/context.md'},
                            {text: '自定义解析器', link: '/zh/name_resolver/resolver.md'},
                            {text: 'Cluster', link: '/zh/name_resolver/cluster.md'},
                            {text: '内置解析器', link: '/zh/name_resolver/builtin.md'},
                        ]
                    },
                    {
                        text: '连接池',
                        collapsed: true,
                        items: [
                            {text: '通用连接池', link: '/zh/pool/common.md'},
                            {text: '数据库连接池', link: '/zh/pool/database.md'},
                            {text: 'Redis连接池', link: '/zh/pool/redis.md'},
                        ]
                    },
                    {text: '高性能共享内存', link: '/zh/table.md'},
                    {text: '无锁计数器', link: '/zh/atomic.md'},
                    {text: '异步文件处理', link: '/zh/file_async.md'},
                    {text: '定时器', link: '/zh/timer.md'},
                    {text: '事件轮询', link: '/zh/event.md'},
                    {text: '锁', link: '/zh/lock.md'},
                    {text: '函数', link: '/zh/functions.md'},
                    {text: '版本更新', link: '/zh/version_update.md'},
                    {text: '捐赠', link: '/zh/contribute/donation.md'}
                ],


                outline: {level: [2, 3], label: '页面导航'},
                docFooter: {prev: '上一页', next: '下一页'},
                lastUpdated: {text: '最后修改'},

            }
        },
        'zh-hant': {
            link: '/zh-hant/',
            title: "Swoole 文檔",
            description: "Swoole 文檔",
            label: '繁體中文',
            lang: 'zh-Hant',
            themeConfig: {
                logoLink: '/zh-hant/start/swoole',
                sidebar: [
                    {
                        text: '快速開始',
                        collapsed: true,
                        items: [
                            {text: '什麼是Swoole', link: '/zh-hant/start/swoole.md'},
                            {text: '安裝', link: '/zh-hant/start/install.md'},
                        ]
                    },
                    {
                        text: '協程',
                        collapsed: true,
                        items: [
                            {text: '什麼是協程', link: '/zh-hant/coroutine/coroutine.md'},
                            {text: '協程容器', link: '/zh-hant/coroutine/container.md'},
                            {text: '協程調度器', link: '/zh-hant/coroutine/scheduler.md'},
                            {text: '一鍵協程化', link: '/zh-hant/coroutine/hook.md'},
                            {text: '協程方法', link: '/zh-hant/coroutine/coroutine_api.md'},
                            {text: '系統方法', link: '/zh-hant/coroutine/system_api.md'},
                            {text: '通道', link: '/zh-hant/coroutine/channel.md'},
                            {text: '等待組', link: '/zh-hant/coroutine/waitGroup.md'},
                            {text: '協程柵欄', link: '/zh-hant/coroutine/barrier.md'},
                            {text: 'MongoDB', link: '/zh-hant/coroutine/mongodb.md'},
                            {text: '其他', link: '/zh-hant/coroutine/others.md'},
                        ]
                    },
                    {
                        text: '異步服務器',
                        collapsed: true,
                        items: [
                            {text: 'TCP/UDP服務器', link: '/zh-hant/server/tcp_udp.md'},
                            {text: 'HTTP/HTTPS/HTTP2服務器', link: '/zh-hant/server/http.md'},
                            {text: 'WebSocket服務器', link: '/zh-hant/server/websocket.md'},
                            {text: 'Redis服務器', link: '/zh-hant/server/redis.md'},
                            {text: 'MQTT （物聯網）服務器', link: '/zh-hant/server/mqtt.md'},
                            {text: '進程/線程和工作模式', link: '/zh-hant/server/process_thread.md'},
                            {text: '事件回調', link: '/zh-hant/server/events.md'},
                            {text: '多端口監聽', link: '/zh-hant/server/port.md'},
                            {text: '屬性', link: '/zh-hant/server/properties.md'},
                            {text: '方法', link: '/zh-hant/server/methods.md'},
                            {text: '配置', link: '/zh-hant/server/setting.md'}
                        ]
                    },
                    {
                        text: '協程服務器',
                        collapsed: true,
                        items: [
                            {text: 'TCP/UDP服務器', link: '/zh-hant/server/coroutine/tcp_udp.md'},
                            {
                                text: 'HTTP/WebSocket服務器',
                                collapsed: true,
                                items: [
                                    {text: 'HTTP服務器', link: '/zh-hant/server/coroutine/http.md'},
                                    {text: 'WebSocket服務器', link: '/zh-hant/server/coroutine/websocket.md'},
                                ]
                            }
                        ]
                    },
                    {
                        text: '輔助類',
                        collapsed: true,
                        items: [
                            {text: 'Request類', link: '/zh-hant/server/class/request.md'},
                            {text: 'Response類', link: '/zh-hant/server/class/response.md'},
                            {text: 'SendFile類', link: '/zh-hant/server/class/send_file.md'},
                            {text: 'Cookie類', link: '/zh-hant/server/class/cookie.md'},
                            {text: 'Frame類', link: '/zh-hant/server/class/frame.md'},
                            {text: 'CloseFrame類', link: '/zh-hant/server/class/close_frame.md'},
                            {text: 'Port類', link: '/zh-hant/server/class/port.md'},
                            {text: 'Connection類', link: '/zh-hant/server/class/connection.md'},
                            {text: 'ExitException類', link: '/zh-hant/server/class/exit_exception.md'},
                            {text: 'CanceledException類', link: '/zh-hant/server/class/canceled_exception.md'},
                            {text: 'Event類', link: '/zh-hant/server/class/event.md'},
                            {text: 'Packet類', link: '/zh-hant/server/class/packet.md'},
                            {text: 'PipeMessage類', link: '/zh-hant/server/class/pipe_message.md'},
                            {text: 'TaskResult類', link: '/zh-hant/server/class/task_result.md'},
                            {text: 'Task類', link: '/zh-hant/server/class/task.md'},
                            {text: 'StatusInfo類', link: '/zh-hant/server/class/status_info.md'},
                        ]
                    },
                    {
                        text: '客戶端',
                        collapsed: true,
                        items: [
                            {text: '同步阻塞客戶端', link: '/zh-hant/client/sync.md'},
                            {text: '異步回調客戶端', link: '/zh-hant/client/async.md'},
                            {
                                text: '協程客戶端',
                                collapsed: true,
                                items: [
                                    {text: 'TCP/UDP客戶端', link: '/zh-hant/client/tcp_udp.md'},
                                    {text: 'Socket客戶端', link: '/zh-hant/client/socket.md'},
                                    {text: 'HTTP/WebSocket客戶端', link: '/zh-hant/client/http_websocket.md'},
                                    {
                                        text: 'HTTP2',
                                        collapsed: true,
                                        items: [
                                            {text: 'HTTP2客戶端', link: '/zh-hant/client/http2.md'},
                                            {text: 'Request類', link: '/zh-hant/client/request.md'},
                                            {text: 'Response類', link: '/zh-hant/client/response.md'},
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        text: '進程',
                        collapsed: true,
                        items: [
                            {text: '創建進程', link: '/zh-hant/process/process.md'},
                            {text: '進程池', link: '/zh-hant/process/pool.md'},
                            {text: '進程管理', link: '/zh-hant/process/manager.md'},
                        ]
                    },
                    {
                        text: '線程',
                        collapsed: true,
                        items: [
                            {text: '創建線程', link: '/zh-hant/thread/create.md'},
                            {text: '線程池', link: '/zh-hant/thread/pool.md'},
                            {text: '併發容器', link: '/zh-hant/thread/container.md'},
                            {text: '同步屏障', link: '/zh-hant/thread/barrier.md'},
                        ]
                    },
                    {
                        text: '名字解析器',
                        collapsed: true,
                        items: [
                            {text: '概述', link: '/zh-hant/name_resolver/overview.md'},
                            {text: '使用示例', link: '/zh-hant/name_resolver/examples.md'},
                            {text: '註冊與調用', link: '/zh-hant/name_resolver/functions.md'},
                            {text: 'Context', link: '/zh-hant/name_resolver/context.md'},
                            {text: '自定義解析器', link: '/zh-hant/name_resolver/resolver.md'},
                            {text: 'Cluster', link: '/zh-hant/name_resolver/cluster.md'},
                            {text: '內置解析器', link: '/zh-hant/name_resolver/builtin.md'},
                        ]
                    },
                    {
                        text: '連接池',
                        collapsed: true,
                        items: [
                            {text: '通用連接池', link: '/zh-hant/pool/common.md'},
                            {text: '數據庫連接池', link: '/zh-hant/pool/database.md'},
                            {text: 'Redis連接池', link: '/zh-hant/pool/redis.md'},
                        ]
                    },
                    {text: '高性能共享內存', link: '/zh-hant/table.md'},
                    {text: '無鎖計數器', link: '/zh-hant/atomic.md'},
                    {text: '異步文件處理', link: '/zh-hant/file_async.md'},
                    {text: '定時器', link: '/zh-hant/timer.md'},
                    {text: '事件輪詢', link: '/zh-hant/event.md'},
                    {text: '鎖', link: '/zh-hant/lock.md'},
                    {text: '函數', link: '/zh-hant/functions.md'},
                    {text: '版本更新', link: '/zh-hant/version_update.md'},
                    {text: '捐贈', link: '/zh-hant/contribute/donation.md'}
                ],

                outline: {level: [2, 3], label: '頁面導航'},
                docFooter: {prev: '上一頁', next: '下一頁'},
                lastUpdated: {text: '最後修改'},
            }
        },
        en: {
            title: "Swoole Docs",
            description: "Swoole documentation",
            label: 'English',
            lang: 'en',
            themeConfig: {
                logoLink: '/en/start/swoole',
                sidebar: [
                    {
                        text: 'Getting Started',
                        collapsed: true,
                        items: [
                            {text: 'What is Swoole', link: '/en/start/swoole.md'},
                            {text: 'Installation', link: '/en/start/install.md'},
                        ]
                    },
                    {
                        text: 'Coroutine',
                        collapsed: true,
                        items: [
                            {text: 'What is a Coroutine', link: '/en/coroutine/coroutine.md'},
                            {text: 'Coroutine Container', link: '/en/coroutine/container.md'},
                            {text: 'Coroutine Scheduler', link: '/en/coroutine/scheduler.md'},
                            {text: 'Coroutine Hooks', link: '/en/coroutine/hook.md'},
                            {text: 'Coroutine Methods', link: '/en/coroutine/coroutine_api.md'},
                            {text: 'System Methods', link: '/en/coroutine/system_api.md'},
                            {text: 'Channel', link: '/en/coroutine/channel.md'},
                            {text: 'WaitGroup', link: '/en/coroutine/waitGroup.md'},
                            {text: 'Coroutine Barrier', link: '/en/coroutine/barrier.md'},
                            {text: 'MongoDB', link: '/en/coroutine/mongodb.md'},
                            {text: 'Others', link: '/en/coroutine/others.md'},
                        ]
                    },
                    {
                        text: 'Async Servers',
                        collapsed: true,
                        items: [
                            {text: 'TCP/UDP Server', link: '/en/server/tcp_udp.md'},
                            {text: 'HTTP/HTTPS/HTTP2 Server', link: '/en/server/http.md'},
                            {text: 'WebSocket Server', link: '/en/server/websocket.md'},
                            {text: 'Redis Server', link: '/en/server/redis.md'},
                            {text: 'MQTT (IoT) Server', link: '/en/server/mqtt.md'},
                            {text: 'Processes/Threads and Working Modes', link: '/en/server/process_thread.md'},
                            {text: 'Event Callbacks', link: '/en/server/events.md'},
                            {text: 'Multi-Port Listening', link: '/en/server/port.md'},
                            {text: 'Properties', link: '/en/server/properties.md'},
                            {text: 'Methods', link: '/en/server/methods.md'},
                            {text: 'Configuration', link: '/en/server/setting.md'}
                        ]
                    },
                    {
                        text: 'Coroutine Servers',
                        collapsed: true,
                        items: [
                            {text: 'TCP/UDP Server', link: '/en/server/coroutine/tcp_udp.md'},
                            {
                                text: 'HTTP/WebSocket Server',
                                collapsed: true,
                                items: [
                                    {text: 'HTTP Server', link: '/en/server/coroutine/http.md'},
                                    {text: 'WebSocket Server', link: '/en/server/coroutine/websocket.md'},
                                ]
                            }
                        ]
                    },
                    {
                        text: 'Helper Classes',
                        collapsed: true,
                        items: [
                            {text: 'Request Class', link: '/en/server/class/request.md'},
                            {text: 'Response Class', link: '/en/server/class/response.md'},
                            {text: 'SendFile Class', link: '/en/server/class/send_file.md'},
                            {text: 'Cookie Class', link: '/en/server/class/cookie.md'},
                            {text: 'Frame Class', link: '/en/server/class/frame.md'},
                            {text: 'CloseFrame Class', link: '/en/server/class/close_frame.md'},
                            {text: 'Port Class', link: '/en/server/class/port.md'},
                            {text: 'Connection Class', link: '/en/server/class/connection.md'},
                            {text: 'ExitException Class', link: '/en/server/class/exit_exception.md'},
                            {text: 'CanceledException Class', link: '/en/server/class/canceled_exception.md'},
                            {text: 'Event Class', link: '/en/server/class/event.md'},
                            {text: 'Packet Class', link: '/en/server/class/packet.md'},
                            {text: 'PipeMessage Class', link: '/en/server/class/pipe_message.md'},
                            {text: 'TaskResult Class', link: '/en/server/class/task_result.md'},
                            {text: 'Task Class', link: '/en/server/class/task.md'},
                            {text: 'StatusInfo Class', link: '/en/server/class/status_info.md'},
                        ]
                    },
                    {
                        text: 'Clients',
                        collapsed: true,
                        items: [
                            {text: 'Synchronous Blocking Client', link: '/en/client/sync.md'},
                            {text: 'Async Callback Client', link: '/en/client/async.md'},
                            {
                                text: 'Coroutine Clients',
                                collapsed: true,
                                items: [
                                    {text: 'TCP/UDP Client', link: '/en/client/tcp_udp.md'},
                                    {text: 'Socket Client', link: '/en/client/socket.md'},
                                    {text: 'HTTP/WebSocket Client', link: '/en/client/http_websocket.md'},
                                    {
                                        text: 'HTTP2',
                                        collapsed: true,
                                        items: [
                                            {text: 'HTTP2 Client', link: '/en/client/http2.md'},
                                            {text: 'Request Class', link: '/en/client/request.md'},
                                            {text: 'Response Class', link: '/en/client/response.md'},
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        text: 'Process',
                        collapsed: true,
                        items: [
                            {text: 'Creating Processes', link: '/en/process/process.md'},
                            {text: 'Process Pool', link: '/en/process/pool.md'},
                            {text: 'Process Management', link: '/en/process/manager.md'},
                        ]
                    },
                    {
                        text: 'Thread',
                        collapsed: true,
                        items: [
                            {text: 'Creating Threads', link: '/en/thread/create.md'},
                            {text: 'Thread Pool', link: '/en/thread/pool.md'},
                            {text: 'Concurrent Containers', link: '/en/thread/container.md'},
                            {text: 'Synchronization Barrier', link: '/en/thread/barrier.md'},
                        ]
                    },
                    {
                        text: 'Name Resolver',
                        collapsed: true,
                        items: [
                            {text: 'Overview', link: '/en/name_resolver/overview.md'},
                            {text: 'Usage Examples', link: '/en/name_resolver/examples.md'},
                            {text: 'Registration and Lookup', link: '/en/name_resolver/functions.md'},
                            {text: 'Context', link: '/en/name_resolver/context.md'},
                            {text: 'Custom Resolver', link: '/en/name_resolver/resolver.md'},
                            {text: 'Cluster', link: '/en/name_resolver/cluster.md'},
                            {text: 'Built-in Resolvers', link: '/en/name_resolver/builtin.md'},
                        ]
                    },
                    {
                        text: 'Connection Pool',
                        collapsed: true,
                        items: [
                            {text: 'General-Purpose Pool', link: '/en/pool/common.md'},
                            {text: 'Database Pool', link: '/en/pool/database.md'},
                            {text: 'Redis Pool', link: '/en/pool/redis.md'},
                        ]
                    },
                    {text: 'High-Performance Shared Memory', link: '/en/table.md'},
                    {text: 'Lock-Free Counter', link: '/en/atomic.md'},
                    {text: 'Async File Operations', link: '/en/file_async.md'},
                    {text: 'Timer', link: '/en/timer.md'},
                    {text: 'Event Polling', link: '/en/event.md'},
                    {text: 'Lock', link: '/en/lock.md'},
                    {text: 'Functions', link: '/en/functions.md'},
                    {text: 'Version Updates', link: '/en/version_update.md'},
                    {text: 'Donation', link: '/en/contribute/donation.md'}
                ],

                outline: {level: [2, 3], label: 'On this page'},
                docFooter: {prev: 'Previous', next: 'Next'},
                lastUpdated: {text: 'Last updated'},
            }
        }
    },
    themeConfig: {
        logo: '/swoole-logo.svg',
        search: {
            provider: 'local'
        },
        socialLinks: [
            {icon: 'github', link: 'https://github.com/swoole/swoole-src'}
        ]
    }
})
