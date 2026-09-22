import { useState, type PropsWithChildren } from 'react';
import { PlayerActionsContext, PlayerStateContext } from './PlayerContext';
import { usePlayerSession } from '../hooks/usePlayerSession';

export function PlayerProvider({ children }: PropsWithChildren) {
  const [video, setVideo] = useState<HTMLVideoElement>();
  const [playerContainer, setPlayerContainer] = useState<HTMLElement>();

  const {
    activeURI,
    files,
    selectedFileIndex,
    selectFile,
    playFromURL,
    audioTracks,
    selectedAudioTrackIndex,
    selectAudioTrack,
    player,
    isLoading,
    navigateAudioTracks,
    navigateFiles,
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
        setVideo,
        setPlayerContainer,
        selectFile,
        selectAudioTrack,
        playFromURL,
        focusPlayer,
        navigateAudioTracks,
        navigateFiles,
      }}
    >
      <PlayerStateContext
        value={{
          activeURI,
          files,
          selectedFileIndex,
          selectedAudioTrackIndex,
          audioTracks,
          video,
          player,
          playerContainer,
          isLoading,
        }}
      >
        {children}
      </PlayerStateContext>
    </PlayerActionsContext>
  );
}

export default PlayerProvider;
