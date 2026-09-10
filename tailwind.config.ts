import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark + blue theme. Token names stay the same across the app
        // (ink = text, paper = page bg, panel = card bg, moss = primary/
        // positive accent, rust = negative/critical, gold = warning) —
        // only the values changed, so every component restyles for free.
        ink: '#E8EDF7',
        paper: '#080C16',
        panel: '#101828',
        line: '#233252',
        moss: '#4C8DFF',
        mossLight: '#16233F',
        rust: '#FF6B6B',
        rustLight: '#3A1C22',
        gold: '#FFC24B',
        goldLight: '#3A2E14',
        slate: '#8B98B8',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
