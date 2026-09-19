import { useEffect, useState } from 'react';
import type shaka from 'shaka-player';
import { getCurrentVideoTrack } from '../utils/tracks';

type Props = {
  player?: Maybe<shaka.Player>;
};
export function useCurrentVideoTrack({ player }: Props) {
  const [videoTrack, setVideoTrack] = useState<shaka.extern.VideoTrack>();

  useEffect(() => {
    if (!player) {
      return;
    }

    // Extract video track on load / adaptation
    const onAdaptation = () => {
      setVideoTrack(getCurrentVideoTrack(player));
    };
    const onUnloading = () => {
      setVideoTrack(undefined);
    };

    player.addEventListener('trackschanged', onAdaptation);
    player.addEventListener('adaptation', onAdaptation);
    player.addEventListener('unloading', onUnloading);

    return () => {
      player.removeEventListener('trackschanged', onAdaptation);
      player.removeEventListener('adaptation', onAdaptation);
      player.removeEventListener('unloading', onUnloading);
    };
  }, [player]);

  return player && videoTrack ? videoTrack : null;
}
