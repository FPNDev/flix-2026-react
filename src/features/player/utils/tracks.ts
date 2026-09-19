import type shaka from 'shaka-player';

export function getCurrentVideoTrack(player: shaka.Player) {
  return player.getVideoTracks().find(isActiveTrack);
}

export function getCurrentAudioTrack(player: shaka.Player) {
  return player.getAudioTracks().find(isActiveTrack);
}

export function isActiveTrack(
  track: shaka.extern.Track | shaka.extern.VideoTrack | shaka.extern.AudioTrack,
) {
  return track.active;
}
