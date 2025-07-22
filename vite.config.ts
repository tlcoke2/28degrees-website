import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    // Use relative base path for Vercel deployment
    base: env.VITE_BASE_URL || '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Generate manifest.json for better caching
    manifest: true,
    // Ensure proper chunking and module loading
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
        },
      },
    },
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
