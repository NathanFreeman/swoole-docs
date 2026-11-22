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
                            {text: 'Cookie类', link: '/zh/server/class/cookie.md'},
                            {text: 'Frame类', link: '/zh/server/class/frame.md'},
                            {text: 'CloseFrame类', link: '/zh/server/class/close_frame.md'},
                            {text: 'Port类', link: '/zh/server/class/port.md'},
                            {text: 'Connection类', link: '/zh/server/class/connection.md'},
                            {text: 'ExitException类', link: '/zh/server/class/exit_exception.md'},
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
                    {
                        text: '贡献',
                        collapsed: false,
                        items: [
                            {text: '团队', link: '/zh/contribute/excellent.md'},
                            {text: '捐赠', link: '/zh/contribute/donation.md'},
                        ]
                    }
                ],


                outline: {level: [2, 3], label: '页面导航'},
                docFooter: {prev: '上一页', next: '下一页'},
                lastUpdated: {text: '最后修改'},

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
                            {text: 'Cookie Class', link: '/en/server/class/cookie.md'},
                            {text: 'Frame Class', link: '/en/server/class/frame.md'},
                            {text: 'CloseFrame Class', link: '/en/server/class/close_frame.md'},
                            {text: 'Port Class', link: '/en/server/class/port.md'},
                            {text: 'Connection Class', link: '/en/server/class/connection.md'},
                            {text: 'ExitException Class', link: '/en/server/class/exit_exception.md'},
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
                    {
                        text: 'Contribute',
                        collapsed: false,
                        items: [
                            {text: 'Team', link: '/en/contribute/excellent.md'},
                            {text: 'Donation', link: '/en/contribute/donation.md'},
                        ]
                    }
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
