import { useContextOrThrow } from '@/hooks/useContextOrThrow';
import { createContext } from 'react';
import type { MediaFile } from '../api/remuxer';

type MediaFilesState = {
  files: MediaFile[];
  selectedFileIndex: number;
};

export type MediaFileActions = {
  navigateFiles: (direction: 1 | -1) => void;
  selectFile: (selectedIndex: number) => void;
  setFiles: (files: MediaFile[]) => void;
};

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
