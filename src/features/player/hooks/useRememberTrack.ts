import { useEffect, useEffectEvent, useRef } from 'react';
import { useEventEffect } from '@/hooks/useEventEffect';
import { findBestMatchForTrack } from '../utils/tracks';
import type { TrackType } from '../sdk';

type Props<T extends keyof TrackType> = {
  tracks: TrackType[T][];
  assetId: string;
  selectedTrackIndex: number;
  selectTrack: (trackIndex: number) => void;
  trackType: T;
};

export function useRememberTrack<T extends keyof TrackType>({
  tracks,
  assetId,
  selectedTrackIndex,
  selectTrack,
  trackType,
}: Props<T>) {
  const lastTrackRef = useRef<TrackType[T]>(null);

  useEventEffect(() => {
    lastTrackRef.current = null;
  }, [assetId]);

  const selectBestTrack = useEffectEvent(selectTrack);

  useEffect(() => {
    if (tracks.length > 0 && lastTrackRef.current) {
      const bestTrackIndex = findBestMatchForTrack(
        trackType,
        tracks,
        lastTrackRef.current,
      );

      if (bestTrackIndex !== undefined) {
        selectBestTrack(bestTrackIndex);
      }
    }
  }, [tracks, trackType]);

  useEffect(() => {
    if (tracks.length > 0) {
      lastTrackRef.current = tracks[selectedTrackIndex] ?? null;
    }
  }, [tracks, selectedTrackIndex]);
}
