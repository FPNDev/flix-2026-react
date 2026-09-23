export function setMediaSessionMetadata(title: string) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artwork: [
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
      ],
    });
  }
}
