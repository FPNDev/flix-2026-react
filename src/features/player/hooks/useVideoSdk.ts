import { createVideoSdk, type VideoSdk } from '../sdk';
import { useState, type RefCallback } from 'react';
import { useToast } from '@/components/DesignSystem/Toast';

export function useVideoSdk() {
  const { addToast } = useToast();
  const [player, setPlayer] = useState<VideoSdk>();

  const attachVideo: RefCallback<HTMLVideoElement> = (video) => {
    if (!video) {
      return;
    }

    const newPlayer = createVideoSdk(video);

    if (!newPlayer) {
      addToast({
        icon: 'play_disabled',
        text: 'Browser does not support playback',
        variant: 'danger',
      });
      return;
    }

    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>)['__videoSdk'] = newPlayer;
    }

    setPlayer(newPlayer);

    return () => {
      newPlayer.destroy();
      setPlayer(undefined);
    };
  };

  return { player, attachVideo };
}
