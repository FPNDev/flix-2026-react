import { useEffect, useRef, useState } from 'react';

type Props = {
  video: HTMLVideoElement | undefined;
  debounceBy?: number;
};

export function useSeeking({ video, debounceBy = 150 }: Props) {
  const seekTimeout = useRef<number>(0);
  const handleSeekedRef = useRef<() => void>(null);
  const wasPlayingRef = useRef<boolean>(null);

  const targetTimeRef = useRef<number | null>(null);
  const [targetTime, setTargetTimeState] = useState<number | null>(null);

  const setTargetTime = (time: number | null) => {
    setTargetTimeState(time);
    targetTimeRef.current = time;
  };

  const resetPreviousSeek = () => {
    if (!video) {
      return;
    }

    clearTimeout(seekTimeout.current);
    if (handleSeekedRef.current) {
      video.removeEventListener('seeked', handleSeekedRef.current);
      handleSeekedRef.current = null;
    }
  };

  const cleanup = () => {
    const haveToPlay = wasPlayingRef.current;

    resetPreviousSeek();
    setTargetTime(null);
    wasPlayingRef.current = null;

    if (video && haveToPlay) {
      void video.play();
    }
  };

  const seekTo = (seekTo: number) => {
    if (!video) {
      return;
    }

    resetPreviousSeek();
    setTargetTime(seekTo);
    wasPlayingRef.current = wasPlayingRef.current ?? !video.paused;

    const handleSeeked = (handleSeekedRef.current = () => {
      video.currentTime = seekTo;
      cleanup();
    });

    seekTimeout.current = setTimeout(() => {
      if (video.seeking) {
        video.addEventListener('seeked', handleSeeked, {
          once: true,
        });

        return;
      }

      handleSeeked();
    }, debounceBy);

    if (!video.paused) {
      video.pause();
    }

    return cleanup;
  };

  const seekBy = (delta: number) => {
    if (!video) {
      return;
    }

    return seekTo((targetTimeRef.current ?? video.currentTime) + delta);
  };

  useEffect(() => {
    if (!video) {
      return;
    }

    video.addEventListener('seeking', cleanup);

    return () => {
      video.removeEventListener('seeking', cleanup);
    };
  }, [video, cleanup]);

  return { targetTime, seekTo, seekBy };
}
