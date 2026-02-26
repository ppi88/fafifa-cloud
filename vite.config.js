import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Menambahkan base path agar asset terpanggil dengan benar
  base: '/',
  build: {
    // Memastikan output build bersih
    outDir: 'dist',
  }
})