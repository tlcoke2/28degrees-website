import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // For Vercel deployment, we can use a relative base path
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Generate manifest.json for better caching
    manifest: true,
    // Optimize build for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // Configure development server
  server: {
    port: 3000,
    open: true,
  },
  // Environment variables to expose to the client
  define: {
    'process.env': {}
  }
})
