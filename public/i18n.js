// i18n.js - Language System
const LANGS = {
  'zh-en': {
    // Header
    'alert.level': '警戒等级',
    'alert.alpha': 'ALPHA',
    'monitoring': '全系统监视中 // MONITORING',
    'nerv.subtitle': 'MAGI SYSTEM // OPENCLAW 战术面板',
    // Panels
    'cpu.title': '⬡ CPU // 中央处理器',
    'cpu.label': '处理器负载',
    'mem.title': '⬡ MEMORY // 内存使用率',
    'mem.label': '内存利用率',
    'mem.used': '已用',
    'mem.free': '空闲',
    'mem.total': '总计',
    'net.title': '⬡ NETWORK // 网络接口',
    'net.rx': '下行',
    'net.tx': '上行',
    'disk.title': '⬡ DISK // 存储系统',
    'uptime': '运行时间',
    // Operators
    'operators.title': '⬡ OPERATOR STATUS // 操作员同步率',
    // Processes
    'proc.title': '⬡ TOP PROCESSES // 进程监视',
    'proc.name': '名称',
    'proc.pid': 'PID',
    'proc.cpu': 'CPU%',
    'proc.mem': '内存(MB)',
    // OpenClaw
    'oc.title': '⬡ OPENCLAW // 智能核心',
    'oc.model': '当前模型',
    'oc.tokens.in': 'Token 输入',
    'oc.tokens.out': 'Token 输出',
    'oc.context': '上下文使用率',
    'oc.context.warn': '⚠ 上下文即将满载',
    'oc.context.crit': '🔴 上下文危险 — 建议立即存档',
    'oc.api.health': 'API 健康状态',
    'oc.api.ok': '正常',
    'oc.api.error': '异常',
    'oc.agents': '⬡ 智能体状态',
    'oc.agent.active': '运行中',
    'oc.agent.idle': '待机',
    'oc.agent.error': '错误',
    'oc.switch.model': '切换模型',
    'oc.repair': '⬡ 一键修复',
    'oc.repair.context': '清理上下文',
    'oc.repair.reconnect': '重连 API',
    'oc.repair.restart': '重启网关',
    'oc.repair.done': '修复完成',
    // Log
    'log.title': '⬡ SYSTEM LOG // 系统日志',
    'log.live': '实时',
    // Theme
    'theme.label': '主题',
    'lang.label': '语言',
  },
  'ja-en': {
    // Header
    'alert.level': '警戒レベル',
    'alert.alpha': 'ALPHA',
    'monitoring': '全システム監視中 // MONITORING',
    'nerv.subtitle': 'MAGI SYSTEM // OPENCLAW TACTICAL PANEL',
    // Panels
    'cpu.title': '⬡ CPU // 中央処理装置',
    'cpu.label': 'PROCESSOR LOAD',
    'mem.title': '⬡ MEMORY // メモリ使用率',
    'mem.label': 'MEMORY UTILIZATION',
    'mem.used': 'USED',
    'mem.free': 'FREE',
    'mem.total': 'TOTAL',
    'net.title': '⬡ NETWORK // ネットワーク',
    'net.rx': 'DOWN',
    'net.tx': 'UP',
    'disk.title': '⬡ DISK // ストレージ',
    'uptime': 'UPTIME',
    // Operators
    'operators.title': '⬡ OPERATOR STATUS // オペレーター同期率',
    // Processes
    'proc.title': '⬡ TOP PROCESSES // プロセス監視',
    'proc.name': 'NAME',
    'proc.pid': 'PID',
    'proc.cpu': 'CPU%',
    'proc.mem': 'MEM(MB)',
    // OpenClaw
    'oc.title': '⬡ OPENCLAW // インテリジェントコア',
    'oc.model': '現在のモデル',
    'oc.tokens.in': 'Token 入力',
    'oc.tokens.out': 'Token 出力',
    'oc.context': 'コンテキスト使用率',
    'oc.context.warn': '⚠ コンテキスト満杯警告',
    'oc.context.crit': '🔴 コンテキスト危機 — 即時保存を推奨',
    'oc.api.health': 'API ヘルス状態',
    'oc.api.ok': '正常',
    'oc.api.error': '異常',
    'oc.agents': '⬡ エージェント状態',
    'oc.agent.active': '稼働中',
    'oc.agent.idle': 'スタンバイ',
    'oc.agent.error': 'エラー',
    'oc.switch.model': 'モデル切替',
    'oc.repair': '⬡ ワンクリック修復',
    'oc.repair.context': 'コンテキスト解放',
    'oc.repair.reconnect': 'API 再接続',
    'oc.repair.restart': 'ゲートウェイ再起動',
    'oc.repair.done': '修復完了',
    // Log
    'log.title': '⬡ SYSTEM LOG // システムログ',
    'log.live': 'LIVE',
    // Theme
    'theme.label': 'テーマ',
    'lang.label': '言語',
  }
};

let currentLang = localStorage.getItem('eva-lang') || 'ja-en';

function t(key) {
  return (LANGS[currentLang] && LANGS[currentLang][key]) || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('eva-lang', lang);
  applyI18n();
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  // Update lang selector
  const sel = document.getElementById('lang-select');
  if (sel) sel.value = currentLang;
}
