import { useEffect, useEffectEvent, useRef } from 'react';
import type shaka from 'shaka-player';
import { useEventEffect } from '@/hooks/useEventEffect';
import type { TrackType } from '../types/tracks.types';
import { findBestMatchForTrack } from '../utils/tracks';

type Props<T extends keyof TrackType> = {
  player: shaka.Player | undefined;
  tracks: TrackType[T][];
  assetId: string;
  selectedTrackIndex: number | undefined;
  selectTrack: (trackIndex: number) => void;
  trackType: T;
  defaultIndex: number | undefined;
};

export function useNextTrackPicker<T extends keyof TrackType>({
  player,
  tracks,
  assetId,
  selectedTrackIndex,
  selectTrack,
  trackType,
  defaultIndex,
}: Props<T>) {
  const lastTrackRef = useRef<TrackType[T]>(null);

  useEventEffect(() => {
    lastTrackRef.current = null;
  }, [assetId]);

  const selectDefault = useEffectEvent(() =>
    selectTrack(defaultIndex as number),
  );
  const selectBestTrack = useEffectEvent(selectTrack);

  useEffect(() => {
    if (player && tracks.length) {
      if (lastTrackRef.current) {
        const bestTrackIndex = findBestMatchForTrack(
          trackType,
          tracks,
          lastTrackRef.current,
        );

        if (bestTrackIndex !== undefined) {
          selectBestTrack(bestTrackIndex);
        } else {
          selectDefault();
        }

        return;
      }
      selectDefault();
    }
  }, [player, tracks, trackType]);

  useEffect(() => {
    if (!tracks.length) {
      return;
    }

    lastTrackRef.current =
      selectedTrackIndex !== undefined ? tracks[selectedTrackIndex] : null;
  }, [tracks, selectedTrackIndex]);
}
