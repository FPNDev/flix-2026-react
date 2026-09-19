import { useToast } from '@/components/DesignSystem/Toast';
import { addKeys } from '@/utils/list';
import { useEffect, useState } from 'react';
import shaka from 'shaka-player';
import { isActiveTrack } from '../utils/tracks';

type UseAudioTrackSelectionProps = {
  player: shaka.Player | null;
};

/**
 * Provides a layer for audio track selection within Shaka player
 */
export function useAudioTrackSelection({
  player,
}: UseAudioTrackSelectionProps) {
  const { addToast } = useToast();

  const [audioTracks, setAudioTracks] = useState<
    (shaka.extern.AudioTrack & { key: string })[]
  >([]);
  const [selectedAudioTrackIndex, setSelectedAudioTrackIndex] =
    useState<number>(0);

  useEffect(() => {
    if (!player) {
      return;
    }

    const onTracksChanged = () => {
      const tracks = player.getAudioTracks();
      setAudioTracks(addKeys(tracks));
      setSelectedAudioTrackIndex(tracks.findIndex(isActiveTrack));
    };

    const onUnloading = () => {
      setAudioTracks([]);
      setSelectedAudioTrackIndex(0);
    };

    player.addEventListener('trackschanged', onTracksChanged);
    player.addEventListener('unloading', onUnloading);

    return () => {
      player.removeEventListener('trackschanged', onTracksChanged);
      player.removeEventListener('unloading', onUnloading);
    };
  }, [player]);

  const selectAudioTrack = (selectedIndex: number) => {
    if (!player) {
      return;
    }

    try {
      player.selectAudioTrack(audioTracks[selectedIndex], 1);
      setSelectedAudioTrackIndex(selectedIndex);

      addToast({
        icon: 'queue_music',
        text: `Switched audio to ${audioTracks[selectedIndex].label}`,
      });
    } catch (err) {
      addToast({
        icon: 'music_off',
        text: `Failed to switch audio to ${audioTracks[selectedIndex].label}`,
        variant: 'danger',
      });
      console.error(err);
    }
  };

  const navigateAudioTracks = (direction: -1 | 1) => {
    if (audioTracks.length <= 1) {
      return;
    }

    selectAudioTrack(
      (audioTracks.length + selectedAudioTrackIndex + direction) %
        audioTracks.length,
    );
  };

  return {
    selectedAudioTrackIndex,
    audioTracks,
    selectAudioTrack,
    navigateAudioTracks,
  };
}
