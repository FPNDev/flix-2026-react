import type shaka from 'shaka-player';
import { toCacheKey } from './segmentCache';
import type { CacheEntry } from './segmentCache';

export type StreamCursor = {
  stream: shaka.extern.Stream;
  position: number;
};

export type NextSegment = {
  cursor: StreamCursor;
  reference: shaka.media.SegmentReference;
  uri: string;
  range: Maybe<string>;
  key: string;
};

export function createCursors(player: shaka.Player, video: HTMLMediaElement) {
  const cursors: StreamCursor[] = [];
  const manifest = player.getManifest();
  if (!manifest || player.isLive()) {
    return cursors;
  }

  const variantId = player.getVariantTracks().find((track) => track.active)?.id;
  const textId = player.getTextTracks().find((track) => track.active)?.id;
  const variant = manifest.variants.find((item) => item.id === variantId);
  const streams = [
    variant?.video,
    variant?.audio,
    manifest.textStreams.find((item) => item.id === textId),
  ];
  const startTime =
    video.currentTime + player.getConfiguration().streaming.bufferingGoal;

  for (const stream of streams) {
    const position = stream?.segmentIndex?.find(startTime) as Maybe<number>;
    if (stream && position !== null && position !== undefined) {
      cursors.push({ stream, position });
    }
  }

  return cursors;
}

export function nextSegment(
  cursors: StreamCursor[],
  entries: Map<string, CacheEntry>,
  windowEnd: number,
) {
  let next: Maybe<NextSegment>;

  for (const cursor of cursors) {
    let candidate: Maybe<NextSegment>;

    while (!candidate) {
      const reference = cursor.stream.segmentIndex?.get(
        cursor.position,
      ) as Maybe<shaka.media.SegmentReference>;
      if (!reference) {
        break;
      }

      const [uri] = reference.getUris();
      const startByte = reference.getStartByte();
      const endByte = reference.getEndByte();
      const range =
        startByte === 0 && endByte === null
          ? undefined
          : `bytes=${startByte}-${endByte ?? ''}`;
      const key = uri ? toCacheKey(uri, range) : undefined;

      if (
        uri &&
        key &&
        reference.getEndTime() > windowEnd &&
        !entries.has(key)
      ) {
        candidate = { cursor, reference, uri, range, key };
      } else {
        cursor.position += 1;
      }
    }

    if (
      candidate &&
      (!next ||
        candidate.reference.getStartTime() < next.reference.getStartTime())
    ) {
      next = candidate;
    }
  }

  return next;
}
