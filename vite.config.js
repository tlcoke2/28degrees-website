import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Use absolute base path for Vercel
  base: '/',
  // Ensure proper module resolution
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Disable code splitting to avoid MIME type issues
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
    // Ensure proper module loading
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  // Server configuration (for development only)
  server: {
    port: 3000,
    strictPort: true,
    open: true,
  },
  // Preview configuration (for production preview)
  preview: {
    port: 3000,
    strictPort: true,
  },
});
