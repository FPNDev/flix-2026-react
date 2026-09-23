import { useToast } from '@/components/DesignSystem/Toast';
import type shaka from 'shaka-player';
import { usePlayerSubscription } from './usePlayerSubscription';
import { useState } from 'react';
import { getAudioTracksList } from '../utils/audio';

type UseAudioTrackSelectionProps = {
  player: shaka.Player | undefined;
};

const AUDIO_TRACKS_EVENTS = ['trackschanged', 'unloading'];
const NO_AUDIO_TRACKS: shaka.extern.AudioTrack[] = [];

/**
 * Provides a layer for audio track selection within Shaka player
 */
export function useAudioTrackSelection({
  player,
}: UseAudioTrackSelectionProps) {
  const { addToast } = useToast();

  const { snapshot: audioTracks } = usePlayerSubscription({
    player,
    events: AUDIO_TRACKS_EVENTS,
    selector: getAudioTracksList,
    fallback: NO_AUDIO_TRACKS,
  });

  const [selectedAudioTrackIndex, setSelectedAudioTrackIndex] = useState(0);

  const selectAudioTrack = (selectedIndex: number, showToast = false) => {
    if (!player) {
      return;
    }

    const trackLanguageSuffix = audioTracks[selectedIndex].language
      ? `- ${audioTracks[selectedIndex].language}`
      : '';
    const audioTrackName = `${audioTracks[selectedIndex].label}${trackLanguageSuffix}`;

    try {
      player.selectAudioTrack(audioTracks[selectedIndex], 1);
      setSelectedAudioTrackIndex(selectedIndex);

      if (showToast) {
        addToast({
          icon: 'queue_music',
          text: `Switched audio to ${audioTrackName}`,
        });
      }
    } catch {
      if (showToast) {
        addToast({
          icon: 'music_off',
          text: `Failed to switch audio to ${audioTrackName}`,
          variant: 'danger',
        });
      }
    }
  };

  const navigateAudioTracks = (direction: -1 | 1) => {
    if (audioTracks.length <= 1) {
      return;
    }

    selectAudioTrack(
      (audioTracks.length + selectedAudioTrackIndex + direction) %
        audioTracks.length,
      true,
    );
  };

  return {
    selectedAudioTrackIndex,
    audioTracks,
    selectAudioTrack,
    navigateAudioTracks,
  };
}
