import { useState } from 'react';
import classes from './Player.module.scss';
import { usePlayerSession } from '../../hooks/usePlayerSession';
import { useFullscreenFocusGuard } from '@/hooks/useFullscreenFocusGuard';
import { MagnetForm } from '../MagnetForm';
import { TrackSelectors } from '../TrackSelectors';
import { useToast } from '@/components/DesignSystem/Toast';
import { isShakaActive } from '../../utils/shaka';

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
    activeURI,
    files,
    selectedFileIndex,
    selectFile,
    prepareAndPlay,
    audioTracks,
    selectedAudioTrackIndex,
    selectAudioTrack,
    player,
    isLoading,
  } = usePlayerSession({ video, playerContainer, magnetURI });

  const focusPlayer = () => {
    if (!playerContainer) {
      return;
    }

    playerContainer.focus();
  };

  const submitForm = (ev: React.SubmitEvent) => {
    ev.preventDefault();
    focusPlayer();

    if (
      activeURI === magnetURI &&
      ((player && isShakaActive(player)) || isLoading)
    ) {
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
    selectFile(+ev.target.value);
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
      <MagnetForm
        magnetURI={magnetURI}
        onMagnetURIChange={setMagnetURI}
        onSubmit={submitForm}
      >
        <TrackSelectors
          files={files}
          selectedFileIndex={selectedFileIndex}
          onFileIndexChange={onFileIndexChanged}
          audioTracks={audioTracks}
          selectedAudioTrackIndex={selectedAudioTrackIndex}
          onAudioTrackIndexChange={onAudioTrackIndexChanged}
        />
      </MagnetForm>
    </div>
  );
}
