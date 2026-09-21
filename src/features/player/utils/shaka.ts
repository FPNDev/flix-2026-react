import shaka from 'shaka-player';

export function isShakaActive(player: shaka.Player) {
  return ![
    shaka.Player.LoadMode.NOT_LOADED,
    shaka.Player.LoadMode.DESTROYED,
  ].includes(player.getLoadMode());
}
