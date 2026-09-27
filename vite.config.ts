import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import fs from 'fs';
import { VitePWA } from 'vite-plugin-pwa';
import { PWAConfig } from './pwa.config.ts';

const dirName = import.meta.dirname;

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      VitePWA({
        registerType: 'autoUpdate',
        pwaAssets: {
          config: true,
        },
        devOptions: {
          enabled: true,
        },
        manifest: {
          ...PWAConfig,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(dirName, 'src'),
        'shaka-player': path.resolve(
          dirName,
          'src/vendor/shaka-player.stripped.js',
        ),
      },
    },
    server: {
      host: process.env.NODE_ENV === 'development' ? false : true,
      https: {
        key: fs.readFileSync(path.resolve(dirName, env.CERT_KEY!)),
        cert: fs.readFileSync(path.resolve(dirName, env.CERT_FILE!)),
      },
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
  };
});
