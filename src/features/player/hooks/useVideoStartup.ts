import { useState } from 'react';
import { VideoError, VideoErrorCode, type VideoSdk } from '../sdk';

type Props = {
  player: VideoSdk | undefined;
  autoPlay: boolean;
};

export type LoadOptions = {
  startTime?: number;
  play?: boolean;
};

export function useVideoStartup({ player, autoPlay }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeURI, setActiveURI] = useState('');

  const load = async (
    url: string,
    { startTime, play = autoPlay }: LoadOptions = {},
  ) => {
    if (!player) {
      throw new VideoError(VideoErrorCode.UnsupportedBrowser);
    }

    setActiveURI(url);
    setIsLoading(true);

    try {
      await player.load(url, startTime);
      if (play) {
        void player.play();
      }

      setIsLoading(false);
    } catch (error) {
      if (
        !(error instanceof VideoError) ||
        error.code !== VideoErrorCode.Interrupted
      ) {
        setIsLoading(false);
      }

      throw error;
    }
  };

  return { isLoading, activeURI, load };
}
