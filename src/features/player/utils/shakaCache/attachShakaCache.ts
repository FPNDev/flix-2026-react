import shaka from 'shaka-player';

import { createPrefetcher } from './prefetcher';
import { cachePlugin, stores } from './schemePlugin';
import {
  CACHE_PREFIX,
  createSegmentCache,
  holdCacheLock,
} from './segmentCache';
import { trackSegmentActivity } from './shakaActivity';

const REPOSITION_EVENTS = [
  'loaded',
  'variantchanged',
  'textchanged',
  'trackschanged',
];

const HTTP_SCHEMES = ['http', 'https'];
const httpPlugin = trackSegmentActivity(cachePlugin);

export function attachShakaCache(
  player: shaka.Player,
  video: HTMLMediaElement,
) {
  if (!player.getNetworkingEngine() || !('caches' in window)) {
    return () => null;
  }

  for (const scheme of HTTP_SCHEMES) {
    shaka.net.NetworkingEngine.registerScheme(
      scheme,
      httpPlugin,
      shaka.net.NetworkingEngine.PluginPriority.APPLICATION,
      true,
    );
  }

  const cacheName = `${CACHE_PREFIX}${crypto.randomUUID()}`;
  const segmentCache = createSegmentCache(cacheName);
  const prefetcher = createPrefetcher(player, video, segmentCache);
  const { reposition, wake, stop } = prefetcher;

  const onPageHide = () => {
    segmentCache.clear();
    reposition();
  };

  stores.add(segmentCache);

  for (const event of REPOSITION_EVENTS) {
    player.addEventListener(event, reposition);
  }
  player.addEventListener('segmentappended', wake);
  player.addEventListener('unloading', stop);
  video.addEventListener('seeking', reposition);
  window.addEventListener('pagehide', onPageHide);

  const releaseLock = holdCacheLock(cacheName);

  prefetcher.start();

  return () => {
    prefetcher.dispose();
    releaseLock();
    stores.delete(segmentCache);

    for (const event of REPOSITION_EVENTS) {
      player.removeEventListener(event, reposition);
    }
    player.removeEventListener('segmentappended', wake);
    player.removeEventListener('unloading', stop);
    video.removeEventListener('seeking', reposition);
    window.removeEventListener('pagehide', onPageHide);
  };
}
