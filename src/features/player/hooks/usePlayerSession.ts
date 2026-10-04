import { useShakaPlayer } from './useShakaPlayer';
import { useTrackSelection } from './useTrackSelection';
import { useNextTrackPicker } from './useNextTrackPicker';
import { useVideoTrack } from './useVideoTrack';
import { useSeeking } from './useSeeking';
import { REMUXER_SOURCE_PARAM } from '../api/playerApi';

type Props = {
  video: HTMLVideoElement | undefined;
};

/**
 * Composes the player hooks into a single playback session
 */
export function usePlayerSession({ video }: Props) {
  const { player, activeURI, playFromURL, isLoading } = useShakaPlayer({
    video,
  });

  const assetId = activeURI
    ? (new URL(activeURI).searchParams.get(REMUXER_SOURCE_PARAM) ?? '')
    : '';

  const videoTrack = useVideoTrack({ player });

  const {
    tracks: audioTracks,
    selectedTrackIndex: selectedAudioTrackIndex,
    selectTrack: selectAudioTrack,
    navigateTracks: navigateAudioTracks,
  } = useTrackSelection({
    player,
    trackType: 'AudioTrack',
    bufferDuration: 1,
  });

  const {
    tracks: textTracks,
    selectedTrackIndex: selectedTextTrackIndex,
    selectTrack: selectTextTrack,
    navigateTracks: navigateTextTracks,
    disableTrack: disableTextTrack,
  } = useTrackSelection({
    player,
    trackType: 'TextTrack',
  });

  useNextTrackPicker({
    trackType: 'AudioTrack',
    assetId,
    player,
    defaultIndex: 0,
  });

  useNextTrackPicker({
    trackType: 'TextTrack',
    assetId,
    player,
    defaultIndex: undefined,
  });

  const { seekTo, seekBy, targetTime } = useSeeking({ video });

  return {
    player,
    isLoading,
    activeURI,
    targetTime,
    videoTrack,
    audioTracks,
    textTracks,
    selectedAudioTrackIndex,
    selectedTextTrackIndex,
    playFromURL,
    seekBy,
    seekTo,
    selectAudioTrack,
    selectTextTrack,
    navigateAudioTracks,
    navigateTextTracks,
    disableTextTrack,
  };
}
