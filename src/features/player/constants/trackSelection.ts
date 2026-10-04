import type { ToastInfo } from '@/components/DesignSystem/Toast';
import type { TrackType } from '../types/player.types';
import { getTrackDisplayName } from '../utils/tracks';

type MessageGroup = {
  [key in keyof TrackType]?: (track: TrackType[key]) => ToastInfo;
};

type DisabledMessageGroup = {
  [key in keyof TrackType]?: () => ToastInfo;
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
  },
};
