import type { Queue } from '@/utils/queue';
import { useEffect, useState } from 'react';
import shaka from 'shaka-player';
import { useToast } from '@/components/DesignSystem/Toast';
import { useVideoFileSelection } from './useVideoFileSelection';
import { magnetRemuxerURI } from '../api/urls';
import { isRemuxerError, parseShakaNetworkError } from '../utils/httpErrors';
import { isShakaError } from '../utils/playerErrors';

type UseMagnetPlayerProps = {
  player: shaka.Player | null;
  playerQueue: Queue | null;
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
          magnetRemuxerURI('m3u8', {
            magnet: activeURI,
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
    setActiveURI(magnetURI);
    if (multiple) {
      fetchFiles(magnetURI);
    } else {
      addToast({
        icon: 'playlist_play',
        text: 'Playing ' + magnetURI,
        variant: 'success',
      });
    }
  };

  // Handle file navigation
  useEffect(() => {
    if (!player || !playerQueue || !player.getMediaElement()) {
      return;
    }

    playerQueue.add(() => player.unload());
    if (!activeURI || selectedFileIndex === undefined) {
      return;
    }
    playSelectedFile();
  }, [player, playerQueue, selectedFileIndex, activeURI, playSelectedFile]);

  // Update current video track when it changes

  return {
    files,
    selectedFileIndex,
    setSelectedFileIndex,
    prepareAndPlay,
    navigateFiles,
  };
}
