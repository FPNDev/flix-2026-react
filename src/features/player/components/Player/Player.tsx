import classes from './Player.module.scss';
import { useFullscreenFocusGuard } from '@/hooks/useFullscreenFocusGuard';
import { usePlayerActions } from '../../context/PlayerContext';
import { usePlayerControlKeys } from '../../hooks/usePlayerControlKeys';

export function Player() {
  const { attachVideo, setPlayerContainer } = usePlayerActions();

  const onPlayerContainerRef = (newPlayerContainer: HTMLElement | null) => {
    setPlayerContainer(newPlayerContainer ?? undefined);
  };

  usePlayerControlKeys();
  useFullscreenFocusGuard();

  return (
    <div
      className={classes.playerContainer}
      ref={onPlayerContainerRef}
      tabIndex={-1}
    >
      <video className={classes.video} ref={attachVideo} controls playsInline />
    </div>
  );
}
