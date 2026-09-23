import { useContextOrThrow } from '@/utils/context';
import { createContext } from 'react';
import type {
  MediaFileActions,
  MediaFilesState,
} from '../types/mediaFiles.types';

export const MediaFilesStateContext = createContext<MediaFilesState | null>(
  null,
);
export const MediaFileActionsContext = createContext<MediaFileActions | null>(
  null,
);

export const useMediaFiles = () =>
  useContextOrThrow(
    MediaFilesStateContext,
    'useMediaFiles called outside of MediaFilesProvider',
  );

export const useMediaFileActions = () =>
  useContextOrThrow(
    MediaFileActionsContext,
    'useMediaFileActions called outside of MediaFilesProvider',
  );
