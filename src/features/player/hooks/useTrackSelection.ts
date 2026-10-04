import { useToast } from '@/components/DesignSystem/Toast';
import type shaka from 'shaka-player';
import { usePlayerSubscription } from './usePlayerSubscription';
import { getTracks, isShakaActive } from '../utils/shaka';
import type { TrackType } from '../types/player.types';
import { TRACK_SELECTION_TOASTS } from '../constants/trackSelection';
import { disableTrack, selectTrack } from '../utils/tracks';

type Props<T extends keyof TrackType> = {
  player: shaka.Player | undefined;
  trackType: T;
  bufferDuration?: number;
};

type SelectedIndex<T> = T extends 'TextTrack' ? number | undefined : number;

type TrackStore<T> = {
  tracks: T[];
  selectedTrackIndex: SelectedIndex<T>;
};

const TRACKS_EVENTS = ['loaded', 'unloading', 'variantchanged', 'textchanged'];
const NO_TRACKS: TrackStore<unknown> = { tracks: [], selectedTrackIndex: 0 };

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
      return NO_TRACKS as TrackStore<TrackType[T]>;
    }

    const tracks = getTracks<T>(player, trackType);
    const index = tracks.findIndex((track) => track.active);

    return {
      tracks,
      selectedTrackIndex: index === -1 ? defaultIndex : index,
    } as TrackStore<TrackType[T]>;
  };

  const {
    snapshot: { tracks, selectedTrackIndex },
  } = usePlayerSubscription({
    player,
    events: TRACKS_EVENTS,
    selector,
    fallback: NO_TRACKS as TrackStore<TrackType[T]>,
  });

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
      : () => {};

    try {
      if (newTrack) {
        selectTrack(player, trackType, newTrack, bufferDuration);
      } else {
        disableTrack(player, trackType);
      }

      displayToast();
    } catch {
      displayToast(true);
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
