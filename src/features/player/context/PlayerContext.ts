import { useContextOrThrow } from '@/hooks/useContextOrThrow';
import { createContext, type RefCallback } from 'react';
import type { LevelInfo, TrackType, VideoSdk } from '../sdk';

export type PlayerSeeking = {
  targetTime: number | null;
};

export type PlayerState = {
  video: HTMLVideoElement | undefined;
  playerContainer: HTMLElement | undefined;
  player: VideoSdk | undefined;
  isLoading: boolean;
  level: LevelInfo | undefined;
  audioTracks: TrackType['audio'][];
  textTracks: TrackType['text'][];
  selectedAudioTrackIndex: number;
  selectedTextTrackIndex: number;
};

export type PlayerActions = {
  attachVideo: RefCallback<HTMLVideoElement>;
  setPlayerContainer: (playerContainer?: HTMLElement) => void;
  focusPlayer: () => void;
  load: (url: string) => Promise<void>;
  seekBy: (delta: number) => void;
  seekTo: (time: number) => void;
  selectAudioTrack: (audioTrackIndex: number) => void;
  selectTextTrack: (textTrackIndex: number) => void;
  navigateAudioTracks: (direction: -1 | 1) => void;
  navigateTextTracks: (direction: -1 | 1) => void;
  disableTextTrack: () => void;
};

export const PlayerActionsContext = createContext<PlayerActions | null>(null);
export const PlayerSeekingContext = createContext<PlayerSeeking | null>(null);
export const PlayerStateContext = createContext<PlayerState | null>(null);

export const usePlayerActions = () =>
  useContextOrThrow(
    PlayerActionsContext,
    'usePlayerActions called outside of PlayerProvider',
  );
export const usePlayerSeekingState = () =>
  useContextOrThrow(
    PlayerSeekingContext,
    'usePlayerSeekingState called outside of PlayerProvider',
  );
export const usePlayerState = () =>
  useContextOrThrow(
    PlayerStateContext,
    'usePlayerState called outside of PlayerProvider',
  );
