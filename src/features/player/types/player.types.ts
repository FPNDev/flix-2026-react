import type { MediaFile } from '@/types/media';
import type shaka from 'shaka-player';

export type PlayerState = {
  activeURI: string;
  files: MediaFile[];
  selectedFileIndex: number;
  audioTracks: shaka.extern.AudioTrack[];
  selectedAudioTrackIndex: number;
  isLoading: boolean;
  video: HTMLVideoElement | undefined;
  player: shaka.Player | undefined;
  playerContainer: HTMLElement | undefined;
};

export type PlayerActions = {
  setVideo: (video?: HTMLVideoElement) => void;
  setPlayerContainer: (playerContainer?: HTMLElement) => void;
  selectFile: (fileIndex: number) => void;
  selectAudioTrack: (audioTrackIndex: number, showToast?: boolean) => void;
  playFromURL: (magnetURL: string) => void;
  navigateFiles: (direction: -1 | 1) => void;
  navigateAudioTracks: (direction: -1 | 1) => void;
  focusPlayer: () => void;
};
