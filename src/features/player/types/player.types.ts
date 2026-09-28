import type shaka from 'shaka-player';

export type PlayerState = {
  video: HTMLVideoElement | undefined;
  playerContainer: HTMLElement | undefined;
  player: shaka.Player | undefined;
  activeURI: string;
  isLoading: boolean;
  videoTrack: shaka.extern.VideoTrack | undefined;
  audioTracks: shaka.extern.AudioTrack[];
  textTracks: shaka.extern.TextTrack[];
  selectedAudioTrackIndex: number;
  selectedTextTrackIndex: number | undefined;
};

export type PlayerActions = {
  setVideo: (video?: HTMLVideoElement) => void;
  setPlayerContainer: (playerContainer?: HTMLElement) => void;
  selectAudioTrack: (audioTrackIndex: number, showToast?: boolean) => void;
  selectTextTrack: (textTrackIndex: number, showToast?: boolean) => void;
  navigateAudioTracks: (direction: -1 | 1) => void;
  navigateTextTracks: (direction: -1 | 1) => void;
  disableTextTrack: (showToast?: boolean) => void;
  playFromURL: (sourceURL: string) => Promise<boolean>;
  focusPlayer: () => void;
};

export type TrackType = {
  AudioTrack: shaka.extern.AudioTrack;
  TextTrack: shaka.extern.TextTrack;
};
