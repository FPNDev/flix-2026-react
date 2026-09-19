import { useToast } from '@/components/DesignSystem/Toast';
import type { FilesResponse, MediaFile } from '@/types/media';
import { isAbortError, renewAbortController } from '@/utils/abort';
import { useEffect, useRef, useState } from 'react';
import { fetchMediaFiles } from '../api/playerApi';

/**
 * Implements listing of media files within magnet link
 */
export function useVideoFileSelection() {
  const { addToast } = useToast();

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>();

  const abortRef = useRef<AbortController>(null);

  const fetchFiles = async (magnetURI: string) => {
    setFiles([]);
    setSelectedFileIndex(undefined);

    if (!magnetURI) {
      return;
    }

    try {
      const data = await fetchMediaFiles<FilesResponse>(
        magnetURI,
        renewAbortController(abortRef).signal,
      );
      const playableFiles = data.files.filter((file) => file.playable);

      setFiles(playableFiles);
      setSelectedFileIndex(0);

      if (!playableFiles.length) {
        addToast({
          icon: 'play_disabled',
          text: `URI specified has no playable files`,
          variant: 'danger',
        });
      }
    } catch (err) {
      if (!isAbortError(err)) {
        addToast({
          icon: 'playlist_remove',
          text: `Failed to fetch file list for specified URI`,
          variant: 'danger',
        });
        console.error(err);
      }
    }
  };

  const navigateFiles = (direction: -1 | 1) => {
    if (files.length <= 1) {
      return;
    }

    setSelectedFileIndex((prevIndex) => {
      if (prevIndex === undefined) {
        return;
      }
      return Math.max(0, Math.min(files.length - 1, prevIndex + direction));
    });
  };

  useEffect(() => {
    if (selectedFileIndex === undefined || !files.length) {
      return;
    }

    addToast({
      icon: 'playlist_play',
      text: 'Playing ' + files[selectedFileIndex].name,
      variant: 'success',
    });
  }, [selectedFileIndex, files, addToast]);

  return {
    files,
    selectedFileIndex,
    setSelectedFileIndex,
    navigateFiles,
    fetchFiles,
  };
}
