import clsx from 'clsx';
import classes from './SourceForm.module.scss';
import { Icon } from '@/components/DesignSystem/Icon';
import { useToast } from '@/components/DesignSystem/Toast';
import { usePlayerActions, usePlayerState } from '../../context/PlayerContext';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  fetchPlayableFiles,
  remuxerURI,
  REMUXER_SOURCE_PARAM,
} from '../../api/remuxer';
import {
  useMediaFileActions,
  useMediaFiles,
} from '../../context/MediaFilesContext';
import { renewAbortController } from '@/utils/abort';
import { TrackSelectors } from '../TrackSelectors';
import { VideoError } from '../../sdk';

const getManifestURL = (sourceURI: string, fileIndex: number) => {
  return remuxerURI('m3u8', {
    [REMUXER_SOURCE_PARAM]: sourceURI,
    file: fileIndex,
  });
};

export function SourceForm() {
  const { addToast } = useToast();
  const { load, focusPlayer } = usePlayerActions();
  const { isLoading } = usePlayerState();

  const { files, selectedFileIndex } = useMediaFiles();
  const { setFiles } = useMediaFileActions();

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const [sourceURI, setSourceURI] = useState('');
  const abortRef = useRef<AbortController>(null);

  const submitForm = async (ev: React.SubmitEvent) => {
    ev.preventDefault();

    const sourceInput = sourceInputRef.current;
    if (!sourceInput) {
      return;
    }

    focusPlayer();

    const urlToPlay = sourceInput.value;
    if (urlToPlay === sourceURI && (isLoading || files.length > 0)) {
      addToast({
        icon: 'playlist_remove',
        text:
          `Already playing ` + (files[selectedFileIndex]?.name ?? sourceURI),
        variant: 'danger',
      });

      return;
    }

    setSourceURI(urlToPlay);
    setFiles([]);

    try {
      const files = await fetchPlayableFiles(
        urlToPlay,
        renewAbortController(abortRef).signal,
      );

      if (files) {
        setFiles(files);
      }
    } catch (err) {
      if (err instanceof Error) {
        addToast({
          icon: 'play_disabled',
          text: err.message,
          variant: 'danger',
        });
      }
    }
  };

  const playSelectedFile = useEffectEvent(async (url: string) => {
    const file = files[selectedFileIndex];

    try {
      await load(url);

      if (file) {
        addToast({
          icon: 'playlist_play',
          text: `Playing ` + file.name,
          variant: 'success',
        });
      }
    } catch (err) {
      if (file && err !== VideoError.Interrupted) {
        addToast({
          icon: 'play_disabled',
          text:
            err === VideoError.UnsupportedCodec
              ? 'Video codec is not supported by your browser'
              : `Cannot play ` + file.name,
          variant: 'danger',
        });
      }
    }
  });

  const manifestURL =
    sourceURI && files[selectedFileIndex]
      ? getManifestURL(sourceURI, files[selectedFileIndex].index)
      : '';

  useEffect(() => {
    if (manifestURL.length > 0) {
      void playSelectedFile(manifestURL);
    }
  }, [manifestURL]);

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
