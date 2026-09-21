import { useToast } from '@/components/DesignSystem/Toast';
import type { FilesResponse, MediaFile } from '@/types/media';
import { isAbortError, renewAbortController } from '@/utils/abort';
import { useRef, useState } from 'react';
import { fetchMediaFiles } from '../api/playerApi';

/**
 * Implements listing of media files within magnet link
 */
export function useVideoFileSelection() {
  const { addToast } = useToast();

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);

  const abortRef = useRef<AbortController>(null);

  const fetchFiles = async (magnetURI: string) => {
    setFiles([]);
    setSelectedFileIndex(0);

    if (!magnetURI) {
      return [];
    }

    try {
      const data = await fetchMediaFiles<FilesResponse>(
        magnetURI,
        renewAbortController(abortRef).signal,
      );
      const playableFiles = data.files.filter((file) => file.playable);

      setFiles(playableFiles);

      if (!playableFiles.length) {
        addToast({
          icon: 'play_disabled',
          text: `URI specified has no playable files`,
          variant: 'danger',
        });
      }

      return playableFiles;
    } catch (err) {
      if (!isAbortError(err)) {
        addToast({
          icon: 'playlist_remove',
          text: `Failed to fetch file list for specified URI`,
          variant: 'danger',
        });
        console.error(err);
      }

      return [];
    }
  };

  const selectFile = (index: number, fileList: MediaFile[] = files) => {
    const file = fileList[index];
    if (!file) {
      return;
    }

    setSelectedFileIndex(index);

    addToast({
      icon: 'playlist_play',
      text: 'Playing ' + file.name,
      variant: 'success',
    });

    return file;
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

    return selectFile(nextIndex);
  };

  return {
    files,
    selectedFileIndex,
    selectFile,
    navigateFiles,
    fetchFiles,
  };
}
