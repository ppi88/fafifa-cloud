/** @type {import('tailwindcss').Config} */
export default {
  // Menggunakan 'media' agar otomatis ikut tema HP (Dark/Light)
  darkMode: 'media', 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}