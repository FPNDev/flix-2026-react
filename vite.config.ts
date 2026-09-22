import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { defineConfig } from 'vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
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
    host: process.env.NODE_ENV !== 'development' ? true : false,
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
              test: /node_modules[\\/]react/,
              priority: 20,
            },
            {
              name: 'shaka-vendor',
              test: /shaka-player\.stripped/,
              priority: 15,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 10,
            },
            {
              name: 'common',
              minShareCount: 2,
              minSize: 10000,
              priority: 5,
            },
          ],
        },
      },
    },
  },
});
