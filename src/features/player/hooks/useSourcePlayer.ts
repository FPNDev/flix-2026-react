import type { Queue } from '@/utils/queue';
import { useEffect, useState } from 'react';
import shaka from 'shaka-player';
import { useToast } from '@/components/DesignSystem/Toast';
import { useVideoFileSelection } from './useVideoFileSelection';
import { remuxerURI } from '../api/urls';
import { isRemuxerError, parseShakaNetworkError } from '../utils/httpErrors';
import { isShakaError } from '../utils/playerErrors';

type UseSourcePlayerProps = {
  player: shaka.Player | null;
  playerQueue: Queue | null;
  sourceURI: string;
  multiple?: boolean;
};

/**
 * Layer between Shaka player & media sources. Provides a way to play a media source in given player
 */
export function useSourcePlayer({
  player,
  playerQueue,
  sourceURI,
  multiple,
}: UseSourcePlayerProps) {
  const { addToast } = useToast();

  const [activeURI, setActiveURI] = useState('');

  const {
    files,
    selectedFileIndex,
    setSelectedFileIndex,
    fetchFiles,
    navigateFiles,
  } = useVideoFileSelection();

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
    const video = player?.getMediaElement();
    if (!video) {
      return;
    }

    video.play();
  };

  const playSelectedFile = async () => {
    if (!player || !playerQueue) {
      return;
    }

    playerQueue.add(() =>
      player
        .load(
          remuxerURI('m3u8', {
            source: activeURI,
            ...(selectedFileIndex !== undefined
              ? { file: selectedFileIndex }
              : {}),
          }),
        )
        .then(onLoad, handleShakaError),
    );
  };

  // Set player active URL and start fetching files
  const prepareAndPlay = () => {
    setActiveURI(sourceURI);
  };

  useEffect(() => {
    if (multiple) {
      fetchFiles(activeURI);
    } else {
      addToast({
        icon: 'playlist_play',
        text: 'Playing ' + activeURI,
        variant: 'success',
      });
    }
  }, [activeURI, multiple, addToast, fetchFiles]);

  // Handle file navigation
  useEffect(() => {
    if (!player || !playerQueue || !player.getMediaElement()) {
      return;
    }

    playerQueue.add(() => player.unload());
    if (!activeURI) {
      return;
    }

    playSelectedFile();
  }, [player, playerQueue, activeURI, playSelectedFile]);

  // Update current video track when it changes

  return {
    activeURI,
    files,
    selectedFileIndex,
    setSelectedFileIndex,
    prepareAndPlay,
    navigateFiles,
  };
}
