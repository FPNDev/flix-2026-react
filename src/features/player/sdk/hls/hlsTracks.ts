import Hls from 'hls.js';
import type { LevelInfo } from '../types';

const NO_LEVELS: LevelInfo[] = [];

const dispatch = (video: HTMLVideoElement, type: string) => {
  video.dispatchEvent(new CustomEvent(type));
};

/** Fixes delay in audio selection with audioTrack = idx */
function fixAudioSelectionDelay(hls: Hls, video: HTMLVideoElement) {
  let waitingForFlush = false;
  hls.on(Hls.Events.BUFFER_FLUSHING, (_ev, data) => {
    if (
      data.startOffset <= video.currentTime &&
      data.endOffset >= video.currentTime
    ) {
      waitingForFlush = true;
    }
  });
  hls.on(Hls.Events.BUFFER_FLUSHED, () => {
    if (waitingForFlush) {
      waitingForFlush = false;
      video.currentTime -= 0.001;
    }
  });
}

export function attachHlsTracks(hls: Hls, video: HTMLVideoElement) {
  let levels = NO_LEVELS;

  hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
    dispatch(video, 'text:updated');
  });
  hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
    dispatch(video, 'audio:updated');
  });
  hls.on(Hls.Events.MANIFEST_LOADING, () => {
    levels = NO_LEVELS;
    dispatch(video, 'level:updated');
  });
  hls.on(Hls.Events.MANIFEST_PARSED, (_ev, data) => {
    levels = data.levels;
    dispatch(video, 'level:updated');
  });
  hls.on(Hls.Events.LEVELS_UPDATED, (_ev, data) => {
    levels = data.levels;
    dispatch(video, 'level:updated');
  });

  hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, () => {
    dispatch(video, 'text:selected');
  });
  hls.on(Hls.Events.AUDIO_TRACK_SWITCHING, () => {
    dispatch(video, 'audio:selected');
  });
  hls.on(Hls.Events.LEVEL_SWITCHING, () => {
    dispatch(video, 'level:selected');
  });

  fixAudioSelectionDelay(hls, video);

  return {
    audioTracks: () => hls.audioTracks,
    audioTrack: () => hls.audioTrack,
    selectAudioTrack: (index: number) => {
      hls.audioTrack = index;
    },

    textTracks: () => hls.subtitleTracks,
    textTrack: () => hls.subtitleTrack,
    selectTextTrack: (index: number) => {
      hls.subtitleTrack = index;
    },

    levels: () => levels,
    level: () => hls.loadLevel,
    selectLevel: (index: number) => {
      hls.currentLevel = index;
    },
  };
}
