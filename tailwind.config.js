/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--secondary-rgb) / <alpha-value>)',
        danger: 'rgb(var(--danger-rgb) / <alpha-value>)',
        panel: 'rgb(var(--panel-rgb) / <alpha-value>)',
        evaBlack: '#000000',
      },
      fontFamily: {
        mono: ['Share Tech Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        nerv: '0 0 20px var(--glow), inset 0 0 20px var(--glow)',
        'nerv-soft': '0 0 12px var(--glow), inset 0 0 12px var(--glow)',
      },
      keyframes: {
        'crt-open': {
          '0%': { transform: 'scaleY(0.005) scaleX(0)', filter: 'brightness(3)', opacity: '0' },
          '40%': { transform: 'scaleY(0.005) scaleX(1)', filter: 'brightness(2)', opacity: '1' },
          '100%': { transform: 'scaleY(1) scaleX(1)', filter: 'brightness(1)', opacity: '1' },
        },
      },
      animation: {
        'crt-open': 'crt-open .35s cubic-bezier(.16, 1, .3, 1) forwards',
      },
    },
  },
  plugins: [],
};
