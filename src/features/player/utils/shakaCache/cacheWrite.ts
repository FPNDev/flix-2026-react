import type shaka from 'shaka-player';

import { anyAbortSignal } from '@/utils/abort';
import type { SegmentCache } from './segmentCache';
import type { NextSegment } from './segmentCursors';

export async function fetchToCache(
  segmentCache: SegmentCache,
  { uri, range, key, entry }: NextSegment,
  { stallTimeout, timeout }: shaka.extern.RetryParameters,
  signal: AbortSignal,
) {
  const stall = new AbortController();
  const signals = [signal, stall.signal];
  if (timeout) {
    signals.push(AbortSignal.timeout(timeout));
  }

  let stallTimer = 0;
  const armStall = () => {
    clearTimeout(stallTimer);
    if (stallTimeout) {
      stallTimer = setTimeout(() => {
        stall.abort();
      }, stallTimeout);
    }
  };

  try {
    armStall();

    const response = await fetch(uri, {
      headers: range ? { Range: range } : {},
      signal: anyAbortSignal(signals),
      priority: 'low',
    });

    if (!response.ok || !response.body) {
      void response.body?.cancel();
      throw new Error(`Segment prefetch failed with ${response.status}`);
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let result = await reader.read();
    while (!result.done) {
      armStall();
      chunks.push(result.value);
      result = await reader.read();
    }

    await segmentCache.put(key, entry, new Blob(chunks));
  } finally {
    clearTimeout(stallTimer);
  }
}
