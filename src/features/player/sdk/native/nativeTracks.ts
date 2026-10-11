import type { LevelInfo, TrackType } from '../types';

type Binding = [target: EventTarget, type: string, listener: () => void];

const USER_TEXT_KINDS = new Set<string>(['subtitles', 'captions', 'forced']);
const NO_LEVELS: LevelInfo[] = [];

const dispatch = (video: HTMLVideoElement, type: string) => {
  video.dispatchEvent(new CustomEvent(type));
};

export function attachNativeTracks(video: HTMLVideoElement) {
  let audioTracks: AudioTrack[] = [];
  let audioInfos: TrackType['audio'][] = [];
  let textTracks: TextTrack[] = [];
  let textInfos: TrackType['text'][] = [];
  let audioTrackIndex = -1;
  let textTrackIndex = -1;
  let levels = NO_LEVELS;
  let levelHeight = -1;

  const onAudioListUpdated = () => {
    audioTracks = [];
    audioInfos = [];
    audioTrackIndex = -1;
    for (const track of video.audioTracks ?? []) {
      if (audioTrackIndex === -1 && track.enabled) {
        audioTrackIndex = audioTracks.length;
      }
      audioInfos.push({
        id: audioTracks.length,
        name: track.label,
        lang: track.language,
      });
      audioTracks.push(track);
    }
    dispatch(video, 'audio:updated');
  };

  const onTextListUpdated = () => {
    textTracks = [];
    textInfos = [];
    textTrackIndex = -1;
    for (const track of video.textTracks) {
      const kind: string = track.kind;
      if (USER_TEXT_KINDS.has(kind)) {
        if (textTrackIndex === -1 && track.mode === 'showing') {
          textTrackIndex = textTracks.length;
        }
        textTracks.push(track);
        textInfos.push({
          name: track.label,
          lang: track.language,
          forced: kind === 'forced',
        });
      }
    }
    dispatch(video, 'text:updated');
  };

  const onVideoSizeChanged = () => {
    const height = video.videoHeight;
    if (height === levelHeight) {
      return;
    }
    levelHeight = height;
    levels = [{ name: height ? `${height}p` : '' }];
    dispatch(video, 'level:updated');
    dispatch(video, 'level:selected');
  };

  const onTextSelected = () => {
    textTrackIndex = textTracks.findIndex((track) => track.mode === 'showing');
    dispatch(video, 'text:selected');
  };

  const onAudioSelected = () => {
    audioTrackIndex = audioTracks.findIndex((track) => track.enabled);
    dispatch(video, 'audio:selected');
  };

  const onEmptied = () => {
    levelHeight = -1;
    levels = NO_LEVELS;
    dispatch(video, 'level:updated');
    onAudioListUpdated();
    onTextListUpdated();
  };

  const bindings: Binding[] = [
    [video, 'loadedmetadata', onVideoSizeChanged],
    [video, 'resize', onVideoSizeChanged],
    [video, 'emptied', onEmptied],
    [video.textTracks, 'addtrack', onTextListUpdated],
    [video.textTracks, 'removetrack', onTextListUpdated],
    [video.textTracks, 'change', onTextSelected],
  ];

  if (video.audioTracks) {
    bindings.push(
      [video.audioTracks, 'addtrack', onAudioListUpdated],
      [video.audioTracks, 'removetrack', onAudioListUpdated],
      [video.audioTracks, 'change', onAudioSelected],
    );
  }

  for (const [target, type, listener] of bindings) {
    target.addEventListener(type, listener);
  }

  return {
    audioTracks: () => audioInfos,
    audioTrack: () => audioTrackIndex,
    selectAudioTrack: (index: number) => {
      for (const [i, track] of audioTracks.entries()) {
        track.enabled = i === index;
      }
      audioTrackIndex = index;
    },

    textTracks: () => textInfos,
    textTrack: () => textTrackIndex,
    selectTextTrack: (index: number) => {
      for (const [i, track] of textTracks.entries()) {
        track.mode = i === index ? 'showing' : 'disabled';
      }
      textTrackIndex = index;
    },

    levels: () => levels,
    level: () => 0,
    selectLevel: () => {},

    detach: () => {
      for (const [target, type, listener] of bindings) {
        target.removeEventListener(type, listener);
      }
    },
  };
}
