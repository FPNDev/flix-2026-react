import { toggleFullscreen } from '@/utils/fullscreen';
import { seekFrameByFrame } from '../utils/seeking';
import { SEEK_STEP } from '../config/controls';
import type { PlayerActions, PlayerState } from '../types/player.types';
import type { MediaFileActions } from '../types/mediaFiles.types';

type ActionParams = {
  event: KeyboardEvent;
  state: PlayerState & {
    playerContainer: NonNullable<PlayerState['playerContainer']>;
    video: NonNullable<PlayerState['video']>;
  };
  actions: PlayerActions;
  fileActions: MediaFileActions;
  frameRate: number;
};

type KeyActions = Record<string, (params: ActionParams) => boolean | void>;

/**
 * Video player general stateless hotkeys (advanced stateful ones are part of usePlayerControlKeys directly)
 */
export const PLAYER_CONTROL_KEYS: KeyActions = {
  KeyF: ({ state: { playerContainer } }) => toggleFullscreen(playerContainer),
  Enter: ({ state: { playerContainer } }) => toggleFullscreen(playerContainer),
  KeyC: ({ state, actions, event: { shiftKey, altKey } }) => {
    if (!state.textTracks.length) {
      return;
    }

    if (!shiftKey) {
      return state.selectedTextTrackIndex !== undefined
        ? actions.disableTextTrack(true)
        : actions.selectTextTrack(0, true);
    }

    return actions.navigateTextTracks(altKey ? -1 : 1);
  },
  KeyA: ({ actions, event: { shiftKey } }) => {
    actions.navigateAudioTracks(shiftKey ? -1 : 1);
  },
  KeyN: ({ fileActions, event: { shiftKey } }) => {
    if (!shiftKey) {
      return;
    }

    fileActions.navigateFiles(1);
  },
  KeyP: ({ fileActions, event: { shiftKey } }) => {
    if (!shiftKey) {
      return;
    }

    fileActions.navigateFiles(-1);
  },
  KeyM: ({ state: { video } }) => {
    if (video.muted) {
      video.muted = false;
    } else {
      video.muted = true;
    }
  },
  Space: ({ event, state: { video } }) => {
    if (event.target === video) {
      return;
    }

    if (
      video.paused &&
      video.duration &&
      video.readyState >= video.HAVE_CURRENT_DATA
    ) {
      video.play();
    } else {
      video.pause();
    }
  },
  ArrowLeft: ({ state: { video }, event }) => {
    if (event.target === video) {
      return;
    }
    video.currentTime -= SEEK_STEP;
  },
  ArrowRight: ({ state: { video }, event }) => {
    if (event.target === video) {
      return;
    }
    video.currentTime += SEEK_STEP;
  },
  Comma: ({ state: { video }, frameRate }) => {
    seekFrameByFrame({ video, frameRate, direction: -1 });
  },
  Period: ({ state: { video }, frameRate }) => {
    seekFrameByFrame({ video, frameRate, direction: 1 });
  },
} as const;
