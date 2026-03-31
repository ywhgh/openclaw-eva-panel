# OPENCLAW EVA PANEL

NERV / MAGI 风格的本地实时监控面板，用来展示主机状态与 OpenClaw 运行概况。

## 当前能力

- CPU 实时负载与核心占用
- 内存使用率
- 磁盘占用
- 进程 TOP 列表
- 网络接口识别与实时收发速率
- OpenClaw 模型 / 会话 / 网关状态展示
- 操作员状态面板
- 多主题、多语言切换

## 环境要求

- Windows
- Node.js 18+

## 安装

```bash
npm install
```

## 启动方式

### 方式 1：直接启动

```bash
npm start
```

启动后打开：

```text
http://localhost:3000
```

### 方式 2：使用脚本稳定启动（推荐）

项目内已提供 Windows 启动脚本：

```text
scripts\start.cmd   启动面板
scripts\stop.cmd    停止面板
scripts\status.cmd  查看运行状态
scripts\logs.cmd    查看实时日志
```

推荐日常使用：

```cmd
scripts\start.cmd
scripts\status.cmd
scripts\logs.cmd
```

## 目录结构

```text
openclaw-eva-panel/
├─ config/
│  └─ operators.json
├─ public/
│  ├─ index.html
│  ├─ app.js
│  ├─ style.css
│  ├─ i18n.js
│  └─ themes.js
├─ scripts/
│  ├─ start.cmd
│  ├─ stop.cmd
│  ├─ status.cmd
│  └─ logs.cmd
├─ server.js
├─ package.json
└─ README.md
```

## 操作员配置

编辑 `config/operators.json`：

```json
[
  {
    "id": 1,
    "name": "AYANAMI REI",
    "nameJp": "綾波レイ",
    "role": "PILOT UNIT-00",
    "status": "ACTIVE",
    "sync": 99.2
  }
]
```

支持的 `status`：

- `ACTIVE`
- `STANDBY`
- `ERROR`

## 说明

- 默认端口：`3000`
- 可通过环境变量 `PORT` 覆盖端口
- 网络速率在 Windows 下会优先选择真实物理网卡，尽量避开虚拟网卡/VPN/TUN 接口
- OpenClaw 状态区当前为本地集成展示，依赖本机工作区中的 `.openclaw/workspace` 内容

## 常见操作

### 修改端口

```cmd
set PORT=3001 && npm start
```

### 停止旧进程后重启

```cmd
scripts\stop.cmd
scripts\start.cmd
```

## 日志

默认日志文件：

```text
server.log
```

实时查看：

```cmd
scripts\logs.cmd
```

## 备注

这是一个本地面板项目，适合放在个人开发机或 OpenClaw 所在机器上常驻运行。
