import { toggleFullscreen } from '@/utils/fullscreen';
import type { PlayerActions, PlayerState } from '../../context/PlayerContext';
import type { MediaFileActions } from '../../context/MediaFilesContext';

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
    player: NonNullable<PlayerState['player']>;
  };
  actions: PlayerActions;
  fileActions: MediaFileActions;
  frameRate: number;
};

type KeyActions = Record<string, (params: ActionParams) => unknown>;

function toggleFullscreenKey({
  state: { playerContainer },
  event: { repeat },
}: ActionParams) {
  if (repeat) {
    return;
  }

  void toggleFullscreen(playerContainer);
}

/**
 * Video player general stateless hotkeys (advanced stateful ones are part of usePlayerControlKeys directly)
 */
export const PLAYER_CONTROL_KEYS: KeyActions = {
  KeyF: toggleFullscreenKey,
  Enter: toggleFullscreenKey,
  KeyC: ({ state, actions, event: { shiftKey, altKey, repeat } }) => {
    if (repeat || state.textTracks.length === 0) {
      return;
    }

    if (!shiftKey) {
      if (state.selectedTextTrackIndex === -1) {
        actions.selectTextTrack(0);
      } else {
        actions.disableTextTrack();
      }

      return;
    }

    actions.navigateTextTracks(altKey ? -1 : 1);
  },
  KeyA: ({ actions, event: { shiftKey, repeat } }) => {
    if (repeat) {
      return;
    }

    actions.navigateAudioTracks(shiftKey ? -1 : 1);
  },
  KeyN: ({ fileActions, event: { shiftKey, repeat } }) => {
    if (!shiftKey || repeat) {
      return;
    }

    fileActions.navigateFiles(1);
  },
  KeyP: ({ fileActions, event: { shiftKey, repeat } }) => {
    if (!shiftKey || repeat) {
      return;
    }

    fileActions.navigateFiles(-1);
  },
  KeyM: ({ state: { video }, event: { repeat } }) => {
    if (repeat) {
      return;
    }

    video.muted = !video.muted;
  },
  Space: ({ state: { video, player } }) => {
    if (
      video.paused &&
      video.duration &&
      video.readyState >= video.HAVE_CURRENT_DATA
    ) {
      void player.play();
    } else {
      video.pause();
    }
  },
  ArrowLeft: ({ actions }) => {
    actions.seekBy(-SEEK_STEP);
  },
  ArrowRight: ({ actions }) => {
    actions.seekBy(SEEK_STEP);
  },
  Comma: ({ state: { video }, frameRate }) => {
    seekFrameByFrame({ video, frameRate, direction: -1 });
  },
  Period: ({ state: { video }, frameRate }) => {
    seekFrameByFrame({ video, frameRate, direction: 1 });
  },
};
