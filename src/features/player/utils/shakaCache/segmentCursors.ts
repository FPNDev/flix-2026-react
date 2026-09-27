import type shaka from 'shaka-player';
import { toCacheKey } from './segmentCache';
import type { CacheEntry } from './segmentCache';

export type StreamCursor = {
  stream: shaka.extern.Stream;
  // Shaka builds a switched-to stream's index after the switch event fires.
  position: Maybe<number>;
};

export type NextSegment = {
  cursor: StreamCursor;
  position: number;
  reference: shaka.media.SegmentReference;
  uri: string;
  range: Maybe<string>;
  key: string;
};

export function createCursors(player: shaka.Player) {
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
  for (const stream of streams) {
    if (stream) {
      cursors.push({ stream, position: undefined });
    }
  }

  return cursors;
}

// MSE buffered ranges drift from segment times by about a frame.
const BUFFERED_END_TOLERANCE = 0.1;

export function nextSegment(
  cursors: StreamCursor[],
  entries: Map<string, CacheEntry>,
  bufferedEnd: number,
) {
  let next: Maybe<NextSegment>;

  for (const cursor of cursors) {
    cursor.position ??= cursor.stream.segmentIndex?.find(
      bufferedEnd,
    ) as Maybe<number>;
    let candidate: Maybe<NextSegment>;

    while (!candidate && typeof cursor.position === 'number') {
      const { position } = cursor;
      const reference = cursor.stream.segmentIndex?.get(
        position,
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
        reference.getStartTime() >= bufferedEnd - BUFFERED_END_TOLERANCE &&
        !entries.has(key)
      ) {
        candidate = { cursor, position, reference, uri, range, key };
      } else {
        cursor.position = position + 1;
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
