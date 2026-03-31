# OPENCLAW EVA PANEL

> A local NERV / MAGI-style realtime dashboard for host monitoring and OpenClaw status.

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![License](https://img.shields.io/badge/license-MIT-black)

OPENCLAW EVA PANEL is a local monitoring dashboard with an Evangelion-inspired control-room aesthetic. It is designed for a Windows machine running OpenClaw or related local tooling, and provides a single-screen overview of system load, process activity, network state, and OpenClaw session status.

## Features

- Realtime CPU load and per-core usage
- Memory usage and capacity overview
- Disk utilization panel
- Top process list by CPU usage
- Network interface selection with Windows fallback for real adapters
- OpenClaw model / session / gateway summary panel
- Operator status cards from configurable JSON
- Theme switching and multilingual UI support

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
http://localhost:3000
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

## Configuration

### Operators

Edit `config/operators.json`:

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

Supported `status` values:

- `ACTIVE`
- `STANDBY`
- `ERROR`

### Port

Default port is `3000`.

Override it with:

```cmd
set PORT=3001 && npm start
```

## Notes

- This project is intended for local use.
- Network statistics on Windows try to prefer real physical adapters over virtual/TUN/VPN interfaces.
- The OpenClaw panel reads local workspace context from `.openclaw/workspace` when available.

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

## License

MIT
