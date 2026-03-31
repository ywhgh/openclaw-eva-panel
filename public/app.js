// app.js - EVA NERV Dashboard Frontend

// ---- Chart Histories ----
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
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  // grid
  ctx.strokeStyle = 'rgba(255,102,0,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const y = H * i / 4;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // line
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
  // fill
  ctx.shadowBlur = 0;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, color.replace(')', ',0.25)').replace('rgb', 'rgba'));
  grad.addColorStop(1, 'transparent');
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
}

function getPrimaryColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#ff6600';
}
function getSecondaryColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim() || '#00ff41';
}

// ---- Clock ----
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toTimeString().slice(0, 8);
  document.getElementById('date').textContent =
    now.toISOString().slice(0, 10).replace(/-/g, '/');
}
setInterval(updateClock, 1000);
updateClock();

// ---- Helpers ----
function fmt(bytes) {
  if (bytes > 1e9) return (bytes/1e9).toFixed(2) + ' GB';
  if (bytes > 1e6) return (bytes/1e6).toFixed(1) + ' MB';
  if (bytes > 1e3) return (bytes/1e3).toFixed(1) + ' KB';
  return bytes + ' B';
}
function fmtUptime(s) {
  const d = Math.floor(s/86400), h = Math.floor((s%86400)/3600), m = Math.floor((s%3600)/60);
  return `${d}d ${h}h ${m}m`;
}
function numFmt(n) {
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return String(n);
}

// ---- Log ----
const logScroll = document.getElementById('log-scroll');
function addLog(msg, type='') {
  const ts = new Date().toTimeString().slice(0,8);
  const div = document.createElement('div');
  div.className = 'log-entry';
  div.innerHTML = `<span class="ts">[${ts}]</span><span class="msg ${type}">${msg}</span>`;
  logScroll.appendChild(div);
  if (logScroll.children.length > 80) logScroll.removeChild(logScroll.firstChild);
  logScroll.scrollTop = logScroll.scrollHeight;
}

// ---- Operators ----
async function loadOperators() {
  try {
    const ops = await fetch('/api/operators').then(r => r.json());
    const grid = document.getElementById('operators-grid');
    grid.innerHTML = ops.map(op => {
      const syncClass = op.sync < 50 ? 'low' : '';
      return `<div class="operator-card status-${op.status}">
        <div class="op-name">${op.name}</div>
        <div class="op-name-jp">${op.nameJp}</div>
        <div class="op-role">${op.role}</div>
        <span class="op-status ${op.status}">${op.status}</span>
        <div class="op-sync-label">SYNC RATE</div>
        <div class="op-sync-value ${syncClass}">${op.sync.toFixed(1)}<span style="font-size:0.5em">%</span></div>
      </div>`;
    }).join('');
  } catch(e) { addLog('Operator data unavailable', 'warn'); }
}
loadOperators();

// ---- OpenClaw Models ----
async function loadModels() {
  try {
    const models = await fetch('/api/openclaw/models').then(r => r.json());
    const sel = document.getElementById('oc-model-select');
    sel.innerHTML = models.map(m => `<option value="${m.id}">${m.label} // ${m.id}</option>`).join('');
  } catch(e) {}
}
loadModels();

document.getElementById('oc-model-btn').addEventListener('click', async () => {
  const model = document.getElementById('oc-model-select').value;
  try {
    const r = await fetch('/api/openclaw/switch-model', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ model })
    }).then(r => r.json());
    addLog(`Model switch → ${model}`, 'ok');
  } catch(e) { addLog('Model switch failed', 'warn'); }
});

document.getElementById('oc-repair-reconnect').addEventListener('click', async () => {
  addLog('Reconnecting OpenClaw API...', '');
  try {
    await fetch('/api/openclaw/repair', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'reconnect' })
    });
    addLog('Reconnect complete', 'ok');
  } catch(e) { addLog('Reconnect failed', 'warn'); }
});

document.getElementById('oc-repair-restart').addEventListener('click', async () => {
  if (!confirm('Restart OpenClaw Gateway?')) return;
  addLog('Restarting gateway...', 'warn');
  try {
    await fetch('/api/openclaw/repair', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'restart' })
    });
    addLog('Gateway restart initiated', 'ok');
  } catch(e) { addLog('Restart failed', 'warn'); }
});

// ---- OpenClaw Update ----
function updateOC(oc) {
  if (!oc) return;
  document.getElementById('oc-model').textContent = oc.model || '--';
  document.getElementById('oc-tokens-in').textContent  = numFmt(oc.tokensIn  || 0);
  document.getElementById('oc-tokens-out').textContent = numFmt(oc.tokensOut || 0);

  const gwEl = document.getElementById('oc-gw-status');
  if (oc.gatewayOnline) {
    gwEl.textContent = 'ONLINE';
    gwEl.className = 'oc-value secondary';
  } else {
    gwEl.textContent = 'OFFLINE';
    gwEl.className = 'oc-value red';
  }

  // context bar
  const pct = parseFloat(oc.contextPct) || 0;
  document.getElementById('oc-ctx-pct').textContent = pct.toFixed(1) + '%';
  const bar = document.getElementById('oc-ctx-bar');
  bar.style.width = pct + '%';
  if (pct >= 85) { bar.className = 'bar red'; }
  else if (pct >= 60) { bar.className = 'bar orange'; }
  else { bar.className = 'bar'; }

  const warnEl = document.getElementById('oc-ctx-warn');
  if (pct >= 85) {
    warnEl.textContent = t('oc.context.crit');
    warnEl.classList.remove('hidden');
  } else if (pct >= 60) {
    warnEl.textContent = t('oc.context.warn');
    warnEl.classList.remove('hidden');
  } else {
    warnEl.classList.add('hidden');
  }

  // agents
  const agents = oc.agents || [];
  const agGrid = document.getElementById('oc-agents-grid');
  if (agents.length === 0) {
    agGrid.innerHTML = '<div style="color:var(--dim-primary);font-size:0.7em">NO ACTIVE AGENTS</div>';
  } else {
    agGrid.innerHTML = agents.map(ag => {
      const st = (ag.status || 'IDLE').toUpperCase();
      return `<div class="oc-agent-card ${st}">
        <div class="oc-agent-label">${ag.label || ag.id}</div>
        <div class="oc-agent-model">${ag.model || '--'}</div>
        <span class="oc-agent-status ${st}">${st}</span>
        <div class="oc-agent-ctx">IN:${numFmt(ag.tokensIn||0)} OUT:${numFmt(ag.tokensOut||0)}</div>
      </div>`;
    }).join('');
  }
}

// ---- WebSocket ----
let ws;
function connect() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}`);

  ws.onopen = () => {
    addLog('MAGI SYSTEM LINK ESTABLISHED', 'ok');
  };

  ws.onmessage = (evt) => {
    try {
      const { type, payload } = JSON.parse(evt.data);
      if (type === 'sysdata') updateUI(payload);
    } catch(e) {}
  };

  ws.onclose = () => {
    addLog('CONNECTION LOST — RECONNECTING...', 'warn');
    setTimeout(connect, 2000);
  };

  ws.onerror = () => ws.close();
}
connect();

// ---- Main UI Update ----
function updateUI(d) {
  // CPU
  const cpuLoad = parseFloat(d.cpu.load);
  document.getElementById('cpu-load').textContent = cpuLoad.toFixed(1);
  cpuHistory.push(cpuLoad); cpuHistory.shift();
  drawChart(cpuCtx, cpuCanvas, cpuHistory, getSecondaryColor(), 100);

  // CPU cores
  const coreGrid = document.getElementById('core-grid');
  if (d.cpu.cores && d.cpu.cores.length) {
    coreGrid.innerHTML = d.cpu.cores.map((c, i) =>
      `<div class="core-item">C${i}: <span class="secondary">${c}%</span></div>`
    ).join('');
  }

  // Memory
  const memPct = parseFloat(d.memory.percent);
  document.getElementById('mem-percent').textContent = memPct.toFixed(1);
  document.getElementById('mem-bar').style.width = memPct + '%';
  document.getElementById('mem-used').textContent  = (d.memory.used  / 1e9).toFixed(1);
  document.getElementById('mem-free').textContent  = (d.memory.free  / 1e9).toFixed(1);
  document.getElementById('mem-total').textContent = (d.memory.total / 1e9).toFixed(1);
  memHistory.push(memPct); memHistory.shift();
  drawChart(memCtx, memCanvas, memHistory, getPrimaryColor(), 100);

  // Network
  const rx = d.network.rx / 1024;
  const tx = d.network.tx / 1024;
  document.getElementById('net-ip').textContent = d.network.ip;
  document.getElementById('net-rx').textContent = rx.toFixed(1) + ' KB/s';
  document.getElementById('net-tx').textContent = tx.toFixed(1) + ' KB/s';
  const maxNet = Math.max(...netRxHistory, ...netTxHistory, 1);
  netRxHistory.push(rx); netRxHistory.shift();
  netTxHistory.push(tx); netTxHistory.shift();
  // draw both lines on net canvas
  const W = netCanvas.width, H = netCanvas.height;
  netCtx.clearRect(0,0,W,H);
  netCtx.strokeStyle = 'rgba(255,102,0,0.08)';
  for (let i = 0; i < 4; i++) {
    const y = H * i / 4;
    netCtx.beginPath(); netCtx.moveTo(0,y); netCtx.lineTo(W,y); netCtx.stroke();
  }
  [[netRxHistory, getSecondaryColor()],[netTxHistory, getPrimaryColor()]].forEach(([hist, color]) => {
    const step = W / (hist.length - 1);
    netCtx.beginPath();
    netCtx.strokeStyle = color; netCtx.lineWidth = 1.5;
    netCtx.shadowColor = color; netCtx.shadowBlur = 6;
    hist.forEach((v,i) => {
      const x = i*step, y = H - (Math.min(v, maxNet)/maxNet)*H;
      i===0 ? netCtx.moveTo(x,y) : netCtx.lineTo(x,y);
    });
    netCtx.stroke(); netCtx.shadowBlur = 0;
  });

  // Disk
  const diskPct = parseFloat(d.disk.percent);
  document.getElementById('disk-percent').textContent = diskPct.toFixed(1);
  document.getElementById('disk-bar').style.width = diskPct + '%';
  document.getElementById('disk-used').textContent  = (d.disk.used  / 1e9).toFixed(1);
  document.getElementById('disk-total').textContent = (d.disk.total / 1e9).toFixed(1);

  // Uptime
  document.getElementById('uptime').textContent = fmtUptime(d.uptime);

  // Processes
  const tbody = document.getElementById('proc-tbody');
  tbody.innerHTML = (d.processes || []).map(p =>
    `<tr><td>${p.name}</td><td>${p.pid}</td><td class="secondary">${p.cpu}%</td><td>${p.mem}</td></tr>`
  ).join('');

  // OpenClaw
  if (d.openclaw) updateOC(d.openclaw);
}

// ---- Theme + Lang init ----
document.addEventListener('DOMContentLoaded', () => {
  buildThemeSelector();
  applyTheme(currentTheme);

  const langSel = document.getElementById('lang-select');
  langSel.value = currentLang;
  langSel.addEventListener('change', e => setLang(e.target.value));

  applyI18n();
  addLog('NERV MAGI SYSTEM BOOT SEQUENCE COMPLETE', 'ok');
  addLog('OPENCLAW TACTICAL PANEL v2.0 ONLINE', 'ok');
});
