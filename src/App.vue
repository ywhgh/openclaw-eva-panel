<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import ChannelIcon from '@/components/ChannelIcon.vue';
import HeaderBar from '@/components/HeaderBar.vue';
import LineChart from '@/components/LineChart.vue';
import LogPanel from '@/components/LogPanel.vue';
import NervAdminModal from '@/components/NervAdminModal.vue';
import PanelShell from '@/components/PanelShell.vue';
import { useDashboard } from '@/composables/useDashboard';
import { useI18n } from '@/composables/useI18n';
import { useTheme } from '@/composables/useTheme';
import { fmtUptime, gb, numFmt } from '@/utils/format';

const { currentTheme, applyTheme } = useTheme();
const { t } = useI18n();
const { snapshot, meta, histories, logs, addLog } = useDashboard();

const booting = ref(true);
const modalOpen = ref(false);
let bootTimer: number | undefined;

const cpuLoad = computed(() => Number.parseFloat(snapshot.value.cpu.load || '0'));
const memoryPercent = computed(() => Number.parseFloat(snapshot.value.memory.percent || '0'));
const diskPercent = computed(() => Number.parseFloat(snapshot.value.disk.percent || '0'));
const netRx = computed(() => (snapshot.value.network.rx || 0) / 1024);
const netTx = computed(() => (snapshot.value.network.tx || 0) / 1024);
const netMax = computed(() => Math.max(...histories.netRx, ...histories.netTx, 1));
const modelUsageTotal = computed(() => meta.value.modelUsage.reduce((sum, item) => sum + item.count, 0) || 1);

function modelUsageWidth(count: number): string {
  return `${Math.max(8, Math.round((count / modelUsageTotal.value) * 100))}%`;
}

function openAdmin(): void {
  modalOpen.value = true;
  document.body.style.overflow = 'hidden';
  addLog('NERV ADMIN WINDOW OPENED', 'ok');
}

function closeAdmin(): void {
  modalOpen.value = false;
  document.body.style.overflow = '';
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && modalOpen.value) closeAdmin();
}

onMounted(() => {
  applyTheme(currentTheme.value);
  document.addEventListener('keydown', handleKeydown);
  bootTimer = window.setTimeout(() => {
    booting.value = false;
  }, 1200);
});

onBeforeUnmount(() => {
  if (bootTimer) window.clearTimeout(bootTimer);
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <div :class="{ booting, ready: !booting }">
    <div class="boot-overlay" :class="{ hidden: !booting }">
      <div>
        <div class="boot-mark">NERV</div>
        <div class="boot-line">{{ t('boot.line') }}</div>
      </div>
    </div>

    <div class="scanlines" />
    <div class="container">
      <HeaderBar :modal-open="modalOpen" @open-admin="openAdmin" />

      <div class="row reveal reveal-2">
        <PanelShell :title="t('cpu.title')" :critical="cpuLoad > 85">
          <div class="big-value"><span>{{ cpuLoad.toFixed(1) }}</span><span class="unit">%</span></div>
          <div class="label">{{ t('cpu.label') }}</div>
          <LineChart :series="[histories.cpu]" :colors="['--secondary']" :max="100" />
          <div class="core-grid">
            <div v-for="(core, index) in snapshot.cpu.cores" :key="index" class="core-item">
              C{{ index }}: <span class="secondary">{{ core }}%</span>
            </div>
          </div>
        </PanelShell>

        <PanelShell :title="t('mem.title')" :critical="memoryPercent > 85">
          <div class="big-value"><span>{{ memoryPercent.toFixed(1) }}</span><span class="unit">%</span></div>
          <div class="label">{{ t('mem.label') }}</div>
          <div class="bar-container"><div class="bar" :style="{ width: `${memoryPercent}%` }" /></div>
          <div class="mem-details">
            <span>{{ t('mem.used') }}: <span>{{ gb(snapshot.memory.used) }}</span> GB</span>
            <span>{{ t('mem.free') }}: <span>{{ gb(snapshot.memory.free) }}</span> GB</span>
            <span>{{ t('mem.total') }}: <span>{{ gb(snapshot.memory.total) }}</span> GB</span>
          </div>
          <LineChart :series="[histories.memory]" :colors="['--primary']" :max="100" />
        </PanelShell>

        <PanelShell :title="t('net.title')">
          <div class="net-ip">{{ t('net.iface') }}: <span class="secondary">{{ snapshot.network.iface || '--' }}</span></div>
          <div class="net-ip">IP: <span class="secondary">{{ snapshot.network.ip || '--' }}</span></div>
          <div class="net-stats">
            <div>↓ {{ t('net.rx') }}: <span class="secondary">{{ netRx.toFixed(1) }} KB/s</span></div>
            <div>↑ {{ t('net.tx') }}: <span class="primary">{{ netTx.toFixed(1) }} KB/s</span></div>
          </div>
          <LineChart :series="[histories.netRx, histories.netTx]" :colors="['--secondary', '--primary']" :max="netMax" />
        </PanelShell>

        <PanelShell :title="t('disk.title')" :critical="diskPercent > 90">
          <div class="big-value"><span>{{ diskPercent.toFixed(1) }}</span><span class="unit">%</span></div>
          <div class="bar-container"><div class="bar orange" :style="{ width: `${diskPercent}%` }" /></div>
          <div class="mem-details">
            <span>{{ t('disk.used') }}: <span>{{ gb(snapshot.disk.used) }}</span> GB</span>
            <span>{{ t('disk.total') }}: <span>{{ gb(snapshot.disk.total) }}</span> GB</span>
          </div>
          <div class="uptime-box">{{ t('uptime') }}: <span class="secondary">{{ fmtUptime(snapshot.uptime || 0) }}</span></div>
        </PanelShell>
      </div>

      <div class="row reveal reveal-3">
        <PanelShell :title="t('oc.title')" wide>
          <div class="oc-grid">
            <div class="oc-stat-block emphasis">
              <div class="oc-label">{{ t('oc.currentRuntimeModel') }}</div>
              <div class="oc-value">{{ meta.currentModel.id || '--' }}</div>
              <div class="subline">{{ meta.currentModel.alias || '--' }}</div>
            </div>
            <div class="oc-stat-block">
              <div class="oc-label">{{ t('oc.defaultModel') }}</div>
              <div class="oc-value secondary">{{ meta.currentModel.defaultModel || '--' }}</div>
            </div>
            <div class="oc-stat-block">
              <div class="oc-label">{{ t('oc.sessionCount') }}</div>
              <div class="oc-value primary">{{ meta.sessions.length }}</div>
            </div>
            <div class="oc-stat-block">
              <div class="oc-label">{{ t('oc.installedModelCount') }}</div>
              <div class="oc-value secondary">{{ meta.installedModels.length }}</div>
            </div>
          </div>

          <div class="section-subtitle">{{ t('oc.modelDistribution') }}</div>
          <div class="usage-grid">
            <div v-for="item in meta.modelUsage" :key="item.id" class="usage-card">
              <div class="usage-head">
                <div>
                  <div class="usage-name">{{ item.name }}</div>
                  <div class="usage-full">{{ item.fullId }}</div>
                </div>
                <div class="usage-count">{{ item.count }}</div>
              </div>
              <div class="usage-bar-wrap"><div class="usage-bar" :style="{ width: modelUsageWidth(item.count) }" /></div>
            </div>
          </div>
        </PanelShell>

        <PanelShell :title="t('channels.title')" wide>
          <div class="operators-grid">
            <div
              v-for="channel in meta.channels"
              :key="channel.id"
              class="operator-card channel-card"
              :class="channel.enabled ? 'status-ACTIVE' : 'status-ERROR'"
            >
              <div class="channel-top">
                <ChannelIcon :id="channel.id" />
                <div>
                  <div class="op-name">{{ channel.name }}</div>
                  <div class="op-role">{{ channel.id }}</div>
                </div>
              </div>
              <span class="op-status" :class="channel.enabled ? 'ACTIVE' : 'ERROR'">{{ channel.status }}</span>
              <div class="op-sync-label">{{ t('channel.detail') }}</div>
              <div class="op-name-jp">{{ channel.detail || '--' }}</div>
            </div>
          </div>
        </PanelShell>
      </div>

      <div class="row reveal reveal-4">
        <PanelShell :title="t('sessions.title')" wide>
          <div class="session-grid">
            <div v-for="session in meta.sessions" :key="session.id" class="session-card" :class="{ current: session.isCurrent }">
              <div class="session-header">
                <div class="oc-agent-label">{{ session.label }}</div>
                <div class="session-time">{{ new Date(session.updatedAt).toLocaleString() }}</div>
              </div>
              <div class="session-badges">
                <span v-if="session.isCurrent" class="op-status ACTIVE">CURRENT</span>
                <span class="op-status ACTIVE">{{ session.provider || 'active' }}</span>
              </div>
              <div class="oc-agent-model">{{ session.model || '--' }}</div>
              <div class="oc-agent-ctx">IN:{{ numFmt(session.tokensIn || 0) }} OUT:{{ numFmt(session.tokensOut || 0) }}</div>
              <div class="session-preview">{{ session.preview || '--' }}</div>
            </div>
          </div>
        </PanelShell>

        <PanelShell :title="t('models.title')" wide>
          <div class="model-list">
            <div v-for="model in meta.installedModels" :key="model.id" class="model-card">
              <div class="model-title">{{ model.alias || model.name || model.id }}</div>
              <div class="model-sub">{{ model.id }}</div>
              <div class="memory-meta">{{ t('model.context') }}: {{ numFmt(model.contextWindow || 0) }}</div>
              <div class="memory-meta">Max Tokens: {{ numFmt(model.maxTokens || 0) }}</div>
              <div class="memory-meta">{{ t('model.reasoning') }}: {{ model.reasoning ? t('common.yes') : t('common.no') }}</div>
            </div>
          </div>
        </PanelShell>
      </div>

      <div class="row reveal reveal-5">
        <PanelShell :title="t('proc.title')" wide>
          <table class="proc-table">
            <thead>
              <tr>
                <th>{{ t('proc.name') }}</th>
                <th>{{ t('proc.pid') }}</th>
                <th>{{ t('proc.cpu') }}</th>
                <th>{{ t('proc.mem') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="process in snapshot.processes" :key="process.pid">
                <td>{{ process.name }}</td>
                <td>{{ process.pid }}</td>
                <td class="secondary">{{ process.cpu }}%</td>
                <td>{{ process.mem }}</td>
              </tr>
            </tbody>
          </table>
        </PanelShell>

        <PanelShell :title="`${t('log.title')} // ${t('log.live')}`" wide>
          <LogPanel :logs="logs" />
        </PanelShell>
      </div>
    </div>

    <NervAdminModal :open="modalOpen" :meta="meta" @close="closeAdmin" />
  </div>
</template>
