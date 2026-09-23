import type { ToastInfo } from '@/components/DesignSystem/Toast';
import type { TrackType } from '../types/tracks.types';
import { getTrackDisplayName } from '../utils/tracks';

type MessageGroup = {
  [key in keyof TrackType]: (track: TrackType[key]) => ToastInfo;
};

type DisabledMessageGroup = {
  [key in keyof TrackType]?: () => ToastInfo;
};

type CompareFields = {
  [key in keyof TrackType]: {
    primary: keyof TrackType[key];
    fields: (keyof TrackType[key])[];
  };
};

export const TRACK_SELECTION_TOASTS: {
  disabled: DisabledMessageGroup;
  activated: MessageGroup;
  failed: MessageGroup;
} = {
  disabled: {
    TextTrack: () => ({ text: 'Subtitles disabled', icon: 'subtitles_off' }),
  },
  activated: {
    TextTrack: (track) => ({
      text: `Subtitles changed to ${getTrackDisplayName(track)}`,
      icon: 'subtitles',
    }),
    AudioTrack: (track) => ({
      text: `Audio changed to ${getTrackDisplayName(track)}`,
      icon: 'queue_music',
    }),
    VideoTrack: (track) => ({
      text: `Video track changed to ${getTrackDisplayName(track)}`,
      icon: 'playlist_play',
    }),
  },
  failed: {
    TextTrack: (track) => ({
      text: `Failed to switch subtitles to ${getTrackDisplayName(track)}`,
      icon: 'subtitles_off',
    }),
    AudioTrack: (track) => ({
      text: `Failed to switch audio to ${getTrackDisplayName(track)}`,
      icon: 'music_off',
    }),
    VideoTrack: (track) => ({
      text: `Failed to switch video track to ${getTrackDisplayName(track)}`,
      icon: 'playlist_remove',
    }),
  },
};

export const TRACK_COMPARE_FIELDS: CompareFields = {
  AudioTrack: {
    primary: 'language',
    fields: ['channelsCount', 'spatialAudio', 'audioSamplingRate', 'label'],
  },
  TextTrack: {
    primary: 'language',
    fields: ['label'],
  },
  VideoTrack: {
    primary: 'language',
    fields: ['bandwidth', 'hdr', 'width', 'height'],
  },
};
