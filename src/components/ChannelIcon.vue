<script setup lang="ts">
defineProps<{
  id: string;
}>();

const map: Record<string, string> = {
  feishu: 'F',
  qqbot: 'Q',
  wecom: 'W',
  'openclaw-weixin': 'WX',
  'openclaw-qqbot': 'OQ',
  'wecom-openclaw-plugin': 'WP',
};
</script>

<template>
  <div class="channel-icon">{{ map[id] || '⬡' }}</div>
</template>
