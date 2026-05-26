const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec, execFile } = require('child_process');

const PORT = Number(process.env.PORT || 1312);
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const STATIC_DIR = fs.existsSync(path.join(DIST_DIR, 'index.html')) ? DIST_DIR : PUBLIC_DIR;
const CONFIG_DIR = path.join(ROOT_DIR, 'config');
const OPERATORS_FILE = path.join(CONFIG_DIR, 'operators.json');
const DISK_ROOT = path.parse(ROOT_DIR).root || ROOT_DIR;
const CPU_COUNT = Math.max(1, os.cpus().length);
const DASHBOARD_META_TTL_MS = 5000;

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
app.use(express.static(STATIC_DIR));

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
let lastCpuSample = null;
let lastProcessSample = null;
let dashboardMetaCache = { at: 0, value: null };
const refreshLocks = new Set();

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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseInteger(value) {
  const normalized = String(value || '').replace(/[,\s]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function runCommand(file, args, options = {}) {
  const timeoutMs = options.timeoutMs || 5000;
  const maxBuffer = options.maxBuffer || 1024 * 1024;

  return new Promise((resolve, reject) => {
    let timedOut = false;
    const child = execFile(file, args, {
      windowsHide: true,
      encoding: 'utf8',
      maxBuffer,
    }, (error, stdout, stderr) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`${file} timed out after ${timeoutMs}ms`));
        return;
      }
      if (error) {
        const detail = String(stderr || '').trim();
        reject(new Error(`${file} failed: ${detail || error.message}`));
        return;
      }
      resolve(stdout || '');
    });

    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === 'win32' && child.pid) {
        execFile('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true }, () => {});
      } else {
        child.kill('SIGKILL');
      }
    }, timeoutMs);
  });
}

function parseCsvLine(line) {
  const result = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === ',' && !quoted) {
      result.push(value);
      value = '';
    } else {
      value += ch;
    }
  }

  result.push(value);
  return result.map(item => item.trim());
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
    const stat = fs.statSync(filePath);
    const readSize = Math.min(stat.size, 256 * 1024);
    const buffer = Buffer.alloc(readSize);
    const fd = fs.openSync(filePath, 'r');
    try {
      fs.readSync(fd, buffer, 0, readSize, Math.max(0, stat.size - readSize));
    } finally {
      fs.closeSync(fd);
    }
    const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
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

function getDashboardMeta() {
  const now = Date.now();
  if (dashboardMetaCache.value && now - dashboardMetaCache.at < DASHBOARD_META_TTL_MS) {
    return dashboardMetaCache.value;
  }

  const value = buildDashboardMeta();
  dashboardMetaCache = { at: now, value };
  return value;
}

function readCpuSample() {
  return os.cpus().map(cpu => {
    const times = cpu.times || {};
    const idle = Number(times.idle || 0);
    const total = Object.values(times).reduce((sum, value) => sum + Number(value || 0), 0);
    return { idle, total };
  });
}

async function refreshCpu() {
  const current = readCpuSample();
  if (!lastCpuSample || lastCpuSample.length !== current.length) {
    lastCpuSample = current;
    systemCache.cpu = {
      load: '0.0',
      cores: current.map(() => '0.0'),
    };
    return;
  }

  let totalDelta = 0;
  let idleDelta = 0;
  const cores = current.map((sample, index) => {
    const previous = lastCpuSample[index] || sample;
    const total = Math.max(0, sample.total - previous.total);
    const idle = Math.max(0, sample.idle - previous.idle);
    totalDelta += total;
    idleDelta += idle;
    return total > 0 ? clamp(((total - idle) / total) * 100, 0, 100).toFixed(1) : '0.0';
  });

  lastCpuSample = current;
  systemCache.cpu = {
    load: totalDelta > 0 ? clamp(((totalDelta - idleDelta) / totalDelta) * 100, 0, 100).toFixed(1) : '0.0',
    cores,
  };
}

async function refreshMemory() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = Math.max(0, total - free);
  systemCache.memory = {
    total,
    used,
    free,
    percent: total ? ((used / total) * 100).toFixed(1) : '0.0',
  };
}

async function refreshDisk() {
  const stat = fs.statfsSync(DISK_ROOT);
  const blockSize = Number(stat.bsize || 0);
  const total = Number(stat.blocks || 0) * blockSize;
  const free = Number(stat.bfree || 0) * blockSize;
  const used = Math.max(0, total - free);
  systemCache.disk = {
    total,
    used,
    percent: total ? ((used / total) * 100).toFixed(1) : '0.0',
  };
}

function parseWmicProcesses(output) {
  const lines = String(output || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const headerIndex = lines.findIndex(line => /^Node,/i.test(line));
  if (headerIndex === -1) throw new Error('wmic process output did not include a CSV header');

  const headers = parseCsvLine(lines[headerIndex]).map(item => item.toLowerCase());
  const fieldIndex = name => headers.indexOf(name.toLowerCase());
  const idxKernel = fieldIndex('KernelModeTime');
  const idxName = fieldIndex('Name');
  const idxPid = fieldIndex('ProcessId');
  const idxUser = fieldIndex('UserModeTime');
  const idxWorkingSet = fieldIndex('WorkingSetSize');
  if ([idxKernel, idxName, idxPid, idxUser, idxWorkingSet].some(index => index < 0)) {
    throw new Error('wmic process output is missing required fields');
  }

  return lines.slice(headerIndex + 1).map(line => {
    const cols = parseCsvLine(line);
    const pid = parseInteger(cols[idxPid]);
    const name = cols[idxName] || `pid-${pid}`;
    return {
      pid,
      name,
      cpuTime: parseInteger(cols[idxKernel]) + parseInteger(cols[idxUser]),
      memory: parseInteger(cols[idxWorkingSet]),
    };
  }).filter(item => item.pid > 0 && item.name && Number.isFinite(item.cpuTime));
}

async function refreshProcesses() {
  const output = await runCommand('cmd.exe', [
    '/d',
    '/s',
    '/c',
    'chcp 65001 > nul & wmic path Win32_Process get ProcessId,Name,WorkingSetSize,KernelModeTime,UserModeTime /format:csv',
  ], { timeoutMs: 30000, maxBuffer: 2 * 1024 * 1024 });
  const now = Date.now();
  const processes = parseWmicProcesses(output);
  const previous = lastProcessSample;
  const elapsedMs = previous ? Math.max(1, now - previous.at) : 0;
  const currentByPid = new Map(processes.map(item => [item.pid, item]));

  systemCache.processes = processes.map(item => {
    const old = previous?.byPid.get(item.pid);
    const cpu = old && elapsedMs
      ? clamp(((item.cpuTime - old.cpuTime) / (elapsedMs * 10000 * CPU_COUNT)) * 100, 0, 100)
      : 0;
    return {
      name: item.name,
      pid: item.pid,
      cpu: cpu.toFixed(1),
      mem: (item.memory / 1024 / 1024).toFixed(0),
      _memory: item.memory,
    };
  })
    .sort((a, b) => (Number(b.cpu) - Number(a.cpu)) || (b._memory - a._memory))
    .slice(0, 10)
    .map(({ _memory, ...item }) => item);

  lastProcessSample = { at: now, byPid: currentByPid };
}

function scoreNetworkInterface(item) {
  const text = `${item.iface || ''} ${item.address || ''} ${item.mac || ''}`.toLowerCase();
  let score = 0;
  if (item.family === 'IPv4' && !item.internal) score += 100;
  if (/ethernet|wi-?fi|wireless|wlan|以太|无线/.test(text)) score += 60;
  if (/bluetooth/.test(text)) score -= 40;
  if (/mihomo|tun|tap|vpn|virtual|vmware|hyper-v|loopback|vethernet|docker|tailscale|zerotier/.test(text)) score -= 120;
  return score;
}

function getPrimaryNetworkInterface() {
  const entries = Object.entries(os.networkInterfaces())
    .flatMap(([iface, addresses]) => (addresses || []).map(address => ({ iface, ...address })))
    .filter(item => item.family === 'IPv4')
    .sort((a, b) => scoreNetworkInterface(b) - scoreNetworkInterface(a));
  return entries[0] || null;
}

function parseNetstatBytes(output) {
  const line = String(output || '').split(/\r?\n/).find(item => {
    const numbers = item.match(/\d[\d,]*/g);
    return numbers && numbers.length >= 2;
  });
  if (!line) throw new Error('netstat -e output did not include byte counters');

  const numbers = line.match(/\d[\d,]*/g).map(parseInteger);
  return {
    rxBytes: numbers[0],
    txBytes: numbers[1],
  };
}

async function refreshNetwork() {
  const output = await runCommand('netstat.exe', ['-e'], { timeoutMs: 15000, maxBuffer: 256 * 1024 });
  const now = Date.now();
  const counters = parseNetstatBytes(output);
  const previous = lastNetworkStats;
  const elapsedSeconds = previous ? Math.max(1, (now - previous.at) / 1000) : 0;
  const rx = previous ? Math.max(0, Math.round((counters.rxBytes - previous.rxBytes) / elapsedSeconds)) : 0;
  const tx = previous ? Math.max(0, Math.round((counters.txBytes - previous.txBytes) / elapsedSeconds)) : 0;
  const primary = getPrimaryNetworkInterface();

  lastNetworkStats = { ...counters, at: now };
  systemCache.network = {
    rx,
    tx,
    ip: primary?.address || systemCache.network.ip || '127.0.0.1',
    iface: primary?.iface || systemCache.network.iface || 'N/A',
  };
}

async function safeRefresh(label, fn) {
  if (refreshLocks.has(label)) return;
  refreshLocks.add(label);

  try {
    await fn();
  } catch (error) {
    console.error(`[refresh:${label}] ${error.message}`);
  } finally {
    refreshLocks.delete(label);
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
  setInterval(() => safeRefresh('processes', refreshProcesses), 30000);
  setInterval(() => safeRefresh('network', refreshNetwork), 5000);
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
    dashboard: getDashboardMeta(),
  };
}

app.get('/api/operators', (_req, res) => {
  res.json(loadOperators());
});

app.get('/api/openclaw/status', (_req, res) => {
  const meta = getDashboardMeta();
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
  const meta = getDashboardMeta();
  res.json(meta.installedModels);
});

app.get('/api/dashboard/meta', (_req, res) => {
  res.json(getDashboardMeta());
});

app.post('/api/openclaw/repair', (req, res) => {
  const { action } = req.body || {};
  if (action === 'restart') exec('openclaw gateway restart', () => {});
  res.json({ ok: true, action: action || 'noop' });
});

app.get('*', (req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    next();
    return;
  }

  const indexFile = path.join(STATIC_DIR, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
    return;
  }

  next();
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

server.listen(PORT, () => {
  console.log(`EVA PANEL ONLINE: http://localhost:${PORT}`);
  setTimeout(startRefreshLoops, 500);
});

process.on('unhandledRejection', error => {
  console.error('[unhandledRejection]', error);
});

process.on('uncaughtException', error => {
  console.error('[uncaughtException]', error);
});
