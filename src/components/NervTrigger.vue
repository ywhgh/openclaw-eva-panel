<script setup lang="ts">
defineProps<{
  expanded: boolean;
}>();

defineEmits<{
  activate: [];
}>();
</script>

<template>
  <button
    class="nerv-trigger"
    type="button"
    aria-label="Open NERV admin window"
    aria-haspopup="dialog"
    :aria-expanded="expanded"
    @click="$emit('activate')"
  >
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <polygon class="hex-outer" points="50 5 89 27.5 89 72.5 50 95 11 72.5 11 27.5" />
      <polygon class="hex-inner" points="50 18 77 34 77 66 50 82 23 66 23 34" />
    </svg>
    <span class="energy-sweep" />
  </button>
</template>
