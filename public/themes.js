// themes.js - Theme System
const THEMES = {
  'nerv-orange': {
    label: 'NERV // ORANGE',
    vars: {
      '--primary':     '#ff6600',
      '--primary-rgb': '255,102,0',
      '--secondary':   '#00ff41',
      '--secondary-rgb':'0,255,65',
      '--danger':      '#ff0000',
      '--danger-rgb':  '255,0,0',
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
      '--primary-rgb': '0,255,65',
      '--secondary':   '#00cfff',
      '--secondary-rgb':'0,207,255',
      '--danger':      '#ff4444',
      '--danger-rgb':  '255,68,68',
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
      '--primary-rgb': '0,207,255',
      '--secondary':   '#a259ff',
      '--secondary-rgb':'162,89,255',
      '--danger':      '#ff4444',
      '--danger-rgb':  '255,68,68',
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
      '--primary-rgb': '204,204,204',
      '--secondary':   '#888888',
      '--secondary-rgb':'136,136,136',
      '--danger':      '#ff4444',
      '--danger-rgb':  '255,68,68',
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
      '--primary-rgb': '255,34,68',
      '--secondary':   '#ff8800',
      '--secondary-rgb':'255,136,0',
      '--danger':      '#ffffff',
      '--danger-rgb':  '255,255,255',
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
      '--primary-rgb': '204,68,255',
      '--secondary':   '#ff44aa',
      '--secondary-rgb':'255,68,170',
      '--danger':      '#ff4444',
      '--danger-rgb':  '255,68,68',
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
if (!THEMES[currentTheme]) currentTheme = 'nerv-orange';

function applyTheme(name) {
  const theme = THEMES[name];
  if (!theme) return;
  currentTheme = name;
  localStorage.setItem('eva-theme', name);
  const root = document.documentElement;
  root.dataset.theme = name;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  syncThemeSelector();
}

function closeThemeSelector() {
  const root = document.getElementById('theme-select');
  if (!root) return;
  root.classList.remove('open');
  root.querySelector('[data-dropdown-trigger]')?.setAttribute('aria-expanded', 'false');
}

function closeOtherControlDropdowns(activeRoot) {
  document.querySelectorAll('[data-control-dropdown].open').forEach(dropdown => {
    if (dropdown !== activeRoot) {
      dropdown.classList.remove('open');
      dropdown.querySelector('[data-dropdown-trigger]')?.setAttribute('aria-expanded', 'false');
    }
  });
}

function syncThemeSelector() {
  const root = document.getElementById('theme-select');
  if (!root) return;

  const label = root.querySelector('[data-dropdown-label]');
  if (label) label.textContent = THEMES[currentTheme]?.label || currentTheme;

  root.querySelectorAll('[data-theme-value]').forEach(option => {
    const active = option.dataset.themeValue === currentTheme;
    option.classList.toggle('active', active);
    option.setAttribute('aria-selected', active ? 'true' : 'false');
  });
}

function buildThemeSelector() {
  const root = document.getElementById('theme-select');
  if (!root) return;

  root.innerHTML = `
    <button class="ctrl-dropdown-trigger" type="button" data-dropdown-trigger aria-haspopup="listbox" aria-expanded="false">
      <span data-dropdown-label>${THEMES[currentTheme]?.label || currentTheme}</span>
      <span class="ctrl-chevron" aria-hidden="true">▼</span>
    </button>
    <div class="ctrl-dropdown-menu" role="listbox">
      ${Object.entries(THEMES).map(([value, theme]) => `
        <button class="ctrl-dropdown-option" type="button" role="option" data-theme-value="${value}">
          <span>${theme.label}</span>
        </button>
      `).join('')}
    </div>
  `;

  const trigger = root.querySelector('[data-dropdown-trigger]');
  trigger.addEventListener('click', event => {
    event.stopPropagation();
    const nextOpen = !root.classList.contains('open');
    closeOtherControlDropdowns(root);
    root.classList.toggle('open', nextOpen);
    trigger.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
  });

  root.querySelectorAll('[data-theme-value]').forEach(option => {
    option.addEventListener('click', event => {
      event.stopPropagation();
      applyTheme(option.dataset.themeValue);
      closeThemeSelector();
    });
  });

  document.addEventListener('click', event => {
    if (!root.contains(event.target)) closeThemeSelector();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeThemeSelector();
  });

  syncThemeSelector();
}
