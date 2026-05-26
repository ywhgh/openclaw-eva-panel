import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import type { DashboardMeta, LogEntry, SystemSnapshot } from '@/types/dashboard';

const HIST = 60;

function emptyMeta(): DashboardMeta {
  return {
    now: new Date().toISOString(),
    currentModel: { id: '--', alias: null, defaultModel: '--' },
    sessions: [],
    installedModels: [],
    modelUsage: [],
    channels: [],
    memory: {
      longMemoryPreview: '',
      digest: { preferences: [], recentContext: [], projectState: [] },
      recentDailyFiles: [],
    },
  };
}

function emptySnapshot(): SystemSnapshot {
  return {
    time: new Date().toISOString(),
    cpu: { load: '0.0', cores: [] },
    memory: { total: 0, used: 0, free: 0, percent: '0.0' },
    network: { rx: 0, tx: 0, ip: '--', iface: '--' },
    disk: { total: 0, used: 0, percent: '0.0' },
    uptime: 0,
    processes: [],
    dashboard: emptyMeta(),
  };
}

function apiBase(): string {
  return '';
}

function wsBase(): string {
  if (import.meta.env.DEV) return 'ws://127.0.0.1:1312';
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}`;
}

export function useDashboard() {
  const snapshot = ref<SystemSnapshot>(emptySnapshot());
  const logs = ref<LogEntry[]>([]);
  const histories = reactive({
    cpu: Array<number>(HIST).fill(0),
    memory: Array<number>(HIST).fill(0),
    netRx: Array<number>(HIST).fill(0),
    netTx: Array<number>(HIST).fill(0),
  });
  let socket: WebSocket | null = null;
  let reconnectTimer: number | undefined;
  let logId = 0;

  const meta = computed(() => snapshot.value.dashboard || emptyMeta());

  function addLog(message: string, type: LogEntry['type'] = ''): void {
    const entry: LogEntry = {
      id: ++logId,
      timestamp: new Date().toTimeString().slice(0, 8),
      message,
      type,
    };
    logs.value = [...logs.value.slice(-119), entry];
  }

  function pushHistory(key: keyof typeof histories, value: number): void {
    histories[key].push(value);
    histories[key].shift();
  }

  function applySnapshot(next: SystemSnapshot): void {
    snapshot.value = next;
    pushHistory('cpu', Number.parseFloat(next.cpu.load || '0'));
    pushHistory('memory', Number.parseFloat(next.memory.percent || '0'));
    pushHistory('netRx', (next.network.rx || 0) / 1024);
    pushHistory('netTx', (next.network.tx || 0) / 1024);
  }

  async function loadInitialMeta(): Promise<void> {
    try {
      const res = await fetch(`${apiBase()}/api/dashboard/meta`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const dashboard = await res.json() as DashboardMeta;
      snapshot.value = { ...snapshot.value, dashboard };
      addLog('Initial dashboard meta loaded', 'ok');
    } catch (error) {
      addLog(`Initial meta load failed: ${(error as Error).message}`, 'warn');
    }
  }

  function connect(): void {
    socket = new WebSocket(wsBase());
    socket.onopen = () => addLog('MAGI SYSTEM LINK ESTABLISHED', 'ok');
    socket.onmessage = event => {
      try {
        const message = JSON.parse(String(event.data)) as { type?: string; payload?: SystemSnapshot };
        if (message.type === 'sysdata' && message.payload) applySnapshot(message.payload);
      } catch (error) {
        addLog(`Parse error: ${(error as Error).message}`, 'warn');
      }
    };
    socket.onclose = () => {
      addLog('CONNECTION LOST - RECONNECTING...', 'warn');
      reconnectTimer = window.setTimeout(connect, 2000);
    };
    socket.onerror = () => socket?.close();
  }

  onMounted(async () => {
    await loadInitialMeta();
    connect();
    addLog('OPENCLAW EVA PANEL ONLINE', 'ok');
  });

  onUnmounted(() => {
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    socket?.close();
  });

  return {
    snapshot,
    meta,
    histories,
    logs,
    addLog,
  };
}
