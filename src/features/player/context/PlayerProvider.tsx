import { useState, type PropsWithChildren } from 'react';
import {
  PlayerActionsContext,
  PlayerSeekingContext,
  PlayerStateContext,
} from './PlayerContext';
import { usePlayerSession } from '../hooks/usePlayerSession';

export function PlayerProvider({ children }: PropsWithChildren) {
  const [video, setVideo] = useState<HTMLVideoElement>();
  const [playerContainer, setPlayerContainer] = useState<HTMLElement>();

  const {
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
  } = usePlayerSession({ video });

  const focusPlayer = () => {
    if (!playerContainer) {
      return;
    }

    playerContainer.focus();
  };

  return (
    <PlayerActionsContext
      value={{
        setPlayerContainer,
        setVideo,
        focusPlayer,
        playFromURL,
        seekBy,
        seekTo,
        selectAudioTrack,
        selectTextTrack,
        navigateAudioTracks,
        navigateTextTracks,
        disableTextTrack,
      }}
    >
      <PlayerStateContext
        value={{
          video,
          playerContainer,
          player,
          isLoading,
          activeURI,
          videoTrack,
          audioTracks,
          textTracks,
          selectedAudioTrackIndex,
          selectedTextTrackIndex,
        }}
      >
        <PlayerSeekingContext value={{ targetTime }}>
          {children}
        </PlayerSeekingContext>
      </PlayerStateContext>
    </PlayerActionsContext>
  );
}

export default PlayerProvider;
