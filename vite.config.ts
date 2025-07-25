import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import fixAssetPaths from './vite-fix-asset-paths';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Use root path for custom domain, or repository name for GitHub Pages
  const base = mode === 'production' ? '/28degrees-website/' : '/';
  const isProduction = mode === 'production';
  
  return {
    plugins: [
      react(),
      fixAssetPaths()
    ],
    base: base,
    
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
      sourcemap: !isProduction, // Only enable sourcemaps in development
      manifest: true,
      minify: 'terser',
      chunkSizeWarningLimit: 1000,
      
      // Rollup options
      rollupOptions: {
        output: {
          manualChunks: (id) => {
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
          drop_console: isProduction,
          drop_debugger: isProduction,
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
  };
});
