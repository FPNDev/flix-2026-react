import type shaka from 'shaka-player';
import { isShakaActive } from './shaka';

export function getCurrentVideoTrack(player: shaka.Player) {
  return isShakaActive(player)
    ? player.getVideoTracks().find(isActiveTrack)
    : undefined;
}

export function getCurrentAudioTrack(player: shaka.Player) {
  return isShakaActive(player)
    ? player.getAudioTracks().find(isActiveTrack)
    : undefined;
}

export function isActiveTrack(
  track: shaka.extern.Track | shaka.extern.VideoTrack | shaka.extern.AudioTrack,
) {
  return track.active;
}
