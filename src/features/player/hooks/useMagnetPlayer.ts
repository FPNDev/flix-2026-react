import type { Queue } from '@/utils/queue';
import { useEffect, useState } from 'react';
import shaka from 'shaka-player';
import { useToast } from '@/components/DesignSystem/Toast';
import type { MediaFile } from '@/types/media';
import { useVideoFileSelection } from './useVideoFileSelection';
import { magnetRemuxerURI } from '../api/urls';
import { isRemuxerError, parseShakaNetworkError } from '../utils/httpErrors';
import { isShakaError } from '../utils/playerErrors';

type UseMagnetPlayerProps = {
  player?: shaka.Player;
  playerQueue?: Queue;
  magnetURI: string;
  multiple?: boolean;
};

/**
 * Layer between Shaka player & magnet links. Provides a way to play a magnet link in given player
 */
export function useMagnetPlayer({
  player,
  playerQueue,
  magnetURI,
  multiple,
}: UseMagnetPlayerProps) {
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
      if (!networkError || !isRemuxerError(networkError.data)) {
        return;
      }

      errorText = networkError.data.error;
    }

    addToast({
      icon: 'play_disabled',
      text: errorText,
      variant: 'danger',
    });
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
          magnetRemuxerURI('m3u8', {
            magnet: uri,
            ...(file ? { file: file.index } : {}),
          }),
        )
        .then(onLoad, handleShakaError),
    );
  };

  // Set player active URL, pick a file and start playing it
  const prepareAndPlay = async () => {
    setActiveURI(magnetURI);

    if (!multiple) {
      addToast({
        icon: 'playlist_play',
        text: 'Playing ' + magnetURI,
        variant: 'success',
      });
      load(magnetURI);
      return;
    }

    unload();

    const playableFiles = await fetchFiles(magnetURI);
    if (!playableFiles.length) {
      return;
    }

    load(magnetURI, selectFile(0, playableFiles));
  };

  const playFile = (index: number) => {
    const file = selectFile(index);
    if (file) {
      load(activeURI, file);
    }
  };

  // Handle file navigation
  const playNextFile = (direction: -1 | 1) => {
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
    prepareAndPlay,
    navigateFiles: playNextFile,
    isLoading,
  };
}
