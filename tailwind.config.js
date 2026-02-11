/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Biru Tosca Utama
          600: '#0d9488',
          700: '#0f766e',
          900: '#064e4b',
        },
        secondary: {
          400: '#fbbf24',
          500: '#f59e0b', // Kuning Kunyit
          600: '#d97706',
        },
        tertiary: {
          800: '#1e293b',
          900: '#0f172a', // Navy
          950: '#020617',
        },
        base: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}