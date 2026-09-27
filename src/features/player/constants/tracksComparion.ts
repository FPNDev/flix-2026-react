import type { TrackType } from '../types/player.types';

type CompareFields = {
  [key in keyof TrackType]: {
    primary: keyof TrackType[key];
    fields: (keyof TrackType[key])[];
  };
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
