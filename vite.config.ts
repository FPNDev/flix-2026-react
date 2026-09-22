import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  server: {
    host: process.env.NODE_ENV !== 'development' ? true : false,
  },
  css: {
    modules: { localsConvention: 'camelCase' },
  },
  build: {
    cssMinify: 'lightningcss',
  },
});
