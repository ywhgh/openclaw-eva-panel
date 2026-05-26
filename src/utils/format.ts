export function fmtUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export function numFmt(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value || 0);
}

export function gb(value: number): string {
  return ((value || 0) / 1e9).toFixed(1);
}

export function summarizeMemoryText(text: string): string {
  return String(text || '')
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 12)
    .join('\n');
}
