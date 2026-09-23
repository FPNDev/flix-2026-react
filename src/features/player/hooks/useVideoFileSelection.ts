import { useState } from 'react';
import type { MediaFile } from '../types/mediaFiles.types';

/**
 * Implements listing of media files within magnet link
 */
export function useVideoFileSelection() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);

  const selectFile = (index: number) => {
    const file = files[index];
    if (!file) {
      return;
    }

    setSelectedFileIndex(index);
  };

  const navigateFiles = (direction: -1 | 1) => {
    if (files.length <= 1) {
      return;
    }

    const nextIndex = Math.max(
      0,
      Math.min(files.length - 1, selectedFileIndex + direction),
    );
    if (nextIndex === selectedFileIndex) {
      return;
    }

    selectFile(nextIndex);
  };

  const setFilesAndResetIndex = (files: MediaFile[]) => {
    setFiles(files);
    setSelectedFileIndex(0);
  };

  return {
    files,
    selectedFileIndex,
    selectFile,
    navigateFiles,
    setFiles: setFilesAndResetIndex,
  };
}
