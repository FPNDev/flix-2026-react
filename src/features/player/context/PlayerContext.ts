import { useContextOrThrow } from '@/hooks/useContextOrThrow';
import { createContext } from 'react';
import type {
  PlayerActions,
  PlayerSeeking,
  PlayerState,
} from '../types/player.types';

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
