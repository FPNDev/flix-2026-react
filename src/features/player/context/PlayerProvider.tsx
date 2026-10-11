import { useState, type PropsWithChildren } from 'react';
import {
  PlayerActionsContext,
  PlayerSeekingContext,
  PlayerStateContext,
} from './PlayerContext';
import { usePlayerSession } from '../hooks/usePlayerSession';

export function PlayerProvider({ children }: PropsWithChildren) {
  const [playerContainer, setPlayerContainer] = useState<HTMLElement>();

  const {
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
  } = usePlayerSession();

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
        attachVideo,
        focusPlayer,
        load,
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
          level,
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
