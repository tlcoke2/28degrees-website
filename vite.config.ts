import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Always use root path for assets to work on both custom domain and GitHub Pages
  const base = '/';

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
      sourcemap: false, // Disable sourcemaps for production
      manifest: true,
      minify: 'terser',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
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
      // Ensure _redirects file is copied to the root of the dist directory
      copyPublicDir: true,
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
