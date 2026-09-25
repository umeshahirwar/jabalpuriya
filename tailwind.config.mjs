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
          400: '#36abf7',
          500: '#0c8fe9',
          600: '#0170c7',
          700: '#0259a1',
          800: '#074b84',
          900: '#0c3f6e',
          950: '#082849', // Deep Narmada Blue
          primary: '#0c3f6e',
          secondary: '#e05a2b', // Marble Terracotta Accent
          gold: '#d4af37', // Heritage Gold
          dark: '#081325',
          card: '#102038',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif']
      }
    },
  },
  plugins: [],
};
