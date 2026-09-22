import type { Queue } from '@/utils/queue';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/DesignSystem/Toast';
import type { MediaFile } from '@/types/media';
import { useVideoFileSelection } from './useVideoFileSelection';
import { remuxerURI } from '../api/urls';
import { isRemuxerError, parseShakaNetworkError } from '../utils/httpErrors';
import { isShakaError } from '../utils/playerErrors';
import shaka from 'shaka-player';

type UseSourcePlayerProps = {
  player: shaka.Player | undefined;
  playerQueue: Queue | undefined;
  multiple?: boolean;
};

/**
 * Layer between Shaka player & media sources. Provides a way to play a media source in given player
 */
export function useSourcePlayer({
  player,
  playerQueue,
  multiple,
}: UseSourcePlayerProps) {
  const { addToast } = useToast();

  const [activeURI, setActiveURI] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { files, selectedFileIndex, selectFile, fetchFiles, navigateFiles } =
    useVideoFileSelection();

  const handleShakaError = (err: unknown) => {
    let errorText = 'Failed loading specified link';
    if (isShakaError(err)) {
      if (err.code === shaka.util.Error.Code.LOAD_INTERRUPTED) {
        return;
      }

      const networkError = parseShakaNetworkError(err);
      if (networkError && isRemuxerError(networkError.data)) {
        errorText = networkError.data.error;
      }
    }

    addToast({
      icon: 'play_disabled',
      text: errorText,
      variant: 'danger',
    });
    setIsLoading(false);
  };

  const onLoad = () => {
    setIsLoading(false);

    const video = player?.getMediaElement();
    if (!video) {
      return;
    }

    video.play();
  };

  const unload = () => {
    if (!player || !playerQueue) {
      return;
    }
    playerQueue.add(() => player.unload());
    setIsLoading(false);
  };

  const load = (uri: string, file?: MediaFile) => {
    if (!player || !playerQueue || !uri) {
      return;
    }

    setIsLoading(true);

    playerQueue.add(() =>
      player
        .load(
          remuxerURI('m3u8', {
            source: uri,
            ...(file ? { file: file.index } : {}),
          }),
        )
        .then(onLoad, handleShakaError),
    );
  };

  // Set player active URL, pick a file and start playing it
  const playFromURL = async (sourceURI: string) => {
    setActiveURI(sourceURI);

    if (!multiple) {
      addToast({
        icon: 'playlist_play',
        text: 'Playing ' + sourceURI,
        variant: 'success',
      });
      load(sourceURI);
      return;
    }

    unload();

    const playableFiles = await fetchFiles(sourceURI);
    if (!playableFiles.length) {
      return;
    }

    load(sourceURI, selectFile(0, playableFiles));
  };

  const playFile = (index: number) => {
    const file = selectFile(index);
    if (file) {
      load(activeURI, file);
    }
  };

  // Handle file navigation
  const navigateAndPlayFile = (direction: -1 | 1) => {
    const file = navigateFiles(direction);
    if (file) {
      load(activeURI, file);
    }
  };

  useEffect(() => {
    if (!player || !playerQueue) {
      return;
    }

    return unload;
  }, [player, playerQueue, unload]);

  return {
    activeURI,
    files,
    selectedFileIndex,
    selectFile: playFile,
    navigateFiles: navigateAndPlayFile,
    playFromURL,
    isLoading,
  };
}
