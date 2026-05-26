<script setup lang="ts">
defineProps<{
  title: string;
  wide?: boolean;
  critical?: boolean;
}>();
</script>

<template>
  <section class="panel" :class="{ wide, critical }">
    <div class="panel-title">⬡ {{ title }}</div>
    <slot />
  </section>
</template>
