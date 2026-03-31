// themes.js - Theme System
const THEMES = {
  'nerv-orange': {
    label: 'NERV // ORANGE',
    vars: {
      '--primary':     '#ff6600',
      '--secondary':   '#00ff41',
      '--danger':      '#ff0000',
      '--dim-primary': '#993d00',
      '--dim-secondary':'#006617',
      '--bg':          '#000000',
      '--panel-bg':    '#050505',
      '--border':      '#ff6600',
      '--text':        '#ff6600',
      '--glow':        'rgba(255,102,0,0.18)',
      '--scanline':    'rgba(0,0,0,0.15)',
    }
  },
  'magi-green': {
    label: 'MAGI // GREEN',
    vars: {
      '--primary':     '#00ff41',
      '--secondary':   '#00cfff',
      '--danger':      '#ff4444',
      '--dim-primary': '#006617',
      '--dim-secondary':'#005f7a',
      '--bg':          '#000000',
      '--panel-bg':    '#010a03',
      '--border':      '#00ff41',
      '--text':        '#00ff41',
      '--glow':        'rgba(0,255,65,0.15)',
      '--scanline':    'rgba(0,0,0,0.13)',
    }
  },
  'gehirn-blue': {
    label: 'GEHIRN // BLUE',
    vars: {
      '--primary':     '#00cfff',
      '--secondary':   '#a259ff',
      '--danger':      '#ff4444',
      '--dim-primary': '#005f7a',
      '--dim-secondary':'#4a1a8a',
      '--bg':          '#000408',
      '--panel-bg':    '#010810',
      '--border':      '#00cfff',
      '--text':        '#00cfff',
      '--glow':        'rgba(0,207,255,0.15)',
      '--scanline':    'rgba(0,0,0,0.13)',
    }
  },
  'seele-white': {
    label: 'SEELE // WHITE',
    vars: {
      '--primary':     '#cccccc',
      '--secondary':   '#888888',
      '--danger':      '#ff4444',
      '--dim-primary': '#666666',
      '--dim-secondary':'#444444',
      '--bg':          '#0a0a0a',
      '--panel-bg':    '#111111',
      '--border':      '#888888',
      '--text':        '#cccccc',
      '--glow':        'rgba(200,200,200,0.08)',
      '--scanline':    'rgba(0,0,0,0.10)',
    }
  },
  'adam-red': {
    label: 'ADAM // RED',
    vars: {
      '--primary':     '#ff2244',
      '--secondary':   '#ff8800',
      '--danger':      '#ffffff',
      '--dim-primary': '#7a0018',
      '--dim-secondary':'#7a3d00',
      '--bg':          '#050000',
      '--panel-bg':    '#0a0000',
      '--border':      '#ff2244',
      '--text':        '#ff2244',
      '--glow':        'rgba(255,34,68,0.18)',
      '--scanline':    'rgba(0,0,0,0.15)',
    }
  },
  'lilith-purple': {
    label: 'LILITH // PURPLE',
    vars: {
      '--primary':     '#cc44ff',
      '--secondary':   '#ff44aa',
      '--danger':      '#ff4444',
      '--dim-primary': '#5a0080',
      '--dim-secondary':'#7a1050',
      '--bg':          '#030005',
      '--panel-bg':    '#080010',
      '--border':      '#cc44ff',
      '--text':        '#cc44ff',
      '--glow':        'rgba(204,68,255,0.15)',
      '--scanline':    'rgba(0,0,0,0.13)',
    }
  },
};

let currentTheme = localStorage.getItem('eva-theme') || 'nerv-orange';

function applyTheme(name) {
  const theme = THEMES[name];
  if (!theme) return;
  currentTheme = name;
  localStorage.setItem('eva-theme', name);
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  // update selector
  const sel = document.getElementById('theme-select');
  if (sel) sel.value = name;
}

function buildThemeSelector() {
  const sel = document.getElementById('theme-select');
  if (!sel) return;
  sel.innerHTML = Object.entries(THEMES).map(([k, v]) =>
    `<option value="${k}">${v.label}</option>`
  ).join('');
  sel.value = currentTheme;
  sel.addEventListener('change', e => applyTheme(e.target.value));
}
