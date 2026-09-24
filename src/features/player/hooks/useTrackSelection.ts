import { useToast } from '@/components/DesignSystem/Toast';
import type shaka from 'shaka-player';
import { usePlayerSubscription } from './usePlayerSubscription';
import { useState } from 'react';
import { isShakaActive } from '../utils/shaka';
import type { TrackType } from '../types/tracks.types';
import { TRACK_SELECTION_TOASTS } from '../constants/trackSelection';

type Props<T extends keyof TrackType> = {
  player: shaka.Player | undefined;
  trackType: T;
  bufferDuration?: number;
};

type SelectedIndex<T> = T extends 'TextTrack' ? number | undefined : number;

const TRACKS_EVENTS = ['loaded', 'unloading'];
const NO_TRACKS: unknown[] = [];

function getTracks<T extends keyof TrackType>(
  player: shaka.Player,
  trackType: T,
): TrackType[T][] {
  switch (trackType) {
    case 'AudioTrack':
      return player.getAudioTracks() as TrackType[T][];
    case 'VideoTrack':
      return player.getVideoTracks() as TrackType[T][];
    case 'TextTrack':
      return player.getTextTracks() as TrackType[T][];
  }
}

function selectTrack<T extends keyof TrackType>(
  player: shaka.Player,
  trackType: T,
  track: TrackType[T],
  bufferDuration?: number,
) {
  const selectors: {
    [K in keyof TrackType]: (
      newTrack: TrackType[K],
      bufferDuration?: number,
    ) => void;
  } = {
    AudioTrack: (audioTrack, bufferDuration) =>
      player.selectAudioTrack(audioTrack, bufferDuration),
    VideoTrack: (newTrack, nextBufferDuration) =>
      player.selectVideoTrack(
        newTrack,
        !!nextBufferDuration,
        nextBufferDuration,
      ),
    TextTrack: (track) => player.selectTextTrack(track),
  };

  return selectors[trackType](track, bufferDuration);
}

function disableTrack(player: shaka.Player, trackType: keyof TrackType) {
  switch (trackType) {
    case 'AudioTrack':
    case 'VideoTrack':
      throw new Error('Cannot deselect audio / video tracks');
    case 'TextTrack':
      player.selectTextTrack(null);
  }
}

/**
 * Provides a layer for tracks selection within Shaka player
 */
export function useTrackSelection<T extends keyof TrackType>({
  player,
  trackType,
  bufferDuration,
}: Props<T>) {
  const { addToast } = useToast();

  const defaultIndex = (
    trackType === 'TextTrack' ? undefined : 0
  ) as SelectedIndex<T>;

  const selector = () => {
    if (!player || !isShakaActive(player)) {
      return NO_TRACKS as TrackType[T][];
    }

    return getTracks<T>(player, trackType);
  };
  const { snapshot: tracks } = usePlayerSubscription<TrackType[T][]>({
    player,
    events: TRACKS_EVENTS,
    selector,
    fallback: NO_TRACKS as TrackType[T][],
  });

  const [selectedTrackIndex, setSelectedTrackIndex] = useState(defaultIndex);

  const select = (selectedIndex: SelectedIndex<T>, showToast = false) => {
    if (!player || tracks.length === 0) {
      return;
    }

    const newTrack =
      typeof selectedIndex === 'number' ? tracks[selectedIndex] : undefined;

    const displayToast = showToast
      ? (failed?: boolean) => {
          const toastMessageFn = newTrack
            ? failed
              ? TRACK_SELECTION_TOASTS.failed[trackType]
              : TRACK_SELECTION_TOASTS.activated[trackType]
            : !failed && TRACK_SELECTION_TOASTS.disabled[trackType];

          if (toastMessageFn) {
            addToast({
              variant: failed || !newTrack ? 'danger' : 'accent',
              ...toastMessageFn(newTrack as TrackType[T]),
            });
          }
        }
      : null;

    try {
      if (newTrack) {
        selectTrack(player, trackType, newTrack, bufferDuration);
      } else {
        disableTrack(player, trackType);
      }

      setSelectedTrackIndex(selectedIndex as typeof defaultIndex);

      if (displayToast) {
        displayToast();
      }
    } catch {
      if (displayToast) {
        displayToast(true);
      }
    }
  };

  const navigate = (direction: -1 | 1) => {
    if (
      (selectedTrackIndex === undefined && trackType !== 'TextTrack') ||
      tracks.length === 0 ||
      (trackType !== 'TextTrack' && tracks.length <= 1)
    ) {
      return;
    }

    if (selectedTrackIndex === undefined) {
      select(direction === 1 ? 0 : tracks.length - 1, true);
      return;
    }

    if (
      (trackType === 'TextTrack' &&
        selectedTrackIndex === tracks.length - 1 &&
        direction === 1) ||
      (selectedTrackIndex === 0 && direction === -1)
    ) {
      select(defaultIndex, true);
      return;
    }

    select(
      (tracks.length + (selectedTrackIndex as number) + direction) %
        tracks.length,
      true,
    );
  };

  const disable = (showToast = false) => {
    select(defaultIndex, showToast);
  };

  return {
    selectedTrackIndex,
    tracks,
    selectTrack: select,
    navigateTracks: navigate,
    disableTrack: disable,
  };
}
