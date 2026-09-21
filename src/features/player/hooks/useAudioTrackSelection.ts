import { useToast } from '@/components/DesignSystem/Toast';
import { addKeys } from '@/utils/list';
import type shaka from 'shaka-player';
import { isActiveTrack } from '../utils/tracks';
import { usePlayerSubscription } from './usePlayerSubscription';
import { isShakaActive } from '../utils/shaka';

type UseAudioTrackSelectionProps = {
  player?: shaka.Player;
};

type AudioTrackSelection = {
  tracks: (shaka.extern.AudioTrack & {
    key: string;
  })[];
  activeIndex: number;
};

const AUDIO_TRACK_EVENTS = ['audiotrackschanged', 'unloading'];

const NO_AUDIO_TRACKS: AudioTrackSelection = { tracks: [], activeIndex: 0 };

function getAudioTrackSelection(player: shaka.Player): AudioTrackSelection {
  const tracks = isShakaActive(player) ? player.getAudioTracks() : [];

  return {
    tracks: addKeys(
      tracks,
      (track) => `${track.id ?? track.language}-${track.label}`,
    ),
    activeIndex: Math.max(0, tracks.findIndex(isActiveTrack)),
  };
}

/**
 * Provides a layer for audio track selection within Shaka player
 */
export function useAudioTrackSelection({
  player,
}: UseAudioTrackSelectionProps) {
  const { addToast } = useToast();

  const {
    snapshot: { tracks: audioTracks, activeIndex: selectedAudioTrackIndex },
    refresh: refreshAudioTrack,
  } = usePlayerSubscription<AudioTrackSelection>({
    player,
    events: AUDIO_TRACK_EVENTS,
    selector: getAudioTrackSelection,
    fallback: NO_AUDIO_TRACKS,
  });

  const selectAudioTrack = (selectedIndex: number) => {
    if (!player) {
      return;
    }

    const trackLanguageSuffix = audioTracks[selectedIndex].language
      ? `- ${audioTracks[selectedIndex].language}`
      : '';
    const audioTrackName = `${audioTracks[selectedIndex].label}${trackLanguageSuffix}`;

    try {
      player.selectAudioTrack(audioTracks[selectedIndex], 1);
      refreshAudioTrack();

      addToast({
        icon: 'queue_music',
        text: `Switched audio to ${audioTrackName}`,
      });
    } catch (err) {
      addToast({
        icon: 'music_off',
        text: `Failed to switch audio to ${audioTrackName}`,
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
