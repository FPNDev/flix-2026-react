import { useEffect } from 'react';
import { setMediaSessionMetadata } from '@/utils/mediaSession';
import { getTrackDisplayName } from '../utils/tracks';
import type { MediaFile } from '../api/remuxer';
import type { TrackType } from '../sdk';

type Props = {
  videoTrack: TrackType['video'] | undefined;
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
