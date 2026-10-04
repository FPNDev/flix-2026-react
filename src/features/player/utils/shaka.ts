import shaka from 'shaka-player';
import { throwIfNotInterrupted } from './playerErrors';
import type { TrackType } from '../types/player.types';

export function isShakaActive(player?: shaka.Player) {
  return (
    player &&
    ![
      shaka.Player.LoadMode.NOT_LOADED,
      shaka.Player.LoadMode.DESTROYED,
    ].includes(player.getLoadMode())
  );
}

export function getTracks<T extends keyof TrackType>(
  player: shaka.Player,
  trackType: T,
): TrackType[T][] {
  switch (trackType) {
    case 'VideoTrack':
      return player.getVideoTracks() as TrackType[T][];
    case 'AudioTrack':
      return player.getAudioTracks() as TrackType[T][];
    case 'TextTrack':
      return player.getTextTracks() as TrackType[T][];
  }
}

export async function loadURL(player: shaka.Player, url: string) {
  try {
    await player.load(url);
  } catch (err) {
    throwIfNotInterrupted(err);
    return false;
  }

  return true;
}
