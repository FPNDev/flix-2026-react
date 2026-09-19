import { useState } from 'react';
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
import { useToast } from '@/components/DesignSystem/Toast';

export function Player() {
  const { addToast } = useToast();

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
    activeURI,
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
    navigateFiles,
  });
  usePlayerControlKeys({
    video,
    frameRate: videoTrack?.frameRate ?? 0,
    playerContainer,
    navigateFiles,
    navigateAudioTracks,
  });

  const focusPlayer = () => {
    if (!playerContainer) {
      return;
    }

    playerContainer.focus();
  };

  const submitForm = (ev: React.SubmitEvent) => {
    ev.preventDefault();
    focusPlayer();

    if (activeURI === magnetURI) {
      const fileName = files.length ? files[selectedFileIndex].name : magnetURI;
      addToast({
        icon: 'playlist_remove',
        text: `Already playing ` + fileName,
        variant: 'danger',
      });
      return;
    }

    prepareAndPlay();
  };

  const onAudioTrackIndexChanged = (
    ev: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    selectAudioTrack(+ev.target.value);
    focusPlayer();
  };

  const onFileIndexChanged = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFileIndex(+ev.target.value);
    focusPlayer();
  };

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
        onSubmit={submitForm}
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
            onChange={onFileIndexChanged}
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
            onChange={onAudioTrackIndexChanged}
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
