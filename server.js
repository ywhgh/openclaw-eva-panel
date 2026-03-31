const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const si = require('systeminformation');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const CONFIG_DIR = path.join(ROOT_DIR, 'config');
const OPERATORS_FILE = path.join(CONFIG_DIR, 'operators.json');
const OPENCLAW_MEMORY_DIR = path.join(os.homedir(), '.openclaw', 'workspace', 'memory');
const OPENCLAW_MEMORY_FILE = path.join(os.homedir(), '.openclaw', 'workspace', 'MEMORY.md');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

const openclawState = {
  model: 'custom-localhost-8317/gpt-5.4',
  tokensIn: 0,
  tokensOut: 0,
  contextPct: 18.5,
  apiHealth: 'OK',
  sessions: [],
  agents: [],
  gatewayOnline: true,
  operatorStatus: { summary: 'ACTIVE' },
  lastUpdated: null,
};

const systemCache = {
  cpu: { load: '0.0', cores: [] },
  memory: { total: 0, used: 0, free: 0, percent: '0.0' },
  network: { rx: 0, tx: 0, ip: '127.0.0.1', iface: 'N/A' },
  disk: { total: 0, used: 0, percent: '0.0' },
  processes: [],
  uptime: os.uptime(),
  time: new Date().toISOString(),
};

let lastNetworkStats = null;
let lastNetworkAt = Date.now();
let lastWindowsNetworkSample = null;

function safeReadJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function loadOperators() {
  return safeReadJson(OPERATORS_FILE, []);
}

function detectModelFromMemory() {
  try {
    const text = fs.readFileSync(OPENCLAW_MEMORY_FILE, 'utf8');
    const match = text.match(/当前默认模型应为\s*`([^`]+)`/) || text.match(/default model.*?`([^`]+)`/i);
    return match?.[1] || openclawState.model;
  } catch {
    return openclawState.model;
  }
}

function updateOpenClawState() {
  openclawState.model = detectModelFromMemory();

  try {
    const files = fs.readdirSync(OPENCLAW_MEMORY_DIR)
      .filter(name => /^\d{4}-\d{2}-\d{2}\.md$/.test(name))
      .sort()
      .reverse();

    const today = new Date().toISOString().slice(0, 10) + '.md';
    openclawState.sessions = files.slice(0, 4).map((name, index) => ({
      id: name,
      label: name.replace('.md', ''),
      model: openclawState.model,
      status: name === today ? 'ACTIVE' : index === 0 ? 'STANDBY' : 'IDLE',
      tokensIn: 1200 + index * 300,
      tokensOut: 800 + index * 220,
    }));
    openclawState.agents = openclawState.sessions;
  } catch {
    openclawState.sessions = [];
    openclawState.agents = [];
  }

  openclawState.tokensIn = 48210;
  openclawState.tokensOut = 21984;
  openclawState.contextPct = 18.5;
  openclawState.gatewayOnline = true;
  openclawState.apiHealth = 'OK';
  openclawState.lastUpdated = new Date().toISOString();
}

function withTimeout(promise, fallback, ms = 5000) {
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise(resolve => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function refreshCpu() {
  const currentLoad = await withTimeout(si.currentLoad(), { currentLoad: 0, cpus: [] }, 2000);
  systemCache.cpu = {
    load: Number(currentLoad.currentLoad || 0).toFixed(1),
    cores: Array.isArray(currentLoad.cpus)
      ? currentLoad.cpus.map(cpu => Number(cpu.load || 0).toFixed(1))
      : [],
  };
}

async function refreshMemory() {
  const mem = await withTimeout(si.mem(), { total: 0, used: 0, free: 0 }, 3000);
  systemCache.memory = {
    total: mem.total || 0,
    used: mem.used || 0,
    free: mem.free || 0,
    percent: mem.total ? ((mem.used / mem.total) * 100).toFixed(1) : '0.0',
  };
}

async function refreshDisk() {
  const fsSize = await withTimeout(si.fsSize(), [], 3000);
  const preferred = fsSize.find(item => String(item.mount || '').toUpperCase().startsWith('C:')) || fsSize[0] || {};

  systemCache.disk = {
    total: preferred.size || 0,
    used: preferred.used || 0,
    percent: typeof preferred.use === 'number' ? preferred.use.toFixed(1) : '0.0',
  };
}

async function refreshProcesses() {
  const processes = await withTimeout(si.processes(), { list: [] }, 3500);
  systemCache.processes = (processes.list || [])
    .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
    .slice(0, 10)
    .map(item => ({
      name: item.name,
      pid: item.pid,
      cpu: Number(item.cpu || 0).toFixed(1),
      mem: item.memRss
        ? (item.memRss / 1024 / 1024).toFixed(0)
        : item.memVsz
          ? (item.memVsz / 1024 / 1024).toFixed(0)
          : '0',
    }));
}

function scoreNetworkInterface(item) {
  const text = `${item.iface || ''} ${item.ifaceName || ''} ${item.type || ''}`.toLowerCase();
  let score = 0;

  if (item.ip4 && !item.internal) score += 100;
  if (/ethernet|wi-?fi|wireless|wlan/.test(text)) score += 60;
  if (/realtek|intel|broadcom|qualcomm|mediatek/.test(text)) score += 40;
  if (/bluetooth/.test(text)) score -= 40;
  if (/mihomo|tun|tap|vpn|virtual|vmware|hyper-v|loopback|vethernet|docker|tailscale|zerotier/.test(text)) score -= 120;

  return score;
}

async function getWindowsNetBytes(interfaceName) {
  if (process.platform !== 'win32' || !interfaceName) return null;

  try {
    const escaped = String(interfaceName).replace(/'/g, "''");
    const script = [
      "$ProgressPreference='SilentlyContinue'",
      "$WarningPreference='SilentlyContinue'",
      `$stats = Get-NetAdapterStatistics -Name '${escaped}' | Select-Object ReceivedBytes,SentBytes`,
      "$stats | ConvertTo-Json -Compress",
    ].join('; ');

    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const { stdout } = await execAsync(
      `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ${encoded}`,
      { timeout: 10000, maxBuffer: 1024 * 1024 }
    );

    const parsed = JSON.parse((stdout || '').trim());
    if (parsed && typeof parsed.ReceivedBytes === 'number' && typeof parsed.SentBytes === 'number') {
      return { rx_bytes: parsed.ReceivedBytes, tx_bytes: parsed.SentBytes };
    }
  } catch {
    return null;
  }

  return null;
}

async function refreshNetwork() {
  const [networkStats, networkInterfaces] = await Promise.all([
    withTimeout(si.networkStats(), [], 5000),
    withTimeout(si.networkInterfaces(), [], 5000),
  ]);

  const sortedInterfaces = [...(networkInterfaces || [])].sort((a, b) => scoreNetworkInterface(b) - scoreNetworkInterface(a));
  const primaryInterface = sortedInterfaces[0] || {};

  const interfaceMap = new Map((networkInterfaces || []).map(item => [item.iface, item]));
  let rankedStats = (networkStats || [])
    .map(item => ({ ...item, _meta: interfaceMap.get(item.iface) || {} }))
    .sort((a, b) => scoreNetworkInterface(b._meta) - scoreNetworkInterface(a._meta));

  let preferred = rankedStats[0] || null;

  if ((!preferred || scoreNetworkInterface(preferred._meta || {}) < scoreNetworkInterface(primaryInterface)) && primaryInterface.iface) {
    const fallbackStats = await getWindowsNetBytes(primaryInterface.iface);
    if (fallbackStats) {
      preferred = { iface: primaryInterface.iface, ...fallbackStats, _meta: primaryInterface };
      rankedStats = [preferred, ...rankedStats.filter(item => item.iface !== primaryInterface.iface)];
    }
  }

  let rx = systemCache.network.rx || 0;
  let tx = systemCache.network.tx || 0;
  const now = Date.now();
  const deltaSeconds = Math.max((now - lastNetworkAt) / 1000, 1);

  if (preferred) {
    let previous = null;

    if (Array.isArray(lastNetworkStats)) {
      previous = lastNetworkStats.find(item => item.iface === preferred.iface) || null;
    }

    if (!previous && lastWindowsNetworkSample && lastWindowsNetworkSample.iface === preferred.iface) {
      previous = lastWindowsNetworkSample;
    }

    if (previous) {
      rx = Math.max(0, Math.round(((preferred.rx_bytes || 0) - (previous.rx_bytes || 0)) / deltaSeconds));
      tx = Math.max(0, Math.round(((preferred.tx_bytes || 0) - (previous.tx_bytes || 0)) / deltaSeconds));
    }
  }

  lastNetworkStats = rankedStats.map(item => ({
    iface: item.iface,
    rx_bytes: item.rx_bytes || 0,
    tx_bytes: item.tx_bytes || 0,
  }));

  if (preferred) {
    lastWindowsNetworkSample = {
      iface: preferred.iface,
      rx_bytes: preferred.rx_bytes || 0,
      tx_bytes: preferred.tx_bytes || 0,
    };
  }

  lastNetworkAt = now;

  const shownInterface = preferred?._meta || primaryInterface || {};
  systemCache.network = {
    rx,
    tx,
    ip: shownInterface.ip4 || systemCache.network.ip || '127.0.0.1',
    iface: shownInterface.iface || systemCache.network.iface || 'N/A',
  };
}

async function safeRefresh(label, fn) {
  try {
    await fn();
  } catch (error) {
    console.error(`[refresh:${label}] ${error.message}`);
  } finally {
    systemCache.uptime = os.uptime();
    systemCache.time = new Date().toISOString();
  }
}

function startRefreshLoops() {
  safeRefresh('cpu', refreshCpu);
  safeRefresh('memory', refreshMemory);
  safeRefresh('disk', refreshDisk);
  safeRefresh('processes', refreshProcesses);
  safeRefresh('network', refreshNetwork);

  setInterval(() => safeRefresh('cpu', refreshCpu), 1000);
  setInterval(() => safeRefresh('memory', refreshMemory), 2000);
  setInterval(() => safeRefresh('disk', refreshDisk), 15000);
  setInterval(() => safeRefresh('processes', refreshProcesses), 3000);
  setInterval(() => safeRefresh('network', refreshNetwork), 3000);
  setInterval(() => {
    updateOpenClawState();
    systemCache.uptime = os.uptime();
    systemCache.time = new Date().toISOString();
  }, 2000);
}

function getSystemSnapshot() {
  updateOpenClawState();
  return {
    time: systemCache.time || new Date().toISOString(),
    cpu: { ...systemCache.cpu },
    memory: { ...systemCache.memory },
    network: { ...systemCache.network },
    disk: { ...systemCache.disk },
    uptime: systemCache.uptime || os.uptime(),
    processes: Array.isArray(systemCache.processes) ? [...systemCache.processes] : [],
    openclaw: { ...openclawState },
  };
}

app.get('/api/operators', (_req, res) => {
  res.json(loadOperators());
});

app.get('/api/openclaw/status', (_req, res) => {
  updateOpenClawState();
  res.json(openclawState);
});

app.get('/api/openclaw/models', (_req, res) => {
  res.json([
    { id: 'custom-localhost-8317/gpt-5.4', label: 'GPT5.4' },
    { id: 'free_api/gpt-5.4', label: 'FreeGPT' },
    { id: 'free_api/claude-sonnet-4.6', label: 'FreeClaude' },
    { id: 'free_api/grok-4.1-fast', label: 'FreeGrok' },
    { id: 'moonshot/kimi-k2.5', label: 'Kimi' },
    { id: 'codeflow/claude-sonnet-4-5-20250929', label: 'Sonnet' },
  ]);
});

app.post('/api/openclaw/switch-model', (req, res) => {
  const { model } = req.body || {};
  if (!model) {
    return res.status(400).json({ error: 'model required' });
  }

  try {
    if (fs.existsSync(OPENCLAW_MEMORY_FILE)) {
      let memoryText = fs.readFileSync(OPENCLAW_MEMORY_FILE, 'utf8');
      if (/当前默认模型应为\s*`[^`]+`/.test(memoryText)) {
        memoryText = memoryText.replace(/当前默认模型应为\s*`[^`]+`/, `当前默认模型应为 \`${model}\``);
      }
      fs.writeFileSync(OPENCLAW_MEMORY_FILE, memoryText, 'utf8');
    }
  } catch {
    // Ignore memory sync failures for dashboard-side model switches.
  }

  openclawState.model = model;
  openclawState.lastUpdated = new Date().toISOString();
  res.json({ ok: true, model });
});

app.post('/api/openclaw/repair', (req, res) => {
  const { action } = req.body || {};
  if (action === 'restart') {
    exec('openclaw gateway restart', () => {});
  }

  updateOpenClawState();
  res.json({ ok: true, action: action || 'noop' });
});

wss.on('connection', socket => {
  const sendSnapshot = () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'sysdata', payload: getSystemSnapshot() }));
    }
  };

  sendSnapshot();
  const timer = setInterval(sendSnapshot, 1000);
  socket.on('close', () => clearInterval(timer));
});

startRefreshLoops();

server.listen(PORT, () => {
  updateOpenClawState();
  console.log(`EVA PANEL ONLINE: http://localhost:${PORT}`);
});

process.on('unhandledRejection', error => {
  console.error('[unhandledRejection]', error);
});

process.on('uncaughtException', error => {
  console.error('[uncaughtException]', error);
});
