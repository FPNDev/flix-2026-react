import classes from './Player.module.scss';
import { useFullscreenFocusGuard } from '@/hooks/useFullscreenFocusGuard';
import { usePlayerControlKeys } from '../../hooks/usePlayerControlKeys';
import { useAutoplayNextEpisode } from '../../hooks/useAutoplayNextEpisode';
import { usePlayerActions, usePlayerState } from '../../context/PlayerContext';
import { useMediaFileActions } from '../../context/MediaFilesContext';

export function Player() {
  const { video } = usePlayerState();
  const { setVideo, setPlayerContainer } = usePlayerActions();
  const { navigateFiles } = useMediaFileActions();

  const onVideoRef = (newVideo: HTMLVideoElement | null) => {
    setVideo(newVideo ?? undefined);
  };
  const onPlayerContainerRef = (newPlayerContainer: HTMLElement | null) => {
    setPlayerContainer(newPlayerContainer ?? undefined);
  };

  useAutoplayNextEpisode({
    video,
    navigateFiles,
  });
  usePlayerControlKeys();
  useFullscreenFocusGuard();

  return (
    <div
      className={classes.playerContainer}
      ref={onPlayerContainerRef}
      tabIndex={-1}
    >
      <video className={classes.video} ref={onVideoRef} controls playsInline />
    </div>
  );
}

export default Player;
