import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  // Set base URL for GitHub Pages
  base: '/28degrees-website/',
  // Server configuration for development
  server: {
    port: 3000,
    strictPort: true,
    open: true,
  },
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    manifest: true,
    minify: 'terser',
    // Configure chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Rollup options
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Create separate chunks for node modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
    // Terser options for minification
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
      },
    },
  },
  // Resolve aliases for absolute imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // Environment variables to expose to the client
  define: {
    'process.env': {}
  },
  // Handle SPA routing
  preview: {
    port: 3000,
    strictPort: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['@mui/material', '@emotion/react', '@emotion/styled'],
  },
})
