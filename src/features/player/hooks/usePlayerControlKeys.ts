import { PLAYER_CONTROL_KEYS } from '@/features/player/constants/playerControlKeys';
import { addExclusiveKeyUpListener } from '@/utils/keyboard';
import { useEffect, useEffectEvent } from 'react';
import { usePlayerActions, usePlayerState } from '../context/PlayerContext';
import { useMediaFileActions } from '../context/MediaFilesContext';
/**
 * Binds hotkeys to different player controls
 */
export function usePlayerControlKeys() {
  const state = usePlayerState();
  const actions = usePlayerActions();
  const fileActions = useMediaFileActions();

  const { video, playerContainer } = state;

  const onKeyUp = useEffectEvent((ev: KeyboardEvent) => {
    const { code } = ev;

    // Generic video controls - volume, fullscreen etc - state agnostic
    if (code in PLAYER_CONTROL_KEYS) {
      ev.preventDefault();
      return PLAYER_CONTROL_KEYS[code]({
        state: state as typeof state & {
          video: NonNullable<typeof state.video>;
          playerContainer: NonNullable<typeof state.playerContainer>;
        },
        actions,
        fileActions,
        frameRate:
          state.videoTracks[state.selectedVideoTrackIndex]?.frameRate ?? 0,
        event: ev,
      });
    }
  });

  useEffect(() => {
    if (!video || !playerContainer) {
      return;
    }

    return addExclusiveKeyUpListener(playerContainer, onKeyUp);
  }, [video, playerContainer]);
}
