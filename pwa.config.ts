import type { ManifestOptions } from 'vite-plugin-pwa';

export const PWAConfig: Partial<ManifestOptions> = {
  theme_color: '#431f90',
  background_color: '#0b0710',
  orientation: 'any',
  display: 'standalone',
  lang: 'en-US',
  name: 'FLIX',
  short_name: 'FLIX',
  scope: '/',
  start_url: '/',
  id: 'flix-pwa',
};
