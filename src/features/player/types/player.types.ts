import type shaka from 'shaka-player';

export type PlayerState = {
  video: HTMLVideoElement | undefined;
  playerContainer: HTMLElement | undefined;
  player: shaka.Player | undefined;
  activeURI: string;
  isLoading: boolean;
  videoTracks: shaka.extern.VideoTrack[];
  audioTracks: shaka.extern.AudioTrack[];
  textTracks: shaka.extern.TextTrack[];
  selectedVideoTrackIndex: number;
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
  playFromURL: (magnetURL: string) => Promise<boolean>;
  focusPlayer: () => void;
};
