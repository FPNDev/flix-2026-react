import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { defineConfig } from 'vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    alias: {
      // Force Vite to use the pre-bundled browser build
      webtorrent: path.resolve(
        import.meta.dirname,
        'node_modules/webtorrent/dist/webtorrent.min.js',
      ),
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  css: {
    modules: { localsConvention: 'camelCase' },
  },
  build: {
    cssMinify: 'lightningcss',
  },
});
