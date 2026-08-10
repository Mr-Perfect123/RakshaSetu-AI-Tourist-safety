/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D47A1',
          dark: '#0A3880',
          light: '#1976D2'
        },
        secondary: {
          DEFAULT: '#1565C0',
          light: '#42A5F5'
        },
        success: '#2E7D32',
        danger: {
          DEFAULT: '#D32F2F',
          dark: '#B71C1C',
          light: '#EF5350'
        },
        warning: '#F57C00',
        bgMain: '#F5F7FA'
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(13, 71, 161, 0.08)'
      }
    },
  },
  plugins: [],
}
