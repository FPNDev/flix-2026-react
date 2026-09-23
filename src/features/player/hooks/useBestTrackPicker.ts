import { useEffect, useRef } from 'react';
import type shaka from 'shaka-player';
import { findBestMatchForAudioTrack } from '../utils/audio';
import { useEventEffect } from '@/hooks/useEventEffect';

type Props = {
  player: shaka.Player | undefined;
  audioTracks: shaka.extern.AudioTrack[];
  magnetURI: string;
  selectedAudioTrackIndex: number;
  selectAudioTrack: (trackIndex: number) => void;
};

export function useNextTrackPicker({
  player,
  audioTracks,
  magnetURI,
  selectedAudioTrackIndex,
  selectAudioTrack,
}: Props) {
  const lastAudioTrackRef = useRef<shaka.extern.AudioTrack>(null);

  useEventEffect(() => {
    lastAudioTrackRef.current = null;
  }, [magnetURI]);

  useEffect(() => {
    if (player && audioTracks.length) {
      if (lastAudioTrackRef.current) {
        const bestTrackIndex = findBestMatchForAudioTrack(
          audioTracks,
          lastAudioTrackRef.current,
        );
        selectAudioTrack(bestTrackIndex);
        return;
      }
      selectAudioTrack(0);
    }
  }, [player, audioTracks, selectAudioTrack]);

  useEffect(() => {
    if (!audioTracks[selectedAudioTrackIndex]) {
      return;
    }

    lastAudioTrackRef.current = audioTracks[selectedAudioTrackIndex];
  }, [audioTracks, selectedAudioTrackIndex]);
}
