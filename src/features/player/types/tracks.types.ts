import type shaka from 'shaka-player';

export type TrackType = {
  AudioTrack: shaka.extern.AudioTrack;
  VideoTrack: shaka.extern.VideoTrack;
  TextTrack: shaka.extern.TextTrack;
};
