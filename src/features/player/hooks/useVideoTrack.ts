import type shaka from 'shaka-player';
import { usePlayerSubscription } from './usePlayerSubscription';

const VIDEO_TRACK_EVENTS = ['loaded', 'unloaded', 'variantchanged'];

function getVideoTrack(player: shaka.Player) {
  return player.getVideoTracks().find((track) => track.active);
}

type Props = {
  player: shaka.Player | undefined;
};
export function useVideoTrack({ player }: Props) {
  return usePlayerSubscription<shaka.extern.VideoTrack | undefined>({
    player,
    events: VIDEO_TRACK_EVENTS,
    selector: getVideoTrack,
    fallback: undefined,
  }).snapshot;
}
