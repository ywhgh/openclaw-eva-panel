# OPENCLAW EVA PANEL

> A local NERV / MAGI-style realtime dashboard for host monitoring and OpenClaw status.

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![License](https://img.shields.io/badge/license-MIT-black)

OPENCLAW EVA PANEL is a local monitoring dashboard with an Evangelion-inspired control-room aesthetic. It is designed for a Windows machine running OpenClaw or related local tooling, and provides a single-screen overview of system load, process activity, network state, and OpenClaw runtime information.

## Current Dashboard Capabilities

The current version includes:

- Realtime CPU load and per-core usage
- Memory, disk, network, uptime, and top-process monitoring
- Current runtime model display (not just default model)
- Installed model panel
- Model usage distribution panel
- Realtime session panel with current-session highlighting
- Communication tool / channel status panel
- Long-memory digest panel
- Boot animation and NERV-style reveal transitions
- Multilingual UI selector:
  - `中文 / EN`
  - `日本語 / EN`

## Tech Stack

- Node.js
- Express
- WebSocket (`ws`)
- `systeminformation`
- Static frontend (HTML / CSS / JS)

## Requirements

- Windows
- Node.js 18+

## Install

```bash
npm install
```

## Run

### Direct

```bash
npm start
```

Then open:

```text
http://localhost:1312
```

### Stable script-based workflow

```cmd
scripts\start.cmd
scripts\status.cmd
scripts\logs.cmd
scripts\restart.cmd
scripts\stop.cmd
```

Equivalent npm commands are also available:

```cmd
npm run panel:start
npm run panel:status
npm run panel:logs
npm run panel:restart
npm run panel:stop
```

## Project Structure

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
│  ├─ restart.cmd
│  ├─ status.cmd
│  └─ logs.cmd
├─ server.js
├─ package.json
├─ README.md
└─ LICENSE
```

## Configuration Notes

### Runtime model vs default model

The dashboard now separates:

- **Current runtime model**: inferred from the most recent active main-session data
- **Default model**: read from local OpenClaw configuration

This avoids showing only the configured default when the actual running session is using another model.

### Memory panel

The long-memory area is displayed as a digest split into:

- Preferences
- Recent context
- Project state

Recent daily memory files are shown separately in the side column.

### Channel status panel

The communication section reflects enabled local integrations/plugins such as:

- Feishu
- QQBot
- WeCom
- OpenClaw Weixin
- related plugin entries when available

### Port

Default port is `1312`.

Override it with:

```cmd
set PORT=1313 && npm start
```

## Logs

Default log files:

```text
server.log
server.err.log
```

Realtime tail:

```cmd
scripts\logs.cmd
```

## Notes

- This project is intended for local use.
- Network statistics on Windows try to prefer real physical adapters over virtual/TUN/VPN interfaces.
- The dashboard reads local OpenClaw workspace/config/session files when available.
- If the dashboard shows stale data after heavy local testing, restarting the panel process is recommended.

## License

MIT
