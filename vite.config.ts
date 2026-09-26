import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { defineConfig } from 'vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { PWAConfig } from './pwa.config.ts';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src/workers',
      filename: 'sw.ts',
      pwaAssets: {
        config: true,
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
      manifest: {
        ...PWAConfig,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      'shaka-player': path.resolve(
        import.meta.dirname,
        'src/vendor/shaka-player.stripped.js',
      ),
    },
  },
  server: {
    host: process.env.NODE_ENV === 'development' ? false : true,
  },
  css: {
    modules: { localsConvention: 'camelCase' },
  },
  optimizeDeps: {
    include: ['shaka-player'],
  },
  build: {
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/]react/u,
              priority: 3,
            },
            {
              name: 'shaka-vendor',
              test: /shaka-player\.stripped/u,
              priority: 2,
            },
            {
              name: 'vendor',
              test: /node_modules/u,
              priority: 1,
            },
            {
              name: 'common',
              minShareCount: 2,
              minSize: 10000,
              priority: 0,
            },
          ],
        },
      },
    },
  },
});
