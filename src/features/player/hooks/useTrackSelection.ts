import { useToast, type ToastInfo } from '@/components/DesignSystem/Toast';
import { usePlayerSubscription } from './usePlayerSubscription';
import { getTrackDisplayName } from '../utils/tracks';
import type { TrackType, VideoSdk } from '../sdk';

type Props<T extends keyof TrackType> = {
  player: VideoSdk | undefined;
  trackType: T;
};

type MessageGroup = {
  [key in keyof TrackType]?: (track: TrackType[key]) => ToastInfo;
};

type DisabledMessageGroup = {
  [key in keyof TrackType]?: () => ToastInfo;
};

const TRACK_SELECTION_TOASTS: {
  disabled: DisabledMessageGroup;
  activated: MessageGroup;
} = {
  disabled: {
    text: () => ({ text: 'Subtitles disabled', icon: 'subtitles_off' }),
  },
  activated: {
    text: (track) => ({
      text: `Subtitles changed to ${getTrackDisplayName(track)}`,
      icon: 'subtitles',
    }),
    audio: (track) => ({
      text: `Audio changed to ${getTrackDisplayName(track)}`,
      icon: 'queue_music',
    }),
  },
};

const NO_TRACKS: unknown[] = [];

function getTracksByType<T extends 'text' | 'audio'>(
  player: VideoSdk,
  type: T,
): TrackType[T][] {
  switch (type) {
    case 'audio':
      return player.audioTracks() as TrackType[T][];
    case 'text':
      return player.textTracks() as TrackType[T][];
  }
}

function getTrackByType<T extends 'text' | 'audio'>(player: VideoSdk, type: T) {
  switch (type) {
    case 'audio':
      return player.audioTrack();
    case 'text':
      return player.textTrack();
  }
}

function selectTrackByType<T extends 'text' | 'audio'>(
  player: VideoSdk,
  type: T,
  trackIndex: number,
) {
  switch (type) {
    case 'audio':
      player.selectAudioTrack(trackIndex);
      break;
    case 'text':
      player.selectTextTrack(trackIndex);
      break;
  }
}

/**
 * Provides a layer for tracks selection within the video SDK
 */
export function useTrackSelection<T extends keyof TrackType>({
  player,
  trackType,
}: Props<T>) {
  const { addToast } = useToast();
  const defaultIndex = trackType === 'text' ? -1 : 0;

  const getTracks = (_: unknown, evt?: Event) => {
    if (!player || evt?.type === 'unload') {
      return NO_TRACKS as TrackType[T][];
    }

    return getTracksByType(player, trackType);
  };

  const getCurrentTrack = (_: unknown, evt?: Event) => {
    if (!player || evt?.type === 'unload') {
      return -1;
    }

    return getTrackByType(player, trackType);
  };

  const { snapshot: tracks } = usePlayerSubscription({
    player,
    events: [`${trackType}:updated`, 'unload'],
    selector: getTracks,
    fallback: NO_TRACKS as TrackType[T][],
  });

  const { snapshot: selectedTrackIndex } = usePlayerSubscription({
    player,
    events: [`${trackType}:selected`, 'unload'],
    selector: getCurrentTrack,
    fallback: defaultIndex,
  });

  const select = (selectedIndex: number) => {
    if (!player || tracks.length === 0) {
      return;
    }

    selectTrackByType(player, trackType, selectedIndex);
  };

  const selectAndNotify = (selectedIndex: number) => {
    select(selectedIndex);

    const newTrack = tracks[selectedIndex];
    const toast = newTrack
      ? TRACK_SELECTION_TOASTS.activated[trackType]?.(newTrack)
      : TRACK_SELECTION_TOASTS.disabled[trackType]?.();

    if (toast) {
      addToast({ variant: newTrack ? 'accent' : 'danger', ...toast });
    }
  };

  const navigate = (direction: -1 | 1) => {
    if (trackType !== 'text' && tracks.length <= 1) {
      return;
    }

    if (selectedTrackIndex === -1) {
      selectAndNotify(direction === 1 ? 0 : tracks.length - 1);
      return;
    }

    if (
      trackType === 'text' &&
      ((selectedTrackIndex === tracks.length - 1 && direction === 1) ||
        (selectedTrackIndex === 0 && direction === -1))
    ) {
      selectAndNotify(defaultIndex);
      return;
    }

    selectAndNotify(
      (tracks.length + (selectedTrackIndex as number) + direction) %
        tracks.length,
    );
  };

  const selectDefault = () => {
    selectAndNotify(defaultIndex);
  };

  return {
    selectedTrackIndex,
    tracks,
    selectTrack: select,
    selectTrackWithToast: selectAndNotify,
    navigateTracks: navigate,
    selectDefault,
  };
}
