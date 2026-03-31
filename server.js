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

const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const OPENCLAW_CONFIG_FILE = path.join(OPENCLAW_DIR, 'openclaw.json');
const OPENCLAW_WORKSPACE_DIR = path.join(OPENCLAW_DIR, 'workspace');
const OPENCLAW_MEMORY_DIR = path.join(OPENCLAW_WORKSPACE_DIR, 'memory');
const OPENCLAW_MEMORY_FILE = path.join(OPENCLAW_WORKSPACE_DIR, 'MEMORY.md');
const OPENCLAW_SESSION_DIR = path.join(OPENCLAW_DIR, 'agents', 'main', 'sessions');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

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

function safeReadText(filePath, fallback = '') {
  try {
    return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  } catch {
    return fallback;
  }
}

function safeReadJson(filePath, fallback) {
  try {
    return JSON.parse(safeReadText(filePath));
  } catch {
    return fallback;
  }
}

function withTimeout(promise, fallback, ms = 5000) {
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise(resolve => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function readOpenClawConfig() {
  return safeReadJson(OPENCLAW_CONFIG_FILE, {});
}

function loadOperators() {
  return safeReadJson(OPERATORS_FILE, []);
}

function flattenInstalledModels(cfg) {
  const providers = cfg?.models?.providers || {};
  return Object.entries(providers).flatMap(([providerId, provider]) => {
    const models = Array.isArray(provider.models) ? provider.models : [];
    return models.map(model => ({
      provider: providerId,
      id: `${providerId}/${model.id}`,
      name: model.name || model.id,
      contextWindow: model.contextWindow || 0,
      maxTokens: model.maxTokens || 0,
      reasoning: !!model.reasoning,
      api: provider.api || model.api || 'unknown',
      alias: cfg?.agents?.defaults?.models?.[`${providerId}/${model.id}`]?.alias || null,
    }));
  });
}

function pickCurrentRuntimeModel() {
  const sessionFiles = getRecentSessionFiles(1);
  if (!sessionFiles.length) {
    return readOpenClawConfig()?.agents?.defaults?.model?.primary || 'unknown';
  }

  const tail = safeReadTail(sessionFiles[0].fullPath, 60);
  for (let i = tail.length - 1; i >= 0; i -= 1) {
    try {
      const item = JSON.parse(tail[i]);
      const model = item?.message?.model || item?.message?.usage?.model;
      const provider = item?.message?.provider;
      if (provider && model && !String(model).includes('/')) return `${provider}/${model}`;
      if (model) return model;
    } catch {}
  }

  return readOpenClawConfig()?.agents?.defaults?.model?.primary || 'unknown';
}

function safeReadTail(filePath, lineCount = 20) {
  try {
    const text = safeReadText(filePath, '');
    return text.split(/\r?\n/).filter(Boolean).slice(-lineCount);
  } catch {
    return [];
  }
}

function getRecentSessionFiles(limit = 8) {
  try {
    return fs.readdirSync(OPENCLAW_SESSION_DIR)
      .filter(name => name.endsWith('.jsonl'))
      .map(name => {
        const fullPath = path.join(OPENCLAW_SESSION_DIR, name);
        const stat = fs.statSync(fullPath);
        return { name, fullPath, stat };
      })
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
      .slice(0, limit);
  } catch {
    return [];
  }
}

function parseSessionSummary(fileInfo) {
  const lines = safeReadTail(fileInfo.fullPath, 80);
  let model = 'unknown';
  let provider = 'unknown';
  let lastAssistantText = '';
  let updatedAt = fileInfo.stat.mtime.toISOString();
  let usageIn = 0;
  let usageOut = 0;

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      const item = JSON.parse(lines[i]);
      if (item?.timestamp && !updatedAt) updatedAt = item.timestamp;
      const msg = item?.message;
      if (msg?.model) model = msg.model;
      if (msg?.provider) provider = msg.provider;
      if (msg?.usage?.input) usageIn = msg.usage.input;
      if (msg?.usage?.output) usageOut = msg.usage.output;
      if (!lastAssistantText && msg?.role === 'assistant') {
        const content = Array.isArray(msg.content) ? msg.content : [];
        const textPart = content.find(part => part.type === 'text' && part.text)?.text;
        if (textPart) lastAssistantText = textPart.slice(0, 120);
      }
      if (model !== 'unknown' && provider !== 'unknown' && lastAssistantText) break;
    } catch {}
  }

  const sessionId = fileInfo.name.replace(/\.jsonl$/, '');
  const sessionLabel = sessionId.slice(0, 8);
  return {
    id: sessionId,
    label: sessionLabel,
    model: provider !== 'unknown' && !String(model).includes('/') ? `${provider}/${model}` : model,
    provider,
    updatedAt,
    tokensIn: usageIn,
    tokensOut: usageOut,
    preview: lastAssistantText,
    status: 'ACTIVE',
  };
}

function buildSessionPanelData() {
  const files = getRecentSessionFiles(6);
  return files.map((file, index) => ({
    ...parseSessionSummary(file),
    isCurrent: index === 0,
  }));
}

function extractSection(text, heading) {
  const lines = String(text || '').split(/\r?\n/);
  const start = lines.findIndex(line => line.trim() === heading.trim());
  if (start === -1) return [];
  const result = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^##\s+/.test(line)) break;
    if (line.trim()) result.push(line.trim());
  }
  return result.slice(0, 8);
}

function buildMemoryPanelData() {
  const longMemory = safeReadText(OPENCLAW_MEMORY_FILE, '');
  const recentDailyFiles = [];
  const preferences = extractSection(longMemory, '## 当前偏好与系统设置');
  const recentContext = extractSection(longMemory, '## 最近一次已确认的对话上下文');
  const projectState = extractSection(longMemory, '## openclaw-eva-panel 项目记录');

  try {
    const dailyFiles = fs.readdirSync(OPENCLAW_MEMORY_DIR)
      .filter(name => /^\d{4}-\d{2}-\d{2}\.md$/.test(name))
      .map(name => ({
        name,
        fullPath: path.join(OPENCLAW_MEMORY_DIR, name),
        stat: fs.statSync(path.join(OPENCLAW_MEMORY_DIR, name)),
      }))
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
      .slice(0, 3);

    for (const file of dailyFiles) {
      const text = safeReadText(file.fullPath, '');
      recentDailyFiles.push({
        name: file.name,
        preview: text.split(/\r?\n/).filter(Boolean).slice(0, 12).join('\n').slice(0, 600),
        updatedAt: file.stat.mtime.toISOString(),
      });
    }
  } catch {}

  return {
    longMemoryPreview: longMemory.split(/\r?\n/).filter(Boolean).slice(0, 30).join('\n').slice(0, 1500),
    digest: {
      preferences,
      recentContext,
      projectState,
    },
    recentDailyFiles,
  };
}

function buildChannelsPanelData(cfg) {
  const channels = cfg?.channels || {};
  const plugins = cfg?.plugins?.entries || {};
  const result = [];

  for (const [channelId, channelCfg] of Object.entries(channels)) {
    result.push({
      id: channelId,
      name: channelId.toUpperCase(),
      enabled: !!channelCfg?.enabled,
      status: channelCfg?.enabled ? 'ONLINE' : 'OFFLINE',
      detail: channelCfg?.enabled ? 'configured' : 'disabled',
    });
  }

  for (const [pluginId, pluginCfg] of Object.entries(plugins)) {
    if (!result.find(item => item.id === pluginId)) {
      result.push({
        id: pluginId,
        name: pluginId,
        enabled: !!pluginCfg?.enabled,
        status: pluginCfg?.enabled ? 'ONLINE' : 'OFFLINE',
        detail: pluginCfg?.enabled ? 'plugin enabled' : 'plugin disabled',
      });
    }
  }

  return result;
}

function buildModelUsageData(installedModels, sessions, currentModel) {
  const counts = new Map();
  installedModels.forEach(model => counts.set(model.id, 0));
  sessions.forEach(session => {
    const key = session.model;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  if (currentModel) counts.set(currentModel, (counts.get(currentModel) || 0) + 1);

  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .map(([id, count]) => {
      const model = installedModels.find(item => item.id === id) || { id, name: id, alias: null };
      return {
        id,
        name: model.alias || model.name || id,
        fullId: id,
        count,
      };
    })
    .sort((a, b) => b.count - a.count);
}

function buildDashboardMeta() {
  const cfg = readOpenClawConfig();
  const installedModels = flattenInstalledModels(cfg);
  const sessions = buildSessionPanelData();
  const currentModel = pickCurrentRuntimeModel();
  const currentAlias = cfg?.agents?.defaults?.models?.[currentModel]?.alias || installedModels.find(item => item.id === currentModel)?.alias || null;

  return {
    now: new Date().toISOString(),
    currentModel: {
      id: currentModel,
      alias: currentAlias,
      defaultModel: cfg?.agents?.defaults?.model?.primary || 'unknown',
    },
    sessions,
    installedModels,
    modelUsage: buildModelUsageData(installedModels, sessions, currentModel),
    channels: buildChannelsPanelData(cfg),
    memory: buildMemoryPanelData(),
  };
}

async function refreshCpu() {
  const currentLoad = await withTimeout(si.currentLoad(), { currentLoad: 0, cpus: [] }, 2000);
  systemCache.cpu = {
    load: Number(currentLoad.currentLoad || 0).toFixed(1),
    cores: Array.isArray(currentLoad.cpus) ? currentLoad.cpus.map(cpu => Number(cpu.load || 0).toFixed(1)) : [],
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
      mem: item.memRss ? (item.memRss / 1024 / 1024).toFixed(0) : item.memVsz ? (item.memVsz / 1024 / 1024).toFixed(0) : '0',
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
    const { stdout } = await execAsync(`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ${encoded}`, { timeout: 10000, maxBuffer: 1024 * 1024 });
    const parsed = JSON.parse((stdout || '').trim());
    if (parsed && typeof parsed.ReceivedBytes === 'number' && typeof parsed.SentBytes === 'number') {
      return { rx_bytes: parsed.ReceivedBytes, tx_bytes: parsed.SentBytes };
    }
  } catch {}
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
  let rankedStats = (networkStats || []).map(item => ({ ...item, _meta: interfaceMap.get(item.iface) || {} }))
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
    if (Array.isArray(lastNetworkStats)) previous = lastNetworkStats.find(item => item.iface === preferred.iface) || null;
    if (!previous && lastWindowsNetworkSample && lastWindowsNetworkSample.iface === preferred.iface) previous = lastWindowsNetworkSample;
    if (previous) {
      rx = Math.max(0, Math.round(((preferred.rx_bytes || 0) - (previous.rx_bytes || 0)) / deltaSeconds));
      tx = Math.max(0, Math.round(((preferred.tx_bytes || 0) - (previous.tx_bytes || 0)) / deltaSeconds));
    }
  }

  lastNetworkStats = rankedStats.map(item => ({ iface: item.iface, rx_bytes: item.rx_bytes || 0, tx_bytes: item.tx_bytes || 0 }));
  if (preferred) lastWindowsNetworkSample = { iface: preferred.iface, rx_bytes: preferred.rx_bytes || 0, tx_bytes: preferred.tx_bytes || 0 };
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
    systemCache.uptime = os.uptime();
    systemCache.time = new Date().toISOString();
  }, 2000);
}

function getRealtimeSnapshot() {
  return {
    time: systemCache.time || new Date().toISOString(),
    cpu: { ...systemCache.cpu },
    memory: { ...systemCache.memory },
    network: { ...systemCache.network },
    disk: { ...systemCache.disk },
    uptime: systemCache.uptime || os.uptime(),
    processes: Array.isArray(systemCache.processes) ? [...systemCache.processes] : [],
    dashboard: buildDashboardMeta(),
  };
}

app.get('/api/operators', (_req, res) => {
  res.json(loadOperators());
});

app.get('/api/openclaw/status', (_req, res) => {
  const meta = buildDashboardMeta();
  res.json({
    model: meta.currentModel.id,
    modelAlias: meta.currentModel.alias,
    defaultModel: meta.currentModel.defaultModel,
    sessions: meta.sessions,
    installedModels: meta.installedModels.length,
    channels: meta.channels,
    lastUpdated: new Date().toISOString(),
  });
});

app.get('/api/openclaw/models', (_req, res) => {
  const meta = buildDashboardMeta();
  res.json(meta.installedModels);
});

app.get('/api/dashboard/meta', (_req, res) => {
  res.json(buildDashboardMeta());
});

app.post('/api/openclaw/repair', (req, res) => {
  const { action } = req.body || {};
  if (action === 'restart') exec('openclaw gateway restart', () => {});
  res.json({ ok: true, action: action || 'noop' });
});

wss.on('connection', socket => {
  const sendSnapshot = () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'sysdata', payload: getRealtimeSnapshot() }));
    }
  };
  sendSnapshot();
  const timer = setInterval(sendSnapshot, 1000);
  socket.on('close', () => clearInterval(timer));
});

startRefreshLoops();

server.listen(PORT, () => {
  console.log(`EVA PANEL ONLINE: http://localhost:${PORT}`);
});

process.on('unhandledRejection', error => {
  console.error('[unhandledRejection]', error);
});

process.on('uncaughtException', error => {
  console.error('[uncaughtException]', error);
});
