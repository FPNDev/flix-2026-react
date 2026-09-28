import shaka from 'shaka-player';

import { isShakaActive } from '../shaka';
import { createPrefetcher } from './prefetcher';
import { cachePlugin, createCacheResponseFilter, stores } from './schemePlugin';
import {
  CACHE_PREFIX,
  createSegmentCache,
  holdCacheLock,
} from './segmentCache';
import type { CacheEntry } from './segmentCache';
import { activeStreams, BUFFERED_END_TOLERANCE } from './segmentCursors';
import { trackSegmentActivity } from './shakaActivity';

type BufferedRanges = Partial<Omit<shaka.extern.BufferedInfo, 'total'>>;

const REPOSITION_EVENTS = [
  'loaded',
  'variantchanged',
  'textchanged',
  'trackschanged',
];
const HTTP_SCHEMES = ['http', 'https'];

const bufferedRanges = new WeakMap<shaka.Player, BufferedRanges>();

for (const scheme of HTTP_SCHEMES) {
  shaka.net.NetworkingEngine.registerScheme(
    scheme,
    trackSegmentActivity(cachePlugin),
    shaka.net.NetworkingEngine.PluginPriority.APPLICATION,
    true,
  );
}

export function getBufferedRanges(player: shaka.Player) {
  return bufferedRanges.get(player);
}

export function attachShakaCache(
  player: shaka.Player,
  video: HTMLMediaElement,
) {
  const networkingEngine = player.getNetworkingEngine();
  if (!networkingEngine || !('caches' in window)) {
    return () => null;
  }

  const reportBufferedRanges = () => {
    const ranges = isShakaActive(player)
      ? toBufferedRanges(
          segmentCache.entries,
          activeStreams(player),
          player.getBufferedInfo(),
        )
      : {};

    bufferedRanges.set(player, ranges);
    player.dispatchEvent(new shaka.util.FakeEvent('bufferedrangeschanged'));
  };

  const cacheName = `${CACHE_PREFIX}${crypto.randomUUID()}`;
  const segmentCache = createSegmentCache(
    cacheName,
    () => ({
      currentTime: video.currentTime,
      streamIds: new Set(activeStreams(player).map(({ id }) => id)),
    }),
    reportBufferedRanges,
  );
  const prefetcher = createPrefetcher(player, video, segmentCache);
  const { reposition, wake, stop } = prefetcher;

  const onPageHide = () => {
    segmentCache.clear();
    reposition();
  };
  stores.add(segmentCache);

  const cacheSegmentResponseFilter = createCacheResponseFilter(segmentCache);
  networkingEngine.registerResponseFilter(cacheSegmentResponseFilter);

  for (const event of REPOSITION_EVENTS) {
    player.addEventListener(event, reposition);
    player.addEventListener(event, reportBufferedRanges);
  }
  player.addEventListener('segmentappended', wake);
  player.addEventListener('segmentappended', reportBufferedRanges);
  player.addEventListener('unloading', stop);
  video.addEventListener('seeking', reposition);
  window.addEventListener('pagehide', onPageHide);

  const releaseLock = holdCacheLock(cacheName);

  prefetcher.start();

  return () => {
    prefetcher.dispose();
    releaseLock();
    stores.delete(segmentCache);
    networkingEngine.unregisterResponseFilter(cacheSegmentResponseFilter);

    for (const event of REPOSITION_EVENTS) {
      player.removeEventListener(event, reposition);
      player.removeEventListener(event, reportBufferedRanges);
    }
    player.removeEventListener('segmentappended', wake);
    player.removeEventListener('segmentappended', reportBufferedRanges);
    player.removeEventListener('unloading', stop);
    video.removeEventListener('seeking', reposition);
    window.removeEventListener('pagehide', onPageHide);
    bufferedRanges.delete(player);
  };
}

function toBufferedRanges(
  entries: ReadonlyMap<string, CacheEntry>,
  streams: shaka.extern.Stream[],
  buffered: shaka.extern.BufferedInfo,
) {
  const result: BufferedRanges = {};

  for (const stream of streams) {
    const type = stream.type as keyof BufferedRanges;
    const ranges = [...buffered[type]];

    for (const { streamId, startTime, endTime } of entries.values()) {
      if (streamId === stream.id) {
        ranges.push({ start: startTime, end: endTime });
      }
    }

    result[type] = mergeRanges(ranges);
  }

  return result;
}

function mergeRanges(ranges: shaka.extern.BufferedRange[]) {
  const merged: shaka.extern.BufferedRange[] = [];

  for (const { start, end } of ranges.sort((a, b) => a.start - b.start)) {
    const last = merged.at(-1);
    if (last && start <= last.end + BUFFERED_END_TOLERANCE) {
      last.end = Math.max(last.end, end);
    } else {
      merged.push({ start, end });
    }
  }

  return merged;
}
