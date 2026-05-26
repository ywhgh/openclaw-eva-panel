<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { LogEntry } from '@/types/dashboard';

const props = defineProps<{
  logs: LogEntry[];
}>();

const scroll = ref<HTMLElement | null>(null);

watch(() => props.logs.length, async () => {
  await nextTick();
  if (scroll.value) scroll.value.scrollTop = scroll.value.scrollHeight;
});
</script>

<template>
  <div ref="scroll" class="log-scroll">
    <div v-for="entry in logs" :key="entry.id" class="log-entry">
      <span class="ts">[{{ entry.timestamp }}]</span>
      <span class="msg" :class="entry.type">{{ entry.message }}</span>
    </div>
  </div>
</template>
