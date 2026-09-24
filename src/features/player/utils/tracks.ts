import type { TrackType } from '../types/tracks.types';
import { LANGUAGE_NAMES } from '@/constants/languageNames';
import { TRACK_COMPARE_FIELDS } from '../constants/trackSelection';

export function getTrackDisplayName<T extends TrackType[keyof TrackType]>(
  track: T,
  withLanguage = false,
) {
  const trackLabel = track.label?.trim() ?? '';

  const parts = [];
  if (trackLabel) {
    parts.push(trackLabel);
  }

  if ((withLanguage || parts.length === 0) && track.language !== 'und') {
    let languageName: string | undefined;
    try {
      languageName = LANGUAGE_NAMES.of(track.language);
      if (languageName && languageName !== trackLabel) {
        parts.push(languageName);
      }
    } catch {
      // Wrong language tag used - omit
    }
  }

  return parts.join('-') || 'Unknown';
}

export function findBestMatchForTrack<T extends keyof TrackType>(
  trackType: T,
  tracks: TrackType[T][],
  matchToTrack: TrackType[T],
) {
  let bestScore = 0;
  let bestTrackIndex;

  let bestPrimaryScore = -1;
  let bestPrimaryTrackIndex;

  const { primary, fields } = TRACK_COMPARE_FIELDS[trackType];

  for (const [index, track] of tracks.entries()) {
    const trackScore = fields.reduce(
      (curScore, nextField) =>
        curScore + +(track[nextField] === matchToTrack[nextField]),
      0,
    );
    if (
      track[primary] === matchToTrack[primary] &&
      trackScore > bestPrimaryScore
    ) {
      bestPrimaryScore = trackScore;
      bestPrimaryTrackIndex = index;

      if (trackScore === fields.length) {
        break;
      }

      continue;
    }

    if (trackScore > bestScore) {
      bestScore = trackScore;
      bestTrackIndex = index;
    }
  }

  return bestPrimaryScore === -1 ? bestTrackIndex : bestPrimaryTrackIndex;
}
