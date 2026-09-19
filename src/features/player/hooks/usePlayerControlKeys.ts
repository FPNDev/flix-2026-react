import { useToast } from '@/components/DesignSystem/Toast';
import { PLAYER_CONTROL_KEYS } from '@/features/player/constants/playerControlKeys';
import { addExclusiveKeyUpListener } from '@/utils/keyboard';
import { useEffect } from 'react';

type UsePlayerHotkeysProps = {
  video?: HTMLVideoElement;
  playerContainer?: HTMLElement;
  frameRate: number;
  navigateFiles: (direction: 1 | -1) => void;
  navigateAudioTracks: (direction: 1 | -1) => void;
};

/**
 * Binds hotkeys to different player controls
 */
export function usePlayerControlKeys({
  video,
  frameRate,
  playerContainer,
  navigateFiles,
  navigateAudioTracks,
}: UsePlayerHotkeysProps) {
  const { addToast } = useToast();

  useEffect(() => {
    if (!video || !playerContainer) {
      return;
    }

    return addExclusiveKeyUpListener(playerContainer, (ev) => {
      const { shiftKey, code } = ev;

      // Generic video controls - volume, fullscreen etc - state agnostic
      if (code in PLAYER_CONTROL_KEYS) {
        ev.preventDefault();
        return PLAYER_CONTROL_KEYS[code]({
          video,
          frameRate,
          playerContainer,
          event: ev,
          addToast,
        });
      }

      if (code === 'KeyA') {
        ev.preventDefault();
        navigateAudioTracks(shiftKey ? -1 : 1);
        return;
      }

      if (shiftKey) {
        if (code === 'KeyP' || code === 'KeyN') {
          ev.preventDefault();
          navigateFiles(code === 'KeyP' ? -1 : 1);
          return;
        }
      }
    });
  }, [
    video,
    playerContainer,
    frameRate,
    navigateFiles,
    navigateAudioTracks,
    addToast,
  ]);
}
