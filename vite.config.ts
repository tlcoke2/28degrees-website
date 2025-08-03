import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
// Optional: comment out if not in use
// import fixAssetPaths from './vite-fix-asset-paths';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

// Detect if we're in production mode
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const base = isProduction ? '/' : '/'; // Change to '/28degrees-website/' if deployed to subpath

  return {
    base,
    plugins: [
      react(),
      // Optional asset path fixer
      // fixAssetPaths({
      //   patterns: [
      //     { from: '**/*.{jpg,png,svg,ico}', to: 'assets/[name].[hash][extname]' },
      //   ],
      // }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        // Ensure long formatter module is resolvable if needed
        'date-fns/_lib/format/longFormatters': 'date-fns/esm/_lib/format/longFormatters/index.js',
      },
    },
    server: {
      port: 3001,
      strictPort: true,
      open: true,
      host: '0.0.0.0',
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
        `.replace(/\s+/g, ' ').trim(),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction,
      manifest: true,
      minify: 'terser',
      chunkSizeWarningLimit: 1000,
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
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
        },
      },
    },
    define: {
      'process.env': {},
    },
    preview: {
      port: 3000,
      strictPort: true,
    },
    optimizeDeps: {
      include: ['@mui/material', '@emotion/react', '@emotion/styled'],
    },
  };
});
