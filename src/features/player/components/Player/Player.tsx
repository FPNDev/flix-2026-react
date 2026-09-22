import classes from './Player.module.scss';
import { useFullscreenFocusGuard } from '@/hooks/useFullscreenFocusGuard';
import { usePlayerControlKeys } from '../../hooks/usePlayerControlKeys';
import { useAutoplayNextEpisode } from '../../hooks/useAutoplayNextEpisode';
import { usePlayerActions, usePlayerState } from '../../context/PlayerContext';
import { useCurrentVideoTrack } from '../../hooks/useCurrentVideoTrack';

export function Player() {
  const { video, playerContainer, player, files } = usePlayerState();
  const { setVideo, setPlayerContainer, navigateFiles, navigateAudioTracks } =
    usePlayerActions();

  const onVideoRef = (newVideo: HTMLVideoElement | null) => {
    setVideo(newVideo ?? undefined);
  };
  const onPlayerContainerRef = (newPlayerContainer: HTMLElement | null) => {
    setPlayerContainer(newPlayerContainer ?? undefined);
  };

  const videoTrack = useCurrentVideoTrack({ player });

  useAutoplayNextEpisode({
    video,
    files,
    navigateFiles,
  });
  usePlayerControlKeys({
    video,
    frameRate: videoTrack?.frameRate ?? 0,
    playerContainer,
    navigateFiles,
    navigateAudioTracks,
  });
  useFullscreenFocusGuard();

  return (
    <div
      className={classes.playerContainer}
      ref={onPlayerContainerRef}
      tabIndex={-1}
    >
      <video className={classes.video} ref={onVideoRef} controls />
    </div>
  );
}

export default Player;
