export interface CpuData {
  load: string;
  cores: string[];
}

export interface MemoryData {
  total: number;
  used: number;
  free: number;
  percent: string;
}

export interface NetworkData {
  rx: number;
  tx: number;
  ip: string;
  iface: string;
}

export interface DiskData {
  total: number;
  used: number;
  percent: string;
}

export interface ProcessInfo {
  name: string;
  pid: number;
  cpu: string;
  mem: string;
}

export interface ChannelInfo {
  id: string;
  name: string;
  enabled: boolean;
  status: string;
  detail: string;
}

export interface SessionInfo {
  id: string;
  label: string;
  model: string;
  provider: string;
  updatedAt: string;
  tokensIn: number;
  tokensOut: number;
  preview: string;
  status: string;
  isCurrent: boolean;
}

export interface InstalledModel {
  provider: string;
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  api: string;
  alias: string | null;
}

export interface ModelUsage {
  id: string;
  name: string;
  fullId: string;
  count: number;
}

export interface MemoryDigest {
  preferences: string[];
  recentContext: string[];
  projectState: string[];
}

export interface MemoryFile {
  name: string;
  preview: string;
  updatedAt: string;
}

export interface MemoryPanelData {
  longMemoryPreview: string;
  digest: MemoryDigest;
  recentDailyFiles: MemoryFile[];
}

export interface DashboardMeta {
  now: string;
  currentModel: {
    id: string;
    alias: string | null;
    defaultModel: string;
  };
  sessions: SessionInfo[];
  installedModels: InstalledModel[];
  modelUsage: ModelUsage[];
  channels: ChannelInfo[];
  memory: MemoryPanelData;
}

export interface SystemSnapshot {
  time: string;
  cpu: CpuData;
  memory: MemoryData;
  network: NetworkData;
  disk: DiskData;
  uptime: number;
  processes: ProcessInfo[];
  dashboard: DashboardMeta;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'ok' | 'warn' | '';
}
