import type shaka from 'shaka-player';
import { isShakaActive } from './shaka';

const AUDIO_PRIMARY_COMPARE_FIELD = 'language';
const AUDIO_COMPARE_FIELDS = [
  'channelsCount',
  'spatialAudio',
  'label',
] as (keyof shaka.extern.AudioTrack)[];

export function getAudioTracksList(player: shaka.Player) {
  if (!isShakaActive(player)) {
    return [];
  }

  return player.getAudioTracks();
}

export function findBestMatchForAudioTrack(
  tracks: shaka.extern.AudioTrack[],
  matchToTrack: shaka.extern.AudioTrack,
) {
  let bestScore = 0;
  let bestTrackIndex = 0;

  let bestPrimaryScore = -1;
  let bestPrimaryTrackIndex = 0;

  for (const [index, track] of tracks.entries()) {
    const trackScore = AUDIO_COMPARE_FIELDS.reduce(
      (curScore, nextField) =>
        curScore + +(track[nextField] === matchToTrack[nextField]),
      0,
    );
    if (
      track[AUDIO_PRIMARY_COMPARE_FIELD] ===
        matchToTrack[AUDIO_PRIMARY_COMPARE_FIELD] &&
      trackScore > bestPrimaryScore
    ) {
      bestPrimaryScore = trackScore;
      bestPrimaryTrackIndex = index;

      if (trackScore === AUDIO_COMPARE_FIELDS.length) {
        break;
      }

      continue;
    }

    if (trackScore > bestScore) {
      bestScore = trackScore;
      bestTrackIndex = index;
    }
  }

  return bestPrimaryScore !== -1 ? bestPrimaryTrackIndex : bestTrackIndex;
}
