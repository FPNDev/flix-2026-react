import clsx from 'clsx';
import classes from './SourceForm.module.scss';
import { Icon } from '@/components/DesignSystem/Icon';
import { useToast } from '@/components/DesignSystem/Toast';
import { usePlayerActions, usePlayerState } from '../../context/PlayerContext';
import { isShakaActive } from '../../utils/shaka';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { TrackSelectors } from '../TrackSelectors';
import { remuxerURI } from '../../api/playerApi';
import {
  useMediaFileActions,
  useMediaFiles,
} from '../../context/MediaFilesContext';
import { renewAbortController } from '@/utils/abort';
import { fetchPlayableFiles } from '../../api/playerApi';
import { useMediaSessionMetadata } from '../../hooks/useMediaSessionMetadata';

const getManifestURL = (sourceURI: string, fileIndex: number) => {
  return remuxerURI('m3u8', {
    source: sourceURI,
    file: fileIndex,
  });
};

export function SourceForm() {
  const { addToast } = useToast();
  const { playFromURL, focusPlayer } = usePlayerActions();
  const { player, isLoading, videoTracks, selectedVideoTrackIndex } =
    usePlayerState();

  const { files, selectedFileIndex } = useMediaFiles();
  const { setFiles } = useMediaFileActions();

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const [sourceURI, setSourceURI] = useState('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const abortRef = useRef<AbortController>(null);

  const submitForm = async (ev: React.SubmitEvent) => {
    ev.preventDefault();

    const sourceInput = sourceInputRef.current;
    if (!sourceInput) {
      return;
    }

    focusPlayer();

    const urlToPlay = sourceInput.value;
    const fileName =
      files.length > 0 ? files[selectedFileIndex].name : sourceURI;
    if (
      urlToPlay &&
      sourceURI === urlToPlay &&
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
        text: `Indexing ${urlToPlay}`,
        variant: 'success',
      });
    }, 500);

    setSourceURI(urlToPlay);
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
    sourceURI && files[selectedFileIndex]
      ? getManifestURL(sourceURI, files[selectedFileIndex].index)
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
        name="sourceURI"
        placeholder="Source URI"
        autoFocus
        ref={sourceInputRef}
      />
      <TrackSelectors />
      <button className="btn btn--lg btn--primary">
        <Icon as="span" icon="play_arrow" size="xl" variant="fill" />
      </button>
    </form>
  );
}

export default SourceForm;
