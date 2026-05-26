<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  series: number[][];
  colors?: string[];
  max?: number;
}>();

const canvas = ref<HTMLCanvasElement | null>(null);

const normalizedColors = computed(() => props.colors?.length ? props.colors : ['--secondary']);

function cssColor(token: string): string {
  if (!token.startsWith('--')) return token;
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || '#ff6600';
}

function themeGridColor(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--primary-rgb').trim();
  return value ? `rgba(${value},0.08)` : 'rgba(255,102,0,0.08)';
}

function draw(): void {
  const node = canvas.value;
  const ctx = node?.getContext('2d');
  if (!node || !ctx) return;

  const width = node.width;
  const height = node.height;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = themeGridColor();
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = (height * i) / 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const computedMax = props.max ?? Math.max(...props.series.flat(), 1);
  props.series.forEach((items, seriesIndex) => {
    const step = width / Math.max(1, items.length - 1);
    const color = cssColor(normalizedColors.value[seriesIndex] || normalizedColors.value[0]);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    items.forEach((value, index) => {
      const x = index * step;
      const y = height - (Math.min(value, computedMax) / computedMax) * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  });
}

onMounted(draw);
watch(() => [props.series, props.colors, props.max], () => nextTick(draw), { deep: true });
</script>

<template>
  <canvas ref="canvas" width="320" height="80" />
</template>
