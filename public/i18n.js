const LANGS = {
  'zh-en': {
    'boot.line': 'MAGI SYSTEM BOOTING // OPENCLAW LINK START',
    'alert.level': '警戒等级 / ALERT',
    'alert.alpha': 'ALPHA',
    'monitoring': '全系统监视中 / MONITORING',
    'nerv.subtitle': 'MAGI SYSTEM // OPENCLAW 战术面板',
    'theme.label': '主题 / THEME',
    'lang.label': '语言 / LANG',
    'cpu.title': '⬡ CPU // 中央处理器 / CPU',
    'cpu.label': '处理器负载 / LOAD',
    'mem.title': '⬡ MEMORY // 内存使用率 / MEMORY',
    'mem.label': '内存利用率 / UTILIZATION',
    'mem.used': '已用 / USED',
    'mem.free': '空闲 / FREE',
    'mem.total': '总计 / TOTAL',
    'net.title': '⬡ NETWORK // 网络接口 / NETWORK',
    'net.iface': '网卡 / IFACE',
    'net.rx': '下行 / RX',
    'net.tx': '上行 / TX',
    'disk.title': '⬡ DISK // 存储系统 / DISK',
    'disk.used': '已用 / USED',
    'disk.total': '总计 / TOTAL',
    'uptime': '运行时间 / UPTIME',
    'oc.title': '⬡ OPENCLAW // 智能核心 / CORE',
    'oc.currentRuntimeModel': '当前运行模型 / RUNTIME MODEL',
    'oc.defaultModel': '默认模型 / DEFAULT MODEL',
    'oc.sessionCount': '活跃会话 / SESSIONS',
    'oc.installedModelCount': '已装模型 / MODELS',
    'oc.modelDistribution': '模型用量分布 / MODEL DISTRIBUTION',
    'channels.title': '⬡ COMM CHANNELS // 通讯工具状态',
    'sessions.title': '⬡ SESSION STREAM // 实时会话信息',
    'models.title': '⬡ INSTALLED MODELS // 已安装模型',
    'memory.title': '⬡ LONG MEMORY // 长记忆',
    'memory.long': '长期记忆摘要 / LONG MEMORY',
    'memory.daily': '最近记忆文件 / RECENT FILES',
    'proc.title': '⬡ TOP PROCESSES // 进程监视',
    'proc.name': '名称 / NAME',
    'proc.pid': 'PID',
    'proc.cpu': 'CPU%',
    'proc.mem': '内存(MB) / MEM',
    'log.title': '⬡ SYSTEM LOG // 系统日志',
    'log.live': '实时 / LIVE',
    'session.preview': '最近内容 / PREVIEW',
    'session.updated': '更新时间 / UPDATED',
    'channel.detail': '详情 / DETAIL',
    'model.context': '上下文 / CONTEXT',
    'model.reasoning': '推理 / REASONING',
    'common.enabled': '已启用 / ENABLED',
    'common.disabled': '未启用 / DISABLED',
    'common.online': '在线 / ONLINE',
    'common.offline': '离线 / OFFLINE',
    'common.yes': '是 / YES',
    'common.no': '否 / NO'
  },
  'ja-en': {
    'boot.line': 'MAGI SYSTEM BOOTING // OPENCLAW LINK START',
    'alert.level': '警戒レベル / ALERT',
    'alert.alpha': 'ALPHA',
    'monitoring': '全システム監視中 / MONITORING',
    'nerv.subtitle': 'MAGI SYSTEM // OPENCLAW 戦術パネル',
    'theme.label': 'テーマ / THEME',
    'lang.label': '言語 / LANG',
    'cpu.title': '⬡ CPU // 中央処理装置 / CPU',
    'cpu.label': 'プロセッサ負荷 / LOAD',
    'mem.title': '⬡ MEMORY // メモリ使用率 / MEMORY',
    'mem.label': 'メモリ使用率 / UTILIZATION',
    'mem.used': '使用中 / USED',
    'mem.free': '空き / FREE',
    'mem.total': '合計 / TOTAL',
    'net.title': '⬡ NETWORK // ネットワーク / NETWORK',
    'net.iface': 'IF / IFACE',
    'net.rx': '受信 / RX',
    'net.tx': '送信 / TX',
    'disk.title': '⬡ DISK // ストレージ / DISK',
    'disk.used': '使用中 / USED',
    'disk.total': '合計 / TOTAL',
    'uptime': '稼働時間 / UPTIME',
    'oc.title': '⬡ OPENCLAW // インテリジェントコア / CORE',
    'oc.currentRuntimeModel': '現在の実行モデル / RUNTIME MODEL',
    'oc.defaultModel': 'デフォルトモデル / DEFAULT MODEL',
    'oc.sessionCount': 'アクティブ会話 / SESSIONS',
    'oc.installedModelCount': '導入済みモデル / MODELS',
    'oc.modelDistribution': 'モデル使用分布 / MODEL DISTRIBUTION',
    'channels.title': '⬡ COMM CHANNELS // 通信ツール状態',
    'sessions.title': '⬡ SESSION STREAM // リアルタイム会話情報',
    'models.title': '⬡ INSTALLED MODELS // 導入済みモデル',
    'memory.title': '⬡ LONG MEMORY // 長期記憶',
    'memory.long': '長期記憶サマリー / LONG MEMORY',
    'memory.daily': '最近の記憶ファイル / RECENT FILES',
    'proc.title': '⬡ TOP PROCESSES // プロセス監視',
    'proc.name': '名前 / NAME',
    'proc.pid': 'PID',
    'proc.cpu': 'CPU%',
    'proc.mem': 'メモリ(MB) / MEM',
    'log.title': '⬡ SYSTEM LOG // システムログ',
    'log.live': 'リアルタイム / LIVE',
    'session.preview': '最近内容 / PREVIEW',
    'session.updated': '更新時刻 / UPDATED',
    'channel.detail': '詳細 / DETAIL',
    'model.context': 'コンテキスト / CONTEXT',
    'model.reasoning': '推論 / REASONING',
    'common.enabled': '有効 / ENABLED',
    'common.disabled': '無効 / DISABLED',
    'common.online': 'オンライン / ONLINE',
    'common.offline': 'オフライン / OFFLINE',
    'common.yes': 'はい / YES',
    'common.no': 'いいえ / NO'
  },
  'en-zh': {
    'boot.line': 'MAGI SYSTEM BOOTING // OPENCLAW LINK START',
    'alert.level': 'ALERT / 警戒等级',
    'alert.alpha': 'ALPHA',
    'monitoring': 'MONITORING / 全系统监视中',
    'nerv.subtitle': 'MAGI SYSTEM // OPENCLAW TACTICAL PANEL',
    'theme.label': 'THEME / 主题',
    'lang.label': 'LANG / 语言',
    'cpu.title': '⬡ CPU // Processor / 中央处理器',
    'cpu.label': 'Processor Load / 处理器负载',
    'mem.title': '⬡ MEMORY // Utilization / 内存使用率',
    'mem.label': 'Memory Utilization / 内存利用率',
    'mem.used': 'Used / 已用',
    'mem.free': 'Free / 空闲',
    'mem.total': 'Total / 总计',
    'net.title': '⬡ NETWORK // Interface / 网络接口',
    'net.iface': 'Interface / 网卡',
    'net.rx': 'Down / 下行',
    'net.tx': 'Up / 上行',
    'disk.title': '⬡ DISK // Storage / 存储系统',
    'disk.used': 'Used / 已用',
    'disk.total': 'Total / 总计',
    'uptime': 'Uptime / 运行时间',
    'oc.title': '⬡ OPENCLAW // Core / 智能核心',
    'oc.currentRuntimeModel': 'Runtime Model / 当前运行模型',
    'oc.defaultModel': 'Default Model / 默认模型',
    'oc.sessionCount': 'Sessions / 活跃会话',
    'oc.installedModelCount': 'Installed Models / 已装模型',
    'oc.modelDistribution': 'Model Distribution / 模型分布',
    'channels.title': '⬡ COMM CHANNELS // Tool Status / 通讯工具状态',
    'sessions.title': '⬡ SESSION STREAM // Realtime Sessions / 实时会话',
    'models.title': '⬡ INSTALLED MODELS // Installed Models / 已安装模型',
    'memory.title': '⬡ LONG MEMORY // Memory / 长记忆',
    'memory.long': 'Long Memory / 长期记忆摘要',
    'memory.daily': 'Recent Files / 最近记忆文件',
    'proc.title': '⬡ TOP PROCESSES // Monitoring / 进程监视',
    'proc.name': 'Name / 名称',
    'proc.pid': 'PID',
    'proc.cpu': 'CPU%',
    'proc.mem': 'MEM / 内存(MB)',
    'log.title': '⬡ SYSTEM LOG // Log / 系统日志',
    'log.live': 'LIVE / 实时',
    'session.preview': 'Preview / 最近内容',
    'session.updated': 'Updated / 更新时间',
    'channel.detail': 'Detail / 详情',
    'model.context': 'Context / 上下文',
    'model.reasoning': 'Reasoning / 推理',
    'common.enabled': 'Enabled / 已启用',
    'common.disabled': 'Disabled / 未启用',
    'common.online': 'Online / 在线',
    'common.offline': 'Offline / 离线',
    'common.yes': 'Yes / 是',
    'common.no': 'No / 否'
  }
};

const LANG_OPTIONS = {
  'zh-en': '中文 / EN',
  'ja-en': '日本語 / EN',
  'en-zh': 'EN / 中文'
};
let currentLang = localStorage.getItem('eva-lang') || 'zh-en';
if (!LANGS[currentLang]) currentLang = 'zh-en';

function t(key) {
  return (LANGS[currentLang] && LANGS[currentLang][key]) || key;
}

function setLang(lang) {
  if (!LANGS[lang]) return;
  currentLang = lang;
  localStorage.setItem('eva-lang', lang);
  applyI18n();
  syncLanguageSelector();
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  syncLanguageSelector();
}

function closeLanguageSelector() {
  const root = document.getElementById('lang-select');
  if (!root) return;
  root.classList.remove('open');
  root.querySelector('[data-dropdown-trigger]')?.setAttribute('aria-expanded', 'false');
}

function closeOtherLanguageDropdowns(activeRoot) {
  document.querySelectorAll('[data-control-dropdown].open').forEach(dropdown => {
    if (dropdown !== activeRoot) {
      dropdown.classList.remove('open');
      dropdown.querySelector('[data-dropdown-trigger]')?.setAttribute('aria-expanded', 'false');
    }
  });
}

function syncLanguageSelector() {
  const root = document.getElementById('lang-select');
  if (!root) return;

  const label = root.querySelector('[data-dropdown-label]');
  if (label) label.textContent = LANG_OPTIONS[currentLang] || currentLang;

  root.querySelectorAll('[data-lang-value]').forEach(option => {
    const active = option.dataset.langValue === currentLang;
    option.classList.toggle('active', active);
    option.setAttribute('aria-selected', active ? 'true' : 'false');
  });
}

function buildLanguageSelector() {
  const root = document.getElementById('lang-select');
  if (!root) return;

  root.innerHTML = `
    <button class="ctrl-dropdown-trigger" type="button" data-dropdown-trigger aria-haspopup="listbox" aria-expanded="false">
      <span data-dropdown-label>${LANG_OPTIONS[currentLang] || currentLang}</span>
      <span class="ctrl-chevron" aria-hidden="true">▼</span>
    </button>
    <div class="ctrl-dropdown-menu" role="listbox">
      ${Object.entries(LANG_OPTIONS).map(([value, label]) => `
        <button class="ctrl-dropdown-option" type="button" role="option" data-lang-value="${value}">
          <span>${label}</span>
        </button>
      `).join('')}
    </div>
  `;

  const trigger = root.querySelector('[data-dropdown-trigger]');
  trigger.addEventListener('click', event => {
    event.stopPropagation();
    const nextOpen = !root.classList.contains('open');
    closeOtherLanguageDropdowns(root);
    root.classList.toggle('open', nextOpen);
    trigger.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
  });

  root.querySelectorAll('[data-lang-value]').forEach(option => {
    option.addEventListener('click', event => {
      event.stopPropagation();
      setLang(option.dataset.langValue);
      closeLanguageSelector();
    });
  });

  document.addEventListener('click', event => {
    if (!root.contains(event.target)) closeLanguageSelector();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeLanguageSelector();
  });

  syncLanguageSelector();
}
