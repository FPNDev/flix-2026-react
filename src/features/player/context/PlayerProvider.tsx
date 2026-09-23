import { useState, type PropsWithChildren } from 'react';
import { PlayerActionsContext, PlayerStateContext } from './PlayerContext';
import { usePlayerSession } from '../hooks/usePlayerSession';

export function PlayerProvider({ children }: PropsWithChildren) {
  const [video, setVideo] = useState<HTMLVideoElement>();
  const [playerContainer, setPlayerContainer] = useState<HTMLElement>();

  const {
    player,
    isLoading,
    activeURI,
    videoTracks,
    audioTracks,
    textTracks,
    selectedVideoTrackIndex,
    selectedAudioTrackIndex,
    selectedTextTrackIndex,
    selectAudioTrack,
    selectTextTrack,
    navigateAudioTracks,
    navigateTextTracks,
    disableTextTrack,
    playFromURL,
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
        selectAudioTrack,
        selectTextTrack,
        navigateAudioTracks,
        navigateTextTracks,
        disableTextTrack,
        playFromURL,
      }}
    >
      <PlayerStateContext
        value={{
          video,
          playerContainer,
          player,
          isLoading,
          activeURI,
          videoTracks,
          audioTracks,
          textTracks,
          selectedVideoTrackIndex,
          selectedAudioTrackIndex,
          selectedTextTrackIndex,
        }}
      >
        {children}
      </PlayerStateContext>
    </PlayerActionsContext>
  );
}

export default PlayerProvider;
