import type shaka from 'shaka-player';

import { anyAbortSignal } from '@/utils/abort';
import type { NextSegment } from './segmentCursors';

const QUOTA_USAGE_LIMIT = 0.9;

export async function fetchToCache(
  cache: Cache,
  { uri, range, key }: NextSegment,
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

    await cache.put(
      key,
      new Response(
        response.body.pipeThrough(
          new TransformStream({
            transform(chunk, stream) {
              armStall();
              stream.enqueue(chunk);
            },
          }),
        ),
      ),
    );
  } finally {
    clearTimeout(stallTimer);
  }
}

export async function hasQuota() {
  const { usage = 0, quota = Infinity } = await navigator.storage
    .estimate()
    .catch((): StorageEstimate => ({}));
  return !(usage > quota * QUOTA_USAGE_LIMIT);
}

export function isQuotaExceeded(error: unknown) {
  return error instanceof DOMException && error.name === 'QuotaExceededError';
}
