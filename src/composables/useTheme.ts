import { computed, ref } from 'vue';
import type { ThemeDefinition, ThemeName } from '@/types/theme';

export const themes: Record<ThemeName, ThemeDefinition> = {
  'nerv-orange': {
    label: 'NERV // ORANGE',
    vars: {
      '--primary': '#ff6600',
      '--primary-rgb': '255,102,0',
      '--secondary': '#00ff41',
      '--secondary-rgb': '0,255,65',
      '--danger': '#ff0000',
      '--danger-rgb': '255,0,0',
      '--dim-primary': '#993d00',
      '--dim-secondary': '#006617',
      '--bg': '#000000',
      '--panel-bg': 'rgba(5,5,5,.92)',
      '--panel-rgb': '5,5,5',
      '--text': '#ff6600',
      '--glow': 'rgba(255,102,0,0.18)',
      '--scanline': 'rgba(0,0,0,0.15)',
    },
  },
  'magi-green': {
    label: 'MAGI // GREEN',
    vars: {
      '--primary': '#00ff41',
      '--primary-rgb': '0,255,65',
      '--secondary': '#00cfff',
      '--secondary-rgb': '0,207,255',
      '--danger': '#ff4444',
      '--danger-rgb': '255,68,68',
      '--dim-primary': '#006617',
      '--dim-secondary': '#005f7a',
      '--bg': '#000000',
      '--panel-bg': 'rgba(1,10,3,.92)',
      '--panel-rgb': '1,10,3',
      '--text': '#00ff41',
      '--glow': 'rgba(0,255,65,0.15)',
      '--scanline': 'rgba(0,0,0,0.13)',
    },
  },
  'gehirn-blue': {
    label: 'GEHIRN // BLUE',
    vars: {
      '--primary': '#00cfff',
      '--primary-rgb': '0,207,255',
      '--secondary': '#a259ff',
      '--secondary-rgb': '162,89,255',
      '--danger': '#ff4444',
      '--danger-rgb': '255,68,68',
      '--dim-primary': '#005f7a',
      '--dim-secondary': '#4a1a8a',
      '--bg': '#000408',
      '--panel-bg': 'rgba(1,8,16,.92)',
      '--panel-rgb': '1,8,16',
      '--text': '#00cfff',
      '--glow': 'rgba(0,207,255,0.15)',
      '--scanline': 'rgba(0,0,0,0.13)',
    },
  },
  'seele-white': {
    label: 'SEELE // WHITE',
    vars: {
      '--primary': '#cccccc',
      '--primary-rgb': '204,204,204',
      '--secondary': '#888888',
      '--secondary-rgb': '136,136,136',
      '--danger': '#ff4444',
      '--danger-rgb': '255,68,68',
      '--dim-primary': '#666666',
      '--dim-secondary': '#444444',
      '--bg': '#0a0a0a',
      '--panel-bg': 'rgba(17,17,17,.92)',
      '--panel-rgb': '17,17,17',
      '--text': '#cccccc',
      '--glow': 'rgba(200,200,200,0.08)',
      '--scanline': 'rgba(0,0,0,0.10)',
    },
  },
  'adam-red': {
    label: 'ADAM // RED',
    vars: {
      '--primary': '#ff2244',
      '--primary-rgb': '255,34,68',
      '--secondary': '#ff8800',
      '--secondary-rgb': '255,136,0',
      '--danger': '#ffffff',
      '--danger-rgb': '255,255,255',
      '--dim-primary': '#7a0018',
      '--dim-secondary': '#7a3d00',
      '--bg': '#050000',
      '--panel-bg': 'rgba(10,0,0,.92)',
      '--panel-rgb': '10,0,0',
      '--text': '#ff2244',
      '--glow': 'rgba(255,34,68,0.18)',
      '--scanline': 'rgba(0,0,0,0.15)',
    },
  },
  'lilith-purple': {
    label: 'LILITH // PURPLE',
    vars: {
      '--primary': '#cc44ff',
      '--primary-rgb': '204,68,255',
      '--secondary': '#ff44aa',
      '--secondary-rgb': '255,68,170',
      '--danger': '#ff4444',
      '--danger-rgb': '255,68,68',
      '--dim-primary': '#5a0080',
      '--dim-secondary': '#7a1050',
      '--bg': '#030005',
      '--panel-bg': 'rgba(8,0,16,.92)',
      '--panel-rgb': '8,0,16',
      '--text': '#cc44ff',
      '--glow': 'rgba(204,68,255,0.15)',
      '--scanline': 'rgba(0,0,0,0.13)',
    },
  },
};

const defaultTheme: ThemeName = 'nerv-orange';
const storedTheme = localStorage.getItem('eva-theme') as ThemeName | null;
const currentTheme = ref<ThemeName>(storedTheme && themes[storedTheme] ? storedTheme : defaultTheme);

function applyTheme(name: ThemeName): void {
  const theme = themes[name];
  currentTheme.value = name;
  localStorage.setItem('eva-theme', name);
  document.documentElement.dataset.theme = name;
  Object.entries(theme.vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}

export function useTheme() {
  const themeOptions = computed(() => Object.entries(themes).map(([value, theme]) => ({
    value: value as ThemeName,
    label: theme.label,
  })));

  const currentThemeLabel = computed(() => themes[currentTheme.value].label);

  return {
    currentTheme,
    currentThemeLabel,
    themeOptions,
    applyTheme,
  };
}
