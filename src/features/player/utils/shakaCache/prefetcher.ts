import type shaka from 'shaka-player';
import { fetchToCache, hasQuota, isQuotaExceeded } from './cacheWrite';
import type { SegmentCache } from './segmentCache';
import { createCursors, nextSegment } from './segmentCursors';
import type { NextSegment, StreamCursor } from './segmentCursors';
import { msUntilShakaIdle } from './shakaActivity';

const QUOTA_CHECK_INTERVAL = 20;

type Prefetcher = {
  start: () => void;
  reposition: () => void;
  wake: () => void;
  stop: () => void;
  dispose: () => void;
};

export function createPrefetcher(
  player: shaka.Player,
  video: HTMLMediaElement,
  segmentCache: SegmentCache,
): Prefetcher {
  let cursors: StreamCursor[] = [];
  let controller = new AbortController();
  let wakeLoop: Maybe<() => void>;
  let quotaFull = false;
  let disposed = false;
  let failedKey = '';
  let failedAttempts = 0;
  let puts = 0;

  const wake = () => {
    wakeLoop?.();
    wakeLoop = undefined;
  };

  const sleep = (ms?: number) =>
    new Promise<void>((resolve) => {
      wakeLoop = resolve;
      if (ms !== undefined) {
        setTimeout(wake, ms);
      }
    });

  const abortPrefetch = () => {
    controller.abort();
    controller = new AbortController();
    cursors = [];
  };

  const reposition = () => {
    abortPrefetch();
    cursors = createCursors(player);
    wake();
  };

  const stop = () => {
    abortPrefetch();
    segmentCache.clear();
  };

  const shakaBufferedEnd = () =>
    player.getBufferedInfo().total.find(({ end }) => end > video.currentTime)
      ?.end ?? video.currentTime;

  const evictPlayed = () => {
    const activeStreamIds = new Set(cursors.map(({ stream }) => stream.id));
    return segmentCache.evict(
      (entry) =>
        entry.endTime <= video.currentTime ||
        !activeStreamIds.has(entry.streamId),
    );
  };

  const prefetch = async (segment: NextSegment) => {
    const { cursor, position, reference, key } = segment;
    const { signal } = controller;
    const target = await segmentCache.open().catch(() => null);
    if (!target) {
      cursors = [];
      return;
    }

    const { retryParameters } = player.getConfiguration().streaming;
    const { baseDelay, backoffFactor, fuzzFactor, maxAttempts } =
      retryParameters;

    try {
      await fetchToCache(target, segment, retryParameters, signal);

      if (!signal.aborted) {
        segmentCache.entries.set(key, {
          streamId: cursor.stream.id,
          endTime: reference.getEndTime(),
        });

        puts += 1;
        if (puts % QUOTA_CHECK_INTERVAL === 0) {
          quotaFull = !(await hasQuota());
        }
      }
    } catch (error) {
      if (signal.aborted) {
        return;
      }

      if (isQuotaExceeded(error)) {
        quotaFull = true;
        return;
      }

      failedAttempts = failedKey === key ? failedAttempts + 1 : 1;
      failedKey = key;
      if (failedAttempts >= maxAttempts) {
        cursor.position = position + 1;
        return;
      }

      await sleep(
        baseDelay *
          backoffFactor ** (failedAttempts - 1) *
          (1 + (Math.random() * 2 - 1) * fuzzFactor),
      );
    }
  };

  const prefetchNext = async () => {
    if (disposed) {
      return;
    }

    if (quotaFull) {
      quotaFull = !(await evictPlayed().catch(() => false));
    }

    const shakaIdleIn = msUntilShakaIdle();
    const next =
      quotaFull || shakaIdleIn > 0
        ? undefined
        : nextSegment(cursors, segmentCache.entries, shakaBufferedEnd());
    await (next
      ? prefetch(next)
      : sleep(shakaIdleIn > 0 ? shakaIdleIn : undefined));

    void prefetchNext();
  };

  const start = () => {
    reposition();
    void prefetchNext();
  };

  const dispose = () => {
    disposed = true;
    stop();
    wake();
  };

  return { start, reposition, wake, stop, dispose };
}
