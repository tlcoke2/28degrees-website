import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/28degrees-website/' : '/',
})

// Add this to the end of the file
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/28degrees-website/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
})
