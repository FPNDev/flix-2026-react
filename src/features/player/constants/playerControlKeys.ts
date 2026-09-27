import { toggleFullscreen } from '@/utils/fullscreen';
import type { PlayerActions, PlayerState } from '../types/player.types';
import type { MediaFileActions } from '../types/mediaFiles.types';

const SEEK_STEP = 5;

type SeekFrameByFrameParams = {
  video: HTMLVideoElement;
  direction: -1 | 1;
  frameRate: number;
};

function seekFrameByFrame({
  video,
  direction,
  frameRate,
}: SeekFrameByFrameParams) {
  if (!video.duration || !frameRate) {
    return;
  }
  if (!video.paused) {
    video.pause();
  }

  video.currentTime += direction / frameRate;
}

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
  KeyF: ({ state: { playerContainer } }) => {
    void toggleFullscreen(playerContainer);
  },
  Enter: ({ state: { playerContainer } }) => {
    void toggleFullscreen(playerContainer);
  },
  KeyC: ({ state, actions, event: { shiftKey, altKey } }) => {
    if (state.textTracks.length === 0) {
      return;
    }

    if (!shiftKey) {
      if (state.selectedTextTrackIndex === undefined) {
        actions.selectTextTrack(0, true);
      } else {
        actions.disableTextTrack(true);
      }

      return;
    }

    actions.navigateTextTracks(altKey ? -1 : 1);
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
      void video.play();
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
