import { useShakaPlayer } from './useShakaPlayer';
import { useTrackSelection } from './useTrackSelection';
import { useNextTrackPicker } from './useNextTrackPicker';
import { useVideoTrack } from './useVideoTrack';

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
    ? (new URL(activeURI).searchParams.get('source') ?? '')
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
    tracks: audioTracks,
    assetId,
    player,
    selectedTrackIndex: selectedAudioTrackIndex,
    selectTrack: selectAudioTrack,
    defaultIndex: 0,
  });

  useNextTrackPicker({
    trackType: 'TextTrack',
    tracks: textTracks,
    assetId,
    player,
    selectedTrackIndex: selectedTextTrackIndex,
    selectTrack: selectTextTrack,
    defaultIndex: undefined,
  });

  return {
    player,
    isLoading,
    activeURI,
    videoTrack,
    audioTracks,
    textTracks,
    selectedAudioTrackIndex,
    selectedTextTrackIndex,
    selectAudioTrack,
    selectTextTrack,
    navigateAudioTracks,
    navigateTextTracks,
    disableTextTrack,
    playFromURL,
  };
}
