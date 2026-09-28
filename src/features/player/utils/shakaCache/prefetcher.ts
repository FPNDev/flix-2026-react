import type shaka from 'shaka-player';
import { fetchToCache } from './cacheWrite';
import type { SegmentCache } from './segmentCache';
import { createCursors, nextSegment } from './segmentCursors';
import type { NextSegment, StreamCursor } from './segmentCursors';
import { msUntilShakaIdle } from './shakaActivity';

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
  let disposed = false;
  let failedKey = '';
  let failedAttempts = 0;

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

  const prefetch = async (segment: NextSegment) => {
    const { cursor, position, key } = segment;
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
      await fetchToCache(segmentCache, segment, retryParameters, signal);
    } catch {
      if (signal.aborted) {
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

    const shakaIdleIn = msUntilShakaIdle();
    const next =
      shakaIdleIn > 0
        ? undefined
        : nextSegment(cursors, segmentCache.entries, shakaBufferedEnd());
    await (next && segmentCache.hasRoomFor(next.entry)
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
