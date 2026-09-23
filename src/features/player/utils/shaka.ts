import shaka from 'shaka-player';
import { throwIfNotInterrupted } from './playerErrors';

export function isShakaActive(player?: shaka.Player) {
  return (
    player &&
    ![
      shaka.Player.LoadMode.NOT_LOADED,
      shaka.Player.LoadMode.DESTROYED,
    ].includes(player.getLoadMode())
  );
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
