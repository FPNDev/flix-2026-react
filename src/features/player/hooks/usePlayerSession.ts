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

const LEVEL_SELECTED_EVENTS = ['level:selected', 'unload'];

/**
 * Composes the player hooks into a single playback session
 */
export function usePlayerSession(): PlayerSession {
  const { files, selectedFileIndex } = useMediaFiles();
  const { navigateFiles } = useMediaFileActions();

  const { player, attachVideo } = useVideoSdk();
  const video = player?.video;

  const { load, isLoading, activeURI } = useVideoStartup({
    player,
    autoPlay: true,
  });
  const { seekBy, seekTo, targetTime } = useSeeking({ video });

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

  const { snapshot: level } = usePlayerSubscription({
    player,
    events: LEVEL_SELECTED_EVENTS,
    selector: (hls, evt) => {
      if (evt?.type === 'unload') {
        return;
      }

      return hls.levels()[hls.level()];
    },
    fallback: undefined,
  });

  useMediaSessionMetadata({ level, currentFile: files[selectedFileIndex] });

  return {
    video,
    player,
    isLoading,
    targetTime,
    level,
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
