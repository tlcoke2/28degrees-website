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
  },
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    manifest: true,
    minify: 'terser',
    // Disable code splitting to avoid MIME type issues
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
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
