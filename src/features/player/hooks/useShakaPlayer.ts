import { queue, type Queue } from '@/utils/queue';
import { useLayoutEffect, useRef } from 'react';
import shaka from 'shaka-player';
import { SHAKA_CONFIG } from '../config/shaka';

type UseShakaPlayerProps = {
  video?: HTMLVideoElement;
};

shaka.polyfill.installAll();

/**
 * Manages Shaka Player under given video element as a hook
 * Detach/attach & destroy implemented
 */
export function useShakaPlayer({ video }: UseShakaPlayerProps) {
  const playerRef = useRef<shaka.Player>(null);
  const playerQueueRef = useRef<Queue>(null);

  // Create a new Shaka Player instance and configure it when the component mounts
  useLayoutEffect(() => {
    if (!shaka.Player.isBrowserSupported()) {
      return;
    }

    const player = (playerRef.current = new shaka.Player());
    const playerQueue = (playerQueueRef.current = queue());

    player.configure(SHAKA_CONFIG);
    (window as any)['shaka'] = player;

    return () => {
      playerQueue.add(() => player.destroy());
    };
  }, []);

  // Attach the Shaka Player to the video element when it changes
  useLayoutEffect(() => {
    if (!video) {
      return;
    }

    const player = playerRef.current;
    const playerQueue = playerQueueRef.current;

    playerQueue!.add(() => player!.attach(video));

    return () => {
      playerQueue!.add(() => player!.detach());
    };
  }, [video]);

  return { playerRef, playerQueueRef };
}
