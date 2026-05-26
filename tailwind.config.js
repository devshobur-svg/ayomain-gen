/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#121212',
        cardBg: '#1E1E1E',
        neonPurple: '#6366F1', // Nanti tinggal sesuaikan hex ungu figma lu
        neonVolt: '#CCFF00',   // Buat aksen live/tombol ijo
      }
    },
  },
  plugins: [],
}