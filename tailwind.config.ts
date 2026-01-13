import type { Config } from 'tailwindcss';
import lineClamp from '@tailwindcss/line-clamp';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        baby: {
          50: '#fdfbf7',
          100: '#f7f3e8',
          200: '#efe5cd',
          300: '#e5d1a8',
          400: '#dab67e',
          500: '#d09b5b',
          600: '#b67e45',
          900: '#644327',
        },
        softblue: '#E0F2F1',
        softpink: '#FCE4EC',
        mint: '#E0F7FA',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [lineClamp],
};

export default config;
