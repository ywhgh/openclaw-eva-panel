<script setup lang="ts">
import ControlDropdown from '@/components/ControlDropdown.vue';
import { useI18n } from '@/composables/useI18n';
import type { LangName } from '@/types/theme';

const { currentLang, currentLangLabel, langOptions, setLang } = useI18n();

function updateLang(value: string): void {
  setLang(value as LangName);
}
</script>

<template>
  <ControlDropdown
    :model-value="currentLang"
    :label="currentLangLabel"
    :options="langOptions"
    narrow
    @update:model-value="updateLang"
  />
</template>
