import type shaka from 'shaka-player';
import { getCurrentVideoTrack } from '../utils/tracks';
import { usePlayerSubscription } from './usePlayerSubscription';

const VIDEO_TRACK_EVENTS = ['trackschanged', 'adaptation', 'unloading'];

type Props = {
  player: shaka.Player | undefined;
};
export function useCurrentVideoTrack({ player }: Props) {
  const { snapshot: videoTrack } = usePlayerSubscription<
    shaka.extern.VideoTrack | undefined
  >({
    player,
    events: VIDEO_TRACK_EVENTS,
    selector: getCurrentVideoTrack,
    fallback: undefined,
  });

  return player && videoTrack ? videoTrack : null;
}
