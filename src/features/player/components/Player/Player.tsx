import { useEffect, useEffectEvent, useState } from 'react';
import classes from './Player.module.scss';
import clsx from 'clsx';
import { useShakaPlayer } from '../../hooks/useShakaPlayer';
import { useAudioTrackSelection } from '../../hooks/useAudioTrackSelection';
import { useMagnetPlayer } from '../../hooks/useMagnetPlayer';
import { useAutoplayNextEpisode } from '../../hooks/useAutoplayNextEpisode';
import { usePlayerControlKeys } from '../../hooks/usePlayerControlKeys';
import { useFullscreenFocusGuard } from '@/hooks/useFullscreenFocusGuard';
import { GiB } from '@/constants/filesize';
import { Icon } from '@/components/DesignSystem/Icon';
import { useCurrentVideoTrack } from '../../hooks/useCurrentVideoTrack';
import { Row } from '@/components/DesignSystem/Layout';

export function Player() {
  const [video, setVideo] = useState<HTMLVideoElement>();
  const [playerContainer, setPlayerContainer] = useState<HTMLElement>();

  const [magnetURI, setMagnetURI] = useState('');

  const onVideoRef = (newVideo: HTMLVideoElement | null) => {
    setVideo(newVideo ?? undefined);
  };
  const onPlayerContainerRef = (newPlayerContainer: HTMLElement | null) => {
    setPlayerContainer(newPlayerContainer ?? undefined);
  };

  useFullscreenFocusGuard();

  const {
    playerRef: { current: player },
    playerQueueRef: { current: playerQueue },
  } = useShakaPlayer({ video });

  const {
    files,
    selectedFileIndex,
    setSelectedFileIndex,
    prepareAndPlay,
    navigateFiles,
  } = useMagnetPlayer({
    player,
    playerQueue,
    magnetURI,
    multiple: true,
  });

  const videoTrack = useCurrentVideoTrack({ player: player });

  const {
    audioTracks,
    selectedAudioTrackIndex,
    selectAudioTrack,
    navigateAudioTracks,
  } = useAudioTrackSelection({
    player,
  });

  useAutoplayNextEpisode({
    video,
    files,
    navigateFiles: navigateFiles,
  });
  usePlayerControlKeys({
    video,
    frameRate: videoTrack?.frameRate ?? 0,
    playerContainer,
    navigateFiles,
    navigateAudioTracks,
  });

  const submitForm = () => {
    if (!playerContainer) {
      return;
    }

    prepareAndPlay();
    playerContainer.focus();
  };

  const focusVideo = useEffectEvent(() => {
    playerContainer?.focus();
  });

  useEffect(() => {
    if (
      selectedAudioTrackIndex === undefined ||
      selectedFileIndex === undefined
    ) {
      return;
    }

    focusVideo();
  }, [selectedFileIndex, selectedAudioTrackIndex]);

  return (
    <div className={classes.container}>
      <div
        className={classes.playerContainer}
        ref={onPlayerContainerRef}
        tabIndex={-1}
      >
        <video className={classes.video} ref={onVideoRef} controls />
      </div>
      <form
        className={clsx(classes.controlForm, 't-body-lg')}
        action={submitForm}
      >
        <input
          name="magnetURI"
          value={magnetURI}
          placeholder="Magnet URI"
          onChange={(ev) => setMagnetURI(ev.target.value)}
          autoFocus
        />
        <Row spacing={2} equal>
          <select
            name="fileIndex"
            value={selectedFileIndex}
            onChange={(ev) => setSelectedFileIndex(+ev.target.value)}
          >
            <option hidden>Select File</option>
            {files.map((file, index) => (
              <option key={file.index} value={index}>
                {file.name} - {(file.length / GiB).toFixed(1)} GiB
              </option>
            ))}
          </select>

          <select
            name="audioTrackIndex"
            value={selectedAudioTrackIndex}
            onChange={(ev) => selectAudioTrack(+ev.target.value)}
          >
            <option hidden>Select Audio Track</option>
            {audioTracks.map((audioTrack, index) => (
              <option key={audioTrack.key} value={index}>
                {audioTrack.label} - {audioTrack.language}
              </option>
            ))}
          </select>
        </Row>
        <button className="btn btn--lg btn--primary">
          <Icon as="span" icon="play_arrow" size="xl" variant="fill" />
        </button>
      </form>
    </div>
  );
}
