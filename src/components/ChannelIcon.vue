<script setup lang="ts">
defineProps<{
  id: string;
}>();

const map: Record<string, string> = {
  feishu: '📘',
  qqbot: '🐧',
  wecom: '💼',
  'openclaw-weixin': '💬',
  'openclaw-qqbot': '🛰️',
  'wecom-openclaw-plugin': '🧩',
};
</script>

<template>
  <div class="channel-icon">{{ map[id] || '⬡' }}</div>
</template>
