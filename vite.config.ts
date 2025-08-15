import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  // ✅ If using a custom domain at root (e.g. https://28degreeswest.com) keep '/'
  // ❗ If serving from a repo subpath (e.g. https://user.github.io/28degrees-website/)
  //     then change this to '/28degrees-website/'
  const base = isProduction ? '/' : '/';

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        'date-fns/_lib/format/longFormatters': 'date-fns/esm/_lib/format/longFormatters/index.js',
      },
    },
    server: {
      port: 3001,
      strictPort: true,
      open: true,
      host: '0.0.0.0',
      cors: true,
      // ✅ Dev-only CSP so your local app can call the Railway API & Stripe
      headers: {
        'Content-Security-Policy': `
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
          style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
          img-src 'self' data: https:;
          font-src 'self' https://fonts.gstatic.com;
          connect-src 'self' https://api.28degreeswest.com https://api.stripe.com https://*.stripe.com wss://api.28degreeswest.com;
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
      minify: 'terser', // leave as-is since you're already building; if you prefer faster builds, switch to 'esbuild'
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined),
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
    // ❌ Removed define: {'process.env': {}} — Vite apps should use import.meta.env
    preview: {
      port: 3000,
      strictPort: true,
    },
    optimizeDeps: {
      include: ['@mui/material', '@emotion/react', '@emotion/styled'],
    },
  };
});

