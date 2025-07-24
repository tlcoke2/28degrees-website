import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // When building for production (npm run build), use root path for custom domain
  // For GitHub Pages, we'll set the base URL via environment variable
  const isProduction = mode === 'production';
  const base = isProduction ? '/' : '/28degrees-website/';

  return {
    plugins: [react()],
    base,
    server: {
      port: 3000,
      strictPort: true,
      open: true,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction,
      manifest: true,
      minify: isProduction ? 'terser' : false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            return undefined;
          },
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      } : {},
    },
    // Environment variables to expose to the client
    define: {
      'process.env': {}
    }
  };
});
