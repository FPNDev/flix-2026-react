import {
  defineConfig,
  minimal2023Preset as preset,
} from '@vite-pwa/assets-generator/config';

export default defineConfig({
  preset: {
    ...preset,
    apple: {
      ...preset.apple,
      padding: 0,
    },
    maskable: {
      ...preset.maskable,
      padding: 0,
    },
    transparent: {
      ...preset.transparent,
      padding: 0,
    },
  },
  images: ['public/app-icon.svg'],
});
