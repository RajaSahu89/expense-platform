import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette: #1C1D20 (base), #5A6068 (steel), #FF5F00 (accent).
        paper: '#1C1D20', // page background
        panel: '#26282C', // solid fallback surface (dropdowns, tooltips)
        steel: '#5A6068', // borders, tracks, neutral chips
        accent: '#FF5F00', // primary actions, active nav, highlights
        accentSoft: 'rgba(255, 95, 0, 0.16)',
        ink: '#F3F4F6', // primary text
        muted: '#A3A9B1', // secondary text (lightened steel for AA contrast on paper)
        line: 'rgba(255, 255, 255, 0.10)', // hairline borders on glass
        // Semantic colours for money. Kept apart from the orange accent so
        // "good" and "bad" never get confused with "primary action".
        success: '#5CD6A0',
        successSoft: 'rgba(92, 214, 160, 0.14)',
        danger: '#FF5470',
        dangerSoft: 'rgba(255, 84, 112, 0.14)',
        warn: '#FFB020',
        warnSoft: 'rgba(255, 176, 32, 0.14)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        glow: '0 6px 24px -6px rgba(255, 95, 0, 0.65)',
      },
    },
  },
  plugins: [],
};

export default config;
