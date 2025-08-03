import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import fixAssetPaths from './vite-fix-asset-paths';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Use root path for custom domain
  const base = mode === 'production' ? '/' : '/';
  const isProduction = mode === 'production';
  
  return {
    plugins: [
      react(),
      fixAssetPaths({
        // Fix paths for images and other assets
        patterns: [
          { from: '**/*.{jpg,png,svg,ico}', to: 'assets/[name].[hash][extname]' },
        ],
      })
    ],
    base: base,
    
    // Server configuration for development
    server: {
      port: 3001,
      strictPort: true, // Ensure the port is strictly used
      open: true,
      host: '0.0.0.0', // Explicitly listen on all network interfaces
      cors: true,
      headers: {
        'Content-Security-Policy': `
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
          style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
          img-src 'self' data: https:;
          font-src 'self' https://fonts.gstatic.com;
          connect-src 'self' https://api.stripe.com https://*.stripe.com;
          frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
          frame-ancestors 'self';
          form-action 'self';
          base-uri 'self';
        `.replace(/\s+/g, ' ').trim()
      }
    },
    
    // Build configuration
    resolve: {
      alias: {
        // Fix for date-fns imports
        'date-fns/_lib/format/longFormatters': 'date-fns/esm/_lib/format/longFormatters/index.js'
      }
    },
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
