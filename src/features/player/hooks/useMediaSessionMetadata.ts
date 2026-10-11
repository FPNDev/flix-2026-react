import { useEffect } from 'react';
import { setMediaSessionMetadata } from '@/utils/mediaSession';
import { getTrackDisplayName } from '../utils/tracks';
import type { MediaFile } from '../api/remuxer';
import type { LevelInfo } from '../sdk';

type Props = {
  level: LevelInfo | undefined;
  currentFile?: MediaFile;
};

export function useMediaSessionMetadata({ level, currentFile }: Props) {
  useEffect(() => {
    if (!level || !currentFile) {
      setMediaSessionMetadata('FLIX');

      return;
    }

    setMediaSessionMetadata(
      `${currentFile.name} - ${getTrackDisplayName(level)}`,
    );
  }, [level, currentFile]);
}
