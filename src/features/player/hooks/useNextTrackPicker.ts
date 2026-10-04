import { useEffect, useEffectEvent, useRef } from 'react';
import type shaka from 'shaka-player';
import { useEventEffect } from '@/hooks/useEventEffect';
import type { TrackType } from '../types/player.types';
import {
  disableTrack,
  findBestMatchForTrack,
  selectTrack,
} from '../utils/tracks';
import { getTracks } from '../utils/shaka';

type Props<T extends keyof TrackType> = {
  player: shaka.Player | undefined;
  assetId: string;
  trackType: T;
  defaultIndex: number | undefined;
};

export function useNextTrackPicker<T extends keyof TrackType>({
  player,
  assetId,
  trackType,
  defaultIndex,
}: Props<T>) {
  const lastTrackRef = useRef<TrackType[T]>(null);

  useEventEffect(() => {
    lastTrackRef.current = null;
  }, [assetId]);

  const selectBestTrack = useEffectEvent(() => {
    if (!player) {
      return;
    }

    const tracks = getTracks<T>(player, trackType);
    if (tracks.length > 0) {
      let bestIndex = defaultIndex;

      if (lastTrackRef.current) {
        const bestTrackIndex = findBestMatchForTrack(
          trackType,
          tracks,
          lastTrackRef.current,
        );

        if (bestTrackIndex !== undefined) {
          bestIndex = bestTrackIndex;
        }
      }

      if (bestIndex === undefined) {
        disableTrack(player, trackType);
      } else {
        selectTrack(player, trackType, tracks[bestIndex]);
      }
    }
  });

  const pickNewBest = useEffectEvent(() => {
    if (!player) {
      return;
    }

    const tracks = getTracks<T>(player, trackType);
    const trackIndex = tracks.findIndex((track) => track.active);

    if (trackIndex === -1) {
      lastTrackRef.current = null;
      return;
    }

    lastTrackRef.current = tracks[trackIndex];
  });

  useEffect(() => {
    if (!player) {
      return;
    }

    player.addEventListener('loaded', selectBestTrack);
    player.addEventListener('textchanged', pickNewBest);
    player.addEventListener('variantchanged', pickNewBest);

    return () => {
      player.removeEventListener('loaded', selectBestTrack);
      player.removeEventListener('textchanged', pickNewBest);
      player.removeEventListener('variantchanged', pickNewBest);
    };
  }, [player]);
}
