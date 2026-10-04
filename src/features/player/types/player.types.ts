import type shaka from 'shaka-player';

export type PlayerSeeking = {
  targetTime: number | null;
};

export type PlayerState = {
  video: HTMLVideoElement | undefined;
  playerContainer: HTMLElement | undefined;
  player: shaka.Player | undefined;
  isLoading: boolean;
  activeURI: string;
  videoTrack: shaka.extern.VideoTrack | undefined;
  audioTracks: shaka.extern.AudioTrack[];
  textTracks: shaka.extern.TextTrack[];
  selectedAudioTrackIndex: number;
  selectedTextTrackIndex: number | undefined;
};

export type PlayerActions = {
  setVideo: (video?: HTMLVideoElement) => void;
  setPlayerContainer: (playerContainer?: HTMLElement) => void;
  focusPlayer: () => void;
  playFromURL: (sourceURL: string) => Promise<boolean>;
  seekBy: (delta: number) => void;
  seekTo: (time: number) => void;
  selectAudioTrack: (audioTrackIndex: number, showToast?: boolean) => void;
  selectTextTrack: (textTrackIndex: number, showToast?: boolean) => void;
  navigateAudioTracks: (direction: -1 | 1) => void;
  navigateTextTracks: (direction: -1 | 1) => void;
  disableTextTrack: (showToast?: boolean) => void;
};

export type TrackType = {
  VideoTrack: shaka.extern.VideoTrack;
  AudioTrack: shaka.extern.AudioTrack;
  TextTrack: shaka.extern.TextTrack;
};
