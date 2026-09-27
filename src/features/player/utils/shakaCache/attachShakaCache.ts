import shaka from 'shaka-player';

import { createPrefetcher } from './prefetcher';
import { cachePlugin, createRequestFilter, stores } from './schemePlugin';
import {
  CACHE_PREFIX,
  CACHE_SCHEME,
  createSegmentCache,
  holdCacheLock,
} from './segmentCache';

const REPOSITION_EVENTS = [
  'loaded',
  'variantchanged',
  'textchanged',
  'trackschanged',
];

export function attachShakaCache(
  player: shaka.Player,
  video: HTMLMediaElement,
) {
  const networkingEngine = player.getNetworkingEngine();
  if (!networkingEngine || !('caches' in window)) {
    return () => null;
  }

  shaka.net.NetworkingEngine.registerScheme(
    CACHE_SCHEME,
    cachePlugin,
    shaka.net.NetworkingEngine.PluginPriority.APPLICATION,
  );

  const instanceId = crypto.randomUUID();
  const cacheName = `${CACHE_PREFIX}${instanceId}`;
  const segmentCache = createSegmentCache(cacheName);
  const prefetcher = createPrefetcher(player, video, segmentCache);
  const requestFilter = createRequestFilter(cacheName, segmentCache.entries);
  const { reposition, wake, stop } = prefetcher;

  const onPageHide = () => {
    segmentCache.clear();
    reposition();
  };

  stores.set(instanceId, {
    entries: segmentCache.entries,
    openCache: segmentCache.open,
    onServed: wake,
  });
  networkingEngine.registerRequestFilter(requestFilter);

  for (const event of REPOSITION_EVENTS) {
    player.addEventListener(event, reposition);
  }
  player.addEventListener('buffering', wake);
  player.addEventListener('unloading', stop);
  video.addEventListener('seeking', reposition);
  window.addEventListener('pagehide', onPageHide);

  const releaseLock = holdCacheLock(cacheName);

  prefetcher.start();

  return () => {
    prefetcher.dispose();
    releaseLock();
    stores.delete(instanceId);
    networkingEngine.unregisterRequestFilter(requestFilter);

    for (const event of REPOSITION_EVENTS) {
      player.removeEventListener(event, reposition);
    }
    player.removeEventListener('buffering', wake);
    player.removeEventListener('unloading', stop);
    video.removeEventListener('seeking', reposition);
    window.removeEventListener('pagehide', onPageHide);
  };
}
