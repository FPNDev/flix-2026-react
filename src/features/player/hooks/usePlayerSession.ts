import { useShakaPlayer } from './useShakaPlayer';
import { useMagnetPlayer } from './useMagnetPlayer';
import { useAudioTrackSelection } from './useAudioTrackSelection';

type UsePlayerSessionProps = {
  video: HTMLVideoElement | undefined;
};

/**
 * Composes the player hooks into a single playback session
 */
export function usePlayerSession({ video }: UsePlayerSessionProps) {
  const { player, playerQueue } = useShakaPlayer({ video });

  const {
    activeURI,
    files,
    selectedFileIndex,
    selectFile,
    playFromURL,
    isLoading,
    navigateFiles,
  } = useMagnetPlayer({
    player,
    playerQueue,
    multiple: true,
  });

  const {
    audioTracks,
    selectedAudioTrackIndex,
    selectAudioTrack,
    navigateAudioTracks,
  } = useAudioTrackSelection({
    player,
  });

  return {
    activeURI,
    files,
    selectedFileIndex,
    audioTracks,
    selectedAudioTrackIndex,
    selectAudioTrack,
    player,
    isLoading,
    navigateFiles,
    navigateAudioTracks,
    selectFile,
    playFromURL,
  };
}
