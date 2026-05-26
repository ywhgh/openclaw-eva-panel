<script setup lang="ts">
import ControlDropdown from '@/components/ControlDropdown.vue';
import { useTheme } from '@/composables/useTheme';
import type { ThemeName } from '@/types/theme';

const { currentTheme, currentThemeLabel, themeOptions, applyTheme } = useTheme();

function updateTheme(value: string): void {
  applyTheme(value as ThemeName);
}
</script>

<template>
  <ControlDropdown
    :model-value="currentTheme"
    :label="currentThemeLabel"
    :options="themeOptions"
    @update:model-value="updateTheme"
  />
</template>
