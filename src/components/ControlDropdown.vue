<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

interface DropdownOption {
  value: string;
  label: string;
}

const props = defineProps<{
  modelValue: string;
  label: string;
  options: DropdownOption[];
  narrow?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const isOpen = ref(false);
const root = ref<HTMLElement | null>(null);

function selectOption(value: string): void {
  emit('update:modelValue', value);
  isOpen.value = false;
}

function handleDocumentClick(event: MouseEvent): void {
  if (!root.value?.contains(event.target as Node)) isOpen.value = false;
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') isOpen.value = false;
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div ref="root" class="ctrl-dropdown" :class="{ open: isOpen, 'ctrl-dropdown-narrow': props.narrow }">
    <button
      class="ctrl-dropdown-trigger"
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      @click.stop="isOpen = !isOpen"
    >
      <span>{{ label }}</span>
      <span class="ctrl-chevron" aria-hidden="true">▼</span>
    </button>
    <div v-if="isOpen" class="ctrl-dropdown-menu" role="listbox">
      <button
        v-for="option in options"
        :key="option.value"
        class="ctrl-dropdown-option"
        :class="{ active: option.value === modelValue }"
        type="button"
        role="option"
        :aria-selected="option.value === modelValue"
        @click.stop="selectOption(option.value)"
      >
        <span>{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>
