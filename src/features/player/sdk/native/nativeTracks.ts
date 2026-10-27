import { USER_TEXT_KINDS, type TrackType } from '../types';

type Binding = [target: EventTarget, type: string, listener: () => void];

const NO_VIDEO_TRACKS: TrackType['video'][] = [];

function dispatch(video: HTMLVideoElement, type: string) {
  video.dispatchEvent(new CustomEvent(type));
}

export function attachNativeTracks(video: HTMLVideoElement) {
  let audioTracks: AudioTrack[] = [];
  let audioInfos: TrackType['audio'][] = [];
  let textTracks: TextTrack[] = [];
  let textInfos: TrackType['text'][] = [];
  let audioTrackIndex = -1;
  let textTrackIndex = -1;
  let videoInfos = NO_VIDEO_TRACKS;
  let videoTrackHeight = -1;

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
    if (height === videoTrackHeight) {
      return;
    }
    videoTrackHeight = height;
    videoInfos = [{ name: height ? `${height}p` : '' }];
    dispatch(video, 'video:updated');
    dispatch(video, 'video:selected');
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
    videoTrackHeight = -1;
    videoInfos = NO_VIDEO_TRACKS;
    dispatch(video, 'video:updated');
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
    tracks: {
      get audioTracks() {
        return audioInfos;
      },
      get audioTrack() {
        return audioTrackIndex;
      },
      selectAudioTrack: (index: number) => {
        for (const [i, track] of audioTracks.entries()) {
          track.enabled = i === index;
        }
        audioTrackIndex = index;
      },

      get textTracks() {
        return textInfos;
      },
      get textTrack() {
        return textTrackIndex;
      },
      selectTextTrack: (index: number) => {
        for (const [i, track] of textTracks.entries()) {
          track.mode = i === index ? 'showing' : 'disabled';
        }
        textTrackIndex = index;
      },

      get videoTracks() {
        return videoInfos;
      },
      get videoTrack() {
        return 0;
      },
      selectVideoTrack: () => {},
    },

    detach: () => {
      for (const [target, type, listener] of bindings) {
        target.removeEventListener(type, listener);
      }
    },
  };
}
