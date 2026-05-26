<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import LongMemoryView from '@/components/LongMemoryView.vue';
import type { DashboardMeta } from '@/types/dashboard';

const props = defineProps<{
  open: boolean;
  meta: DashboardMeta;
}>();

const emit = defineEmits<{
  close: [];
}>();

type AdminPanel = 'core' | 'route' | 'memory' | 'ops';

const activePanel = ref<AdminPanel>('memory');

const navItems: Array<{ id: AdminPanel; code: string; title: string; desc: string }> = [
  { id: 'core', code: 'CORE', title: 'System Core', desc: '核心状态与总览' },
  { id: 'route', code: 'ROUTE', title: 'Signal Route', desc: '模型与通道入口' },
  { id: 'memory', code: 'MEMORY', title: 'Long Memory', desc: '长期记忆接口' },
  { id: 'ops', code: 'OPS', title: 'Maintenance', desc: '维护与诊断' },
];

const panelTitle = computed(() => navItems.find(item => item.id === activePanel.value)?.title || 'System Core');

watch(() => props.open, value => {
  if (value) activePanel.value = 'memory';
});
</script>

<template>
  <div v-if="open" class="admin-modal" aria-hidden="false">
    <div class="admin-backdrop" @click="emit('close')" />
    <section class="admin-window animate-crt-open" role="dialog" aria-modal="true" aria-labelledby="admin-window-title">
      <span class="corner corner-tl" />
      <span class="corner corner-tr" />
      <span class="corner corner-bl" />
      <span class="corner corner-br" />

      <aside class="admin-nav">
        <div class="admin-eyebrow">NERV ADMIN</div>
        <h2 id="admin-window-title">CONTROL WINDOW</h2>
        <button
          v-for="item in navItems"
          :key="item.id"
          class="admin-nav-item"
          :class="{ active: activePanel === item.id }"
          type="button"
          @click="activePanel = item.id"
        >
          <span>{{ item.code }}</span>
          <strong>{{ item.title }}</strong>
          <em>{{ item.desc }}</em>
        </button>
      </aside>

      <main class="admin-detail">
        <div class="admin-detail-head">
          <div>
            <div class="admin-eyebrow">MASTER DETAIL</div>
            <h3>{{ panelTitle }}</h3>
          </div>
          <button class="admin-close" type="button" @click="emit('close')">CLOSE</button>
        </div>

        <div v-show="activePanel === 'core'" class="admin-panel active">
          <div class="admin-section-title">SYSTEM CORE</div>
          <ul class="admin-list">
            <li><span>01</span>当前模型：{{ meta.currentModel.id || '--' }}</li>
            <li><span>02</span>活跃会话：{{ meta.sessions.length }} / 已安装模型：{{ meta.installedModels.length }}</li>
            <li><span>03</span>通道数量：{{ meta.channels.length }}，后续可接入权限、快捷维护与安全模式。</li>
          </ul>
        </div>

        <div v-show="activePanel === 'route'" class="admin-panel active">
          <div class="admin-section-title">SIGNAL ROUTE</div>
          <ul class="admin-list">
            <li v-for="channel in meta.channels" :key="channel.id">
              <span>{{ channel.enabled ? 'ON' : 'OFF' }}</span>{{ channel.name }} // {{ channel.detail || channel.status }}
            </li>
            <li v-if="!meta.channels.length"><span>--</span>暂无可展示通道。</li>
          </ul>
        </div>

        <div v-show="activePanel === 'memory'" class="admin-panel active long-memory-panel">
          <LongMemoryView :memory="meta.memory" />
        </div>

        <div v-show="activePanel === 'ops'" class="admin-panel active">
          <div class="admin-section-title">MAINTENANCE</div>
          <ul class="admin-list">
            <li><span>01</span>预留网关重启、日志导出、健康检查入口。</li>
            <li><span>02</span>预留探测任务状态、异常记录和恢复动作。</li>
            <li><span>03</span>后续可接入安全模式和配置审计。</li>
          </ul>
        </div>
      </main>
    </section>
  </div>
</template>
