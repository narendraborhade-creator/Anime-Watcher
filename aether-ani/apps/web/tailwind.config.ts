import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#06070B',
        surface: '#0C0F17',
        neonCyan: '#00F0FF',
        neonIndigo: '#6366F1',
        neonMagenta: '#FF2A85',
      },
      fontFamily: {
        display: ['Orbitron', 'Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
