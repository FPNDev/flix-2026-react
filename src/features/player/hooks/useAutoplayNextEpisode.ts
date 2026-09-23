import { useEffect, useEffectEvent } from 'react';

type Props = {
  video: HTMLVideoElement | undefined;
  navigateFiles: (direction: 1 | -1) => void;
};

/**
 * Autoplays next episode when the previous one ends
 */
export function useAutoplayNextEpisode({ video, navigateFiles }: Props) {
  const navigateNextFile = useEffectEvent(() => navigateFiles(1));

  useEffect(() => {
    if (!video) {
      return;
    }

    const onEnded = () => {
      if (video.readyState < video.HAVE_CURRENT_DATA) {
        return;
      }

      navigateNextFile();
    };

    video.addEventListener('ended', onEnded);
    return () => {
      video.removeEventListener('ended', onEnded);
    };
  }, [video]);
}
