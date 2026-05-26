<script setup lang="ts">
import LanguageSelector from '@/components/LanguageSelector.vue';
import NervTrigger from '@/components/NervTrigger.vue';
import ThemeSelector from '@/components/ThemeSelector.vue';
import { useClock } from '@/composables/useClock';
import { useI18n } from '@/composables/useI18n';

defineProps<{
  modalOpen: boolean;
}>();

defineEmits<{
  openAdmin: [];
}>();

const { time, date } = useClock();
const { t } = useI18n();
</script>

<template>
  <header class="header reveal reveal-1">
    <div class="header-left">
      <div class="nerv-brand">
        <NervTrigger :expanded="modalOpen" @activate="$emit('openAdmin')" />
        <div class="nerv-logo">NERV</div>
      </div>
      <div class="header-sub">{{ t('nerv.subtitle') }}</div>
    </div>
    <div class="header-center">
      <div class="clock">{{ time }}</div>
      <div class="date">{{ date }}</div>
    </div>
    <div class="header-right">
      <div class="alert-level">{{ t('alert.level') }} <span class="blink red">{{ t('alert.alpha') }}</span></div>
      <div class="status-line">{{ t('monitoring') }}</div>
      <div class="controls-bar">
        <label>{{ t('theme.label') }}</label>
        <ThemeSelector />
        <label>{{ t('lang.label') }}</label>
        <LanguageSelector />
      </div>
    </div>
  </header>
</template>
