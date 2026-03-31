const HIST = 60;
const cpuHistory = Array(HIST).fill(0);
const memHistory = Array(HIST).fill(0);
const netRxHistory = Array(HIST).fill(0);
const netTxHistory = Array(HIST).fill(0);

const cpuCanvas = document.getElementById('cpu-chart');
const memCanvas = document.getElementById('mem-chart');
const netCanvas = document.getElementById('net-chart');
const cpuCtx = cpuCanvas.getContext('2d');
const memCtx = memCanvas.getContext('2d');
const netCtx = netCanvas.getContext('2d');

function drawChart(ctx, canvas, data, color, max) {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,102,0,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = H * i / 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  const step = W / (data.length - 1);
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  data.forEach((v, i) => {
    const x = i * step;
    const y = H - (Math.min(v, max) / max) * H;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function getPrimaryColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#ff6600';
}
function getSecondaryColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim() || '#00ff41';
}

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toTimeString().slice(0, 8);
  document.getElementById('date').textContent = now.toISOString().slice(0, 10).replace(/-/g, '/');
}
setInterval(updateClock, 1000);
updateClock();

function fmtUptime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function numFmt(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n || 0);
}

function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

const logScroll = document.getElementById('log-scroll');
function addLog(msg, type = '') {
  const ts = new Date().toTimeString().slice(0, 8);
  const div = document.createElement('div');
  div.className = 'log-entry';
  div.innerHTML = `<span class="ts">[${ts}]</span><span class="msg ${type}">${escapeHtml(msg)}</span>`;
  logScroll.appendChild(div);
  if (logScroll.children.length > 120) logScroll.removeChild(logScroll.firstChild);
  logScroll.scrollTop = logScroll.scrollHeight;
}

function channelIcon(id) {
  const map = {
    feishu: '📘',
    qqbot: '🐧',
    wecom: '💼',
    'openclaw-weixin': '💬',
    'openclaw-qqbot': '🛰️',
    'wecom-openclaw-plugin': '🧩'
  };
  return map[id] || '⬡';
}

function updateChannels(channels = []) {
  const grid = document.getElementById('channel-grid');
  grid.innerHTML = channels.map(ch => `
    <div class="operator-card status-${ch.enabled ? 'ACTIVE' : 'ERROR'} channel-card">
      <div class="channel-top">
        <div class="channel-icon">${channelIcon(ch.id)}</div>
        <div>
          <div class="op-name">${escapeHtml(ch.name)}</div>
          <div class="op-role">${escapeHtml(ch.id)}</div>
        </div>
      </div>
      <span class="op-status ${ch.enabled ? 'ACTIVE' : 'ERROR'}">${escapeHtml(ch.status)}</span>
      <div class="op-sync-label">${t('channel.detail')}</div>
      <div class="op-name-jp">${escapeHtml(ch.detail || '--')}</div>
    </div>
  `).join('');
}

function updateSessions(sessions = []) {
  const grid = document.getElementById('session-grid');
  grid.innerHTML = sessions.map(session => `
    <div class="session-card ${session.isCurrent ? 'current' : ''}">
      <div class="session-header">
        <div class="oc-agent-label">${escapeHtml(session.label)}</div>
        <div class="session-time">${new Date(session.updatedAt).toLocaleString()}</div>
      </div>
      <div class="session-badges">
        ${session.isCurrent ? `<span class="op-status ACTIVE">CURRENT</span>` : ''}
        <span class="op-status ACTIVE">${escapeHtml(session.provider || 'active')}</span>
      </div>
      <div class="oc-agent-model">${escapeHtml(session.model || '--')}</div>
      <div class="oc-agent-ctx">IN:${numFmt(session.tokensIn || 0)} OUT:${numFmt(session.tokensOut || 0)}</div>
      <div class="session-preview">${escapeHtml(session.preview || '--')}</div>
    </div>
  `).join('');
}

function updateInstalledModels(models = []) {
  const grid = document.getElementById('installed-models-grid');
  grid.innerHTML = models.map(model => `
    <div class="model-card">
      <div class="model-title">${escapeHtml(model.alias || model.name || model.id)}</div>
      <div class="model-sub">${escapeHtml(model.id)}</div>
      <div class="memory-meta">${t('model.context')}: ${numFmt(model.contextWindow || 0)}</div>
      <div class="memory-meta">Max Tokens: ${numFmt(model.maxTokens || 0)}</div>
      <div class="memory-meta">${t('model.reasoning')}: ${model.reasoning ? t('common.yes') : t('common.no')}</div>
    </div>
  `).join('');
}

function summarizeMemoryText(text) {
  const lines = String(text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  return lines.slice(0, 12).join('\n');
}

function renderDigestList(title, items) {
  return `
    <div class="digest-card">
      <div class="section-subtitle">${escapeHtml(title)}</div>
      <ul class="digest-list">
        ${(items && items.length ? items : ['--']).map(item => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </div>
  `;
}

function updateMemory(memory) {
  const digest = memory?.digest || {};
  document.getElementById('memory-long').innerHTML = [
    renderDigestList('Preferences / 偏好', digest.preferences || []),
    renderDigestList('Recent Context / 最近上下文', digest.recentContext || []),
    renderDigestList('Project State / 项目状态', digest.projectState || [])
  ].join('');

  const daily = document.getElementById('memory-daily-list');
  daily.innerHTML = (memory?.recentDailyFiles || []).map(item => `
    <div class="memory-box small">
      <div class="memory-meta">${escapeHtml(item.name)} · ${new Date(item.updatedAt).toLocaleString()}</div>
      <pre>${escapeHtml(summarizeMemoryText(item.preview || '--'))}</pre>
    </div>
  `).join('');
}

function updateModelUsage(items = []) {
  const el = document.getElementById('oc-model-usage');
  const total = items.reduce((sum, item) => sum + (item.count || 0), 0) || 1;
  el.innerHTML = items.map(item => {
    const pct = Math.max(8, Math.round((item.count / total) * 100));
    return `
      <div class="usage-card">
        <div class="usage-head">
          <div>
            <div class="usage-name">${escapeHtml(item.name)}</div>
            <div class="usage-full">${escapeHtml(item.fullId)}</div>
          </div>
          <div class="usage-count">${item.count}</div>
        </div>
        <div class="usage-bar-wrap"><div class="usage-bar" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join('');
}

function updateDashboardMeta(meta) {
  if (!meta) return;
  document.getElementById('oc-model').textContent = meta.currentModel?.id || '--';
  document.getElementById('oc-model-alias').textContent = meta.currentModel?.alias || '--';
  document.getElementById('oc-default-model').textContent = meta.currentModel?.defaultModel || '--';
  document.getElementById('oc-session-count').textContent = String((meta.sessions || []).length);
  document.getElementById('oc-installed-model-count').textContent = String((meta.installedModels || []).length);
  updateModelUsage(meta.modelUsage || []);
  updateChannels(meta.channels || []);
  updateSessions(meta.sessions || []);
  updateInstalledModels(meta.installedModels || []);
  updateMemory(meta.memory || {});
}

function updateUI(data) {
  const cpuLoad = parseFloat(data.cpu.load || 0);
  document.getElementById('cpu-load').textContent = cpuLoad.toFixed(1);
  cpuHistory.push(cpuLoad); cpuHistory.shift();
  drawChart(cpuCtx, cpuCanvas, cpuHistory, getSecondaryColor(), 100);
  document.getElementById('core-grid').innerHTML = (data.cpu.cores || []).map((c, i) => `<div class="core-item">C${i}: <span class="secondary">${c}%</span></div>`).join('');

  const memPct = parseFloat(data.memory.percent || 0);
  document.getElementById('mem-percent').textContent = memPct.toFixed(1);
  document.getElementById('mem-bar').style.width = `${memPct}%`;
  document.getElementById('mem-used').textContent = ((data.memory.used || 0) / 1e9).toFixed(1);
  document.getElementById('mem-free').textContent = ((data.memory.free || 0) / 1e9).toFixed(1);
  document.getElementById('mem-total').textContent = ((data.memory.total || 0) / 1e9).toFixed(1);
  memHistory.push(memPct); memHistory.shift();
  drawChart(memCtx, memCanvas, memHistory, getPrimaryColor(), 100);

  const rx = (data.network.rx || 0) / 1024;
  const tx = (data.network.tx || 0) / 1024;
  document.getElementById('net-iface').textContent = data.network.iface || '--';
  document.getElementById('net-ip').textContent = data.network.ip || '--';
  document.getElementById('net-rx').textContent = `${rx.toFixed(1)} KB/s`;
  document.getElementById('net-tx').textContent = `${tx.toFixed(1)} KB/s`;
  netRxHistory.push(rx); netRxHistory.shift();
  netTxHistory.push(tx); netTxHistory.shift();
  const maxNet = Math.max(...netRxHistory, ...netTxHistory, 1);
  netCtx.clearRect(0, 0, netCanvas.width, netCanvas.height);
  [[netRxHistory, getSecondaryColor()], [netTxHistory, getPrimaryColor()]].forEach(([hist, color]) => {
    const step = netCanvas.width / (hist.length - 1);
    netCtx.beginPath();
    netCtx.strokeStyle = color;
    netCtx.lineWidth = 1.5;
    hist.forEach((v, i) => {
      const x = i * step;
      const y = netCanvas.height - (Math.min(v, maxNet) / maxNet) * netCanvas.height;
      i === 0 ? netCtx.moveTo(x, y) : netCtx.lineTo(x, y);
    });
    netCtx.stroke();
  });

  const diskPct = parseFloat(data.disk.percent || 0);
  document.getElementById('disk-percent').textContent = diskPct.toFixed(1);
  document.getElementById('disk-bar').style.width = `${diskPct}%`;
  document.getElementById('disk-used').textContent = ((data.disk.used || 0) / 1e9).toFixed(1);
  document.getElementById('disk-total').textContent = ((data.disk.total || 0) / 1e9).toFixed(1);
  document.getElementById('uptime').textContent = fmtUptime(data.uptime || 0);

  document.getElementById('proc-tbody').innerHTML = (data.processes || []).map(p => `<tr><td>${escapeHtml(p.name)}</td><td>${p.pid}</td><td class="secondary">${p.cpu}%</td><td>${p.mem}</td></tr>`).join('');

  updateDashboardMeta(data.dashboard);
}

async function loadInitialMeta() {
  try {
    const meta = await fetch('/api/dashboard/meta').then(r => r.json());
    updateDashboardMeta(meta);
    addLog('Initial dashboard meta loaded', 'ok');
  } catch (e) {
    addLog(`Initial meta load failed: ${e.message}`, 'warn');
  }
}

let ws;
function connect() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}`);
  ws.onopen = () => addLog('MAGI SYSTEM LINK ESTABLISHED', 'ok');
  ws.onmessage = evt => {
    try {
      const { type, payload } = JSON.parse(evt.data);
      if (type === 'sysdata') updateUI(payload);
    } catch (e) {
      addLog(`Parse error: ${e.message}`, 'warn');
    }
  };
  ws.onclose = () => {
    addLog('CONNECTION LOST — RECONNECTING...', 'warn');
    setTimeout(connect, 2000);
  };
  ws.onerror = () => ws.close();
}

function startBootAnimation() {
  setTimeout(() => {
    document.body.classList.remove('booting');
    document.body.classList.add('ready');
    document.getElementById('boot-overlay')?.classList.add('hidden');
  }, 1200);
}

document.addEventListener('DOMContentLoaded', async () => {
  buildThemeSelector();
  applyTheme(currentTheme);
  const langSel = document.getElementById('lang-select');
  langSel.value = currentLang;
  langSel.addEventListener('change', e => setLang(e.target.value));
  applyI18n();
  startBootAnimation();
  await loadInitialMeta();
  connect();
  addLog('OPENCLAW EVA PANEL ONLINE', 'ok');
});
