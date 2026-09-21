import { useShakaPlayer } from './useShakaPlayer';
import { useMagnetPlayer } from './useMagnetPlayer';
import { useCurrentVideoTrack } from './useCurrentVideoTrack';
import { useAudioTrackSelection } from './useAudioTrackSelection';
import { useAutoplayNextEpisode } from './useAutoplayNextEpisode';
import { usePlayerControlKeys } from './usePlayerControlKeys';

type UsePlayerSessionProps = {
  video?: HTMLVideoElement;
  playerContainer?: HTMLElement;
  magnetURI: string;
};

/**
 * Composes the player hooks into a single playback session
 */
export function usePlayerSession({
  video,
  playerContainer,
  magnetURI,
}: UsePlayerSessionProps) {
  const { player, playerQueue } = useShakaPlayer({ video });

  const {
    activeURI,
    files,
    selectedFileIndex,
    selectFile,
    prepareAndPlay,
    navigateFiles,
  } = useMagnetPlayer({
    player,
    playerQueue,
    magnetURI,
    multiple: true,
  });

  const videoTrack = useCurrentVideoTrack({ player });

  const {
    audioTracks,
    selectedAudioTrackIndex,
    selectAudioTrack,
    navigateAudioTracks,
  } = useAudioTrackSelection({
    player,
  });

  useAutoplayNextEpisode({
    video,
    files,
    navigateFiles,
  });
  usePlayerControlKeys({
    video,
    frameRate: videoTrack?.frameRate ?? 0,
    playerContainer,
    navigateFiles,
    navigateAudioTracks,
  });

  return {
    activeURI,
    files,
    selectedFileIndex,
    selectFile,
    prepareAndPlay,
    audioTracks,
    selectedAudioTrackIndex,
    selectAudioTrack,
    player,
  };
}
