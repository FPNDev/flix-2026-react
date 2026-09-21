import { type ToastInfo } from '@/components/DesignSystem/Toast';
import { toggleFullscreen } from '@/utils/fullscreen';
import { seekFrameByFrame } from '../utils/seeking';
import { SEEK_STEP } from '../config/controls';

type ActionParams = {
  video: HTMLVideoElement;
  frameRate: number;
  playerContainer: HTMLElement;
  event: KeyboardEvent;
  addToast: (toast: ToastInfo) => void;
};

type KeyActions = Record<string, (params: ActionParams) => boolean | void>;

/**
 * Video player general stateless hotkeys (advanced stateful ones are part of usePlayerControlKeys directly)
 */
export const PLAYER_CONTROL_KEYS: KeyActions = {
  KeyF: ({ playerContainer }) => toggleFullscreen(playerContainer),
  Enter: ({ playerContainer }) => toggleFullscreen(playerContainer),
  KeyC: ({ video, event: { shiftKey, altKey }, addToast }) => {
    if (!video.textTracks.length) {
      return;
    }

    const addSubtitlesToast = (track: TextTrack) => {
      addToast({
        icon: 'subtitles',
        text: `Changed subtitles to ${track.label} - ${track.language}`,
      });
    };

    const currentTrackIndex = Array.from(video.textTracks).findIndex(
      (track) => track.mode === 'showing',
    );
    const subtitlesEnabled = currentTrackIndex !== -1;

    if (!shiftKey && !subtitlesEnabled) {
      video.textTracks[0].mode = 'showing';
      addSubtitlesToast(video.textTracks[0]);
      return;
    }

    if (subtitlesEnabled) {
      video.textTracks[currentTrackIndex].mode = 'hidden';
    }

    const goBackwards = altKey;

    if (shiftKey) {
      const tracksCount = video.textTracks.length;
      const nextIndex =
        !subtitlesEnabled && goBackwards
          ? tracksCount - 1
          : currentTrackIndex + (goBackwards ? -1 : 1);

      if (
        !subtitlesEnabled ||
        (nextIndex !== -1 && nextIndex !== video.textTracks.length)
      ) {
        const realIndex = (tracksCount + nextIndex) % tracksCount;
        video.textTracks[realIndex].mode = 'showing';

        addSubtitlesToast(video.textTracks[realIndex]);

        return;
      }
    }

    addToast({
      icon: 'subtitles',
      text: 'Subtitles have been disabled',
      variant: 'danger',
    });
  },
  KeyM: ({ video, addToast }) => {
    if (video.muted) {
      video.muted = false;
    } else {
      video.muted = true;
    }

    addToast({
      icon: video.muted ? 'volume_mute' : 'volume_up',
      text: video.muted ? 'Video muted' : 'Video unmuted',
    });
  },
  Space: ({ event, video }) => {
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
  ArrowLeft: ({ video, event }) => {
    if (event.target === video) {
      return;
    }
    video.currentTime -= SEEK_STEP;
  },
  ArrowRight: ({ video, event }) => {
    if (event.target === video) {
      return;
    }
    video.currentTime += SEEK_STEP;
  },
  Comma: ({ video, frameRate }) => {
    seekFrameByFrame({ video, frameRate, direction: -1 });
  },
  Period: ({ video, frameRate }) => {
    seekFrameByFrame({ video, frameRate, direction: 1 });
  },
} as const;
