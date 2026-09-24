import clsx from 'clsx';
import classes from './MagnetForm.module.scss';
import { Icon } from '@/components/DesignSystem/Icon';
import { useToast } from '@/components/DesignSystem/Toast';
import { usePlayerActions, usePlayerState } from '../../context/PlayerContext';
import { isShakaActive } from '../../utils/shaka';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { TrackSelectors } from '../TrackSelectors';
import { magnetRemuxerURI } from '../../api/urls';
import {
  useMediaFileActions,
  useMediaFiles,
} from '../../context/MediaFilesContext';
import { renewAbortController } from '@/utils/abort';
import { fetchPlayableFiles } from '../../api/playerApi';
import { useMediaSessionMetadata } from '../../hooks/useMediaSessionMetadata';

const getManifestURL = (magnetURI: string, fileIndex: number) => {
  return magnetRemuxerURI('m3u8', {
    magnet: magnetURI,
    file: fileIndex,
  });
};

export function MagnetForm() {
  const { addToast } = useToast();
  const { playFromURL, focusPlayer } = usePlayerActions();
  const { player, isLoading, videoTracks, selectedVideoTrackIndex } =
    usePlayerState();

  const { files, selectedFileIndex } = useMediaFiles();
  const { setFiles } = useMediaFileActions();

  const magnetInputRef = useRef<HTMLInputElement>(null);
  const [magnetURI, setMagnetURI] = useState('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const abortRef = useRef<AbortController>(null);

  const submitForm = async (ev: React.SubmitEvent) => {
    ev.preventDefault();

    const magnetInput = magnetInputRef.current;
    if (!magnetInput) {
      return;
    }

    focusPlayer();

    const urlToPlay = magnetInput.value;
    const fileName =
      files.length > 0 ? files[selectedFileIndex].name : magnetURI;
    if (
      urlToPlay &&
      magnetURI === urlToPlay &&
      (isLoading || isLoadingFiles || isShakaActive(player))
    ) {
      addToast({
        icon: 'playlist_remove',
        text: `Already playing ` + fileName,
        variant: 'danger',
      });
      return;
    }

    const indexingDebounced = setTimeout(() => {
      addToast({
        icon: 'playlist_play',
        text: `Indexing magnet URI: ${urlToPlay}`,
        variant: 'success',
      });
    }, 500);

    setMagnetURI(urlToPlay);
    setFiles([]);
    setIsLoadingFiles(true);

    try {
      const files = await fetchPlayableFiles(
        urlToPlay,
        renewAbortController(abortRef).signal,
      );
      if (files) {
        setFiles(files);
        setIsLoadingFiles(false);
      }
    } catch (err) {
      if (err instanceof Error) {
        addToast({
          icon: 'play_disabled',
          text: err.message,
          variant: 'danger',
        });
      }
      setIsLoadingFiles(false);
    }

    clearTimeout(indexingDebounced);
  };

  const playSelectedFile = useEffectEvent(async (url: string) => {
    const file = files[selectedFileIndex];

    let loadingDebounced: number;
    if (file) {
      loadingDebounced = setTimeout(() => {
        addToast({
          icon: 'playlist_play',
          text: `Loading file: ${file.name}`,
          variant: 'success',
        });
      }, 500);
      focusPlayer();
    }

    const played = await playFromURL(url);
    clearTimeout(loadingDebounced!);

    if (played && file) {
      addToast({
        icon: 'playlist_play',
        text: `Playing ` + file.name,
        variant: 'success',
      });
    }
  });

  const manifestURL =
    magnetURI && files[selectedFileIndex]
      ? getManifestURL(magnetURI, files[selectedFileIndex].index)
      : '';

  useEffect(() => {
    playSelectedFile(manifestURL);
  }, [manifestURL]);

  useMediaSessionMetadata({
    currentFile: files[selectedFileIndex],
    videoTrack: videoTracks[selectedVideoTrackIndex],
  });

  return (
    <form
      className={clsx(classes.controlForm, 't-body-lg')}
      onSubmit={submitForm}
    >
      <input
        name="magnetURI"
        placeholder="Magnet URI"
        autoFocus
        ref={magnetInputRef}
      />
      <TrackSelectors />
      <button className="btn btn--lg btn--primary">
        <Icon as="span" icon="play_arrow" size="xl" variant="fill" />
      </button>
    </form>
  );
}

export default MagnetForm;
