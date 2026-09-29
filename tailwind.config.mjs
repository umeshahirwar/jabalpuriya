/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        jabalpur: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38bdf8',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
          950: '#041d31', // Royal Narmada Navy
          primary: '#0c4a6e',
          secondary: '#ff5a1f', // Vibrant Saffron / Marble Terracotta
          saffron: '#ff671f',
          gold: '#f59e0b',
          emerald: '#10b981',
          ruby: '#e11d48',
          dark: '#061324',
          card: '#0a1d35',
          surface: '#0f2747',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'ticker': 'ticker 30s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      boxShadow: {
        'vibrant': '0 10px 30px -10px rgba(255, 90, 31, 0.3)',
        'vibrant-blue': '0 10px 30px -10px rgba(2, 132, 199, 0.35)',
        'glow': '0 0 25px rgba(255, 90, 31, 0.25)',
      }
    },
  },
  plugins: [],
};
