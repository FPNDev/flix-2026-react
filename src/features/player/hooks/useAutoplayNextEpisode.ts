import { useEffect } from 'react';
import type { MediaFile } from '@/types/media';

type UseAutoplayNextEpisodeProps = {
  video?: HTMLVideoElement;
  files: MediaFile[];
  navigateFiles: (direction: 1 | -1) => void;
};

/**
 * Autoplays next episode when the previous one ends
 */
export function useAutoplayNextEpisode({
  video,
  files,
  navigateFiles,
}: UseAutoplayNextEpisodeProps) {
  useEffect(() => {
    if (!video) {
      return;
    }

    const onEnded = () => {
      if (files.length <= 1 || video.readyState < video.HAVE_CURRENT_DATA) {
        return;
      }

      navigateFiles(1);
    };

    video.addEventListener('ended', onEnded);
    return () => {
      video.removeEventListener('ended', onEnded);
    };
  }, [video, files, navigateFiles]);
}
