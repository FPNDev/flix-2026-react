import { REMUXER_SOURCE_PARAM } from '../api/remuxer';
import {
  useMediaFileActions,
  useMediaFiles,
} from '../context/MediaFilesContext';
import type {
  PlayerActions,
  PlayerSeeking,
  PlayerState,
} from '../context/PlayerContext';
import { useAutoplayNextEpisode } from './useAutoplayNextEpisode';
import { useErrorHandling } from './useErrorHandling';
import { useMediaSessionMetadata } from './useMediaSessionMetadata';
import { usePlayerSubscription } from './usePlayerSubscription';
import { useRememberTrack } from './useRememberTrack';
import { useSeeking } from './useSeeking';
import { useTrackSelection } from './useTrackSelection';
import { useVideoSdk } from './useVideoSdk';
import { useVideoStartup } from './useVideoStartup';

type PlayerSession = Omit<PlayerState, 'playerContainer'> &
  Omit<PlayerActions, 'setPlayerContainer' | 'focusPlayer'> &
  PlayerSeeking;

const VIDEO_SELECTED_EVENTS = ['video:selected', 'unload'];

/**
 * Composes the player hooks into a single playback session
 */
export function usePlayerSession(): PlayerSession {
  const { files, selectedFileIndex } = useMediaFiles();
  const { navigateFiles } = useMediaFileActions();

  const { player, attachVideo } = useVideoSdk();
  const video = player?.video;

  const {
    load: loadVideo,
    isLoading,
    activeURI,
  } = useVideoStartup({
    player,
    autoPlay: true,
  });
  const currentFile = files[selectedFileIndex];
  const { load, isRecovering } = useErrorHandling({
    player,
    fileName: currentFile?.name,
    activeURI,
    load: loadVideo,
  });
  const { seekBy, seekTo, targetTime } = useSeeking({ player });

  const assetId = activeURI
    ? (new URL(activeURI).searchParams.get(REMUXER_SOURCE_PARAM) ?? '')
    : '';

  const {
    tracks: audioTracks,
    selectedTrackIndex: selectedAudioTrackIndex,
    selectTrack: restoreAudioTrack,
    selectTrackWithToast: selectAudioTrack,
    navigateTracks: navigateAudioTracks,
  } = useTrackSelection({ player, trackType: 'audio' });

  const {
    tracks: textTracks,
    selectedTrackIndex: selectedTextTrackIndex,
    selectTrack: restoreTextTrack,
    selectTrackWithToast: selectTextTrack,
    navigateTracks: navigateTextTracks,
    selectDefault: disableTextTrack,
  } = useTrackSelection({ player, trackType: 'text' });

  useRememberTrack({
    assetId,
    tracks: audioTracks,
    selectedTrackIndex: selectedAudioTrackIndex,
    selectTrack: restoreAudioTrack,
    trackType: 'audio',
  });

  useRememberTrack({
    assetId,
    tracks: textTracks,
    selectedTrackIndex: selectedTextTrackIndex,
    selectTrack: restoreTextTrack,
    trackType: 'text',
  });

  useAutoplayNextEpisode({ video, navigateFiles });

  const videoTrack = usePlayerSubscription({
    player,
    events: VIDEO_SELECTED_EVENTS,
    selector: (sdk, evt) => {
      if (evt?.type === 'unload') {
        return;
      }

      return sdk.videoTracks[sdk.videoTrack];
    },
    fallback: undefined,
  });

  useMediaSessionMetadata({ videoTrack, currentFile });

  return {
    video,
    player,
    isLoading: isLoading || isRecovering,
    targetTime,
    videoTrack,
    audioTracks,
    textTracks,
    selectedAudioTrackIndex,
    selectedTextTrackIndex,
    attachVideo,
    load,
    seekBy,
    seekTo,
    selectAudioTrack,
    selectTextTrack,
    navigateAudioTracks,
    navigateTextTracks,
    disableTextTrack,
  };
}
