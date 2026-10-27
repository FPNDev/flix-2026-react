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

  const { video, playerContainer, videoTrack } = state;

  const onKeyDown = useEffectEvent((ev: KeyboardEvent) => {
    const { code } = ev;

    if (code in PLAYER_CONTROL_KEYS) {
      ev.preventDefault();

      return PLAYER_CONTROL_KEYS[code]({
        state: state as typeof state & {
          video: NonNullable<typeof state.video>;
          player: NonNullable<typeof state.player>;
          playerContainer: NonNullable<typeof state.playerContainer>;
        },
        actions,
        fileActions,
        frameRate: videoTrack?.frameRate ?? 24,
        event: ev,
      });
    }
  });

  useEffect(() => {
    if (!video || !playerContainer) {
      return;
    }

    playerContainer.addEventListener('keydown', onKeyDown, { capture: true });

    return () => {
      playerContainer.removeEventListener('keydown', onKeyDown, {
        capture: true,
      });
    };
  }, [video, playerContainer]);
}
