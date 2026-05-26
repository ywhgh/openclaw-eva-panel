<script setup lang="ts">
import type { MemoryPanelData } from '@/types/dashboard';
import { summarizeMemoryText } from '@/utils/format';

defineProps<{
  memory: MemoryPanelData;
}>();

const digestSections = [
  { key: 'preferences', title: 'Preferences / 偏好' },
  { key: 'recentContext', title: 'Recent Context / 最近上下文' },
  { key: 'projectState', title: 'Project State / 项目状态' },
] as const;
</script>

<template>
  <div class="long-memory-view">
    <section class="memory-shell memory-shell-primary">
      <div class="memory-shell-label">SYSTEM LONG MEMORY // 长期记忆矩阵</div>
      <div class="memory-digest-grid">
        <section v-for="section in digestSections" :key="section.key" class="memory-digest-card">
          <div class="memory-digest-title">{{ section.title }}</div>
          <ul class="memory-digest-list">
            <li v-for="item in memory.digest[section.key].length ? memory.digest[section.key] : ['--']" :key="item">
              {{ item }}
            </li>
          </ul>
        </section>
      </div>
    </section>

    <section class="memory-shell memory-shell-files">
      <div class="memory-shell-label">RECENT MEMORY FILES // 最近记忆文件</div>
      <div class="memory-daily-list">
        <article v-for="item in memory.recentDailyFiles" :key="item.name" class="memory-file-card">
          <div class="memory-file-head">
            <span>{{ item.name }}</span>
            <time>{{ new Date(item.updatedAt).toLocaleString() }}</time>
          </div>
          <pre>{{ summarizeMemoryText(item.preview || '--') }}</pre>
        </article>
        <div v-if="!memory.recentDailyFiles.length" class="memory-empty">
          NO RECENT MEMORY FILES // 暂无最近记忆文件
        </div>
      </div>
    </section>
  </div>
</template>
