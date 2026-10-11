import { useState } from 'react';
import { VideoError, type VideoSdk } from '../sdk';

type Props = {
  player: VideoSdk | undefined;
  autoPlay: boolean;
};

export function useVideoStartup({ player, autoPlay }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeURI, setActiveURI] = useState('');

  const load = async (url: string) => {
    if (!player) {
      throw VideoError.Other;
    }

    setActiveURI(url);
    setIsLoading(true);

    try {
      await player.load(url);
      if (autoPlay) {
        void player.video.play();
      }

      setIsLoading(false);
    } catch (error) {
      if (error !== VideoError.Interrupted) {
        setIsLoading(false);
      }

      throw error;
    }
  };

  return { isLoading, activeURI, load };
}
