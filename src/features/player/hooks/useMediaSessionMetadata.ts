import { useEffect } from 'react';
import type shaka from 'shaka-player';
import { setMediaSessionMetadata } from '../utils/media-session';
import type { MediaFile } from '../types/mediaFiles.types';
import { getTrackDisplayName } from '../utils/tracks';

type Props = {
  videoTrack: shaka.extern.VideoTrack | undefined;
  currentFile?: MediaFile;
};

export function useMediaSessionMetadata({ videoTrack, currentFile }: Props) {
  useEffect(() => {
    if (!videoTrack || !currentFile) {
      setMediaSessionMetadata('FLIX');
      return;
    }
    setMediaSessionMetadata(
      `${currentFile.name} - ${getTrackDisplayName(videoTrack)}`,
    );
  }, [videoTrack, currentFile]);
}
