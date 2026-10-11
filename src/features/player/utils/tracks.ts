import { LANGUAGE_NAMES } from '@/constants/languageNames';
import type { LevelInfo, TrackType } from '../sdk';

type CompareFields = {
  [key in keyof TrackType]?: {
    primary: keyof TrackType[key];
    fields: (keyof TrackType[key])[];
  };
};

const TRACK_COMPARE_FIELDS: CompareFields = {
  audio: {
    primary: 'lang',
    fields: ['name', 'audioCodec', 'channels'],
  },
  text: {
    primary: 'lang',
    fields: ['forced', 'name'],
  },
};

export function getTrackDisplayName(
  track: TrackType[keyof TrackType] | LevelInfo,
  withLanguage = false,
) {
  const trackLabel = track.name?.trim() ?? '';

  const parts = [];
  if (trackLabel) {
    parts.push(trackLabel);
  }

  if (
    (withLanguage || parts.length === 0) &&
    'lang' in track &&
    track.lang &&
    track.lang !== 'und'
  ) {
    let languageName: string | undefined;
    try {
      languageName = LANGUAGE_NAMES.of(track.lang);
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

  const compareBy = TRACK_COMPARE_FIELDS[trackType];
  if (!compareBy) {
    return;
  }

  const { primary, fields } = compareBy;

  for (const [index, track] of tracks.entries()) {
    const trackScore = fields.reduce(
      (curScore, nextField) =>
        curScore + Number(track[nextField] === matchToTrack[nextField]),
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
