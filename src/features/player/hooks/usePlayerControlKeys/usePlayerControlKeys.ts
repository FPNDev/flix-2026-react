import { useEffect, useEffectEvent } from 'react';
import { usePlayerActions, usePlayerState } from '../../context/PlayerContext';
import { useMediaFileActions } from '../../context/MediaFilesContext';
import { PLAYER_CONTROL_KEYS } from './keyHandlers';
/**
 * Binds hotkeys to different player controls
 */
export function usePlayerControlKeys() {
  const state = usePlayerState();
  const actions = usePlayerActions();
  const fileActions = useMediaFileActions();

  const { video, playerContainer, level } = state;

  const onKeyDown = useEffectEvent((ev: KeyboardEvent) => {
    const { code } = ev;

    if (code in PLAYER_CONTROL_KEYS) {
      ev.preventDefault();

      return PLAYER_CONTROL_KEYS[code]({
        state: state as typeof state & {
          video: NonNullable<typeof state.video>;
          playerContainer: NonNullable<typeof state.playerContainer>;
        },
        actions,
        fileActions,
        frameRate: level?.frameRate ?? 24,
        event: ev,
      });
    }
  });

  useEffect(() => {
    if (!video || !playerContainer) {
      return;
    }

    playerContainer.addEventListener('keydown', onKeyDown);

    return () => {
      playerContainer.removeEventListener('keydown', onKeyDown);
    };
  }, [video, playerContainer]);
}
