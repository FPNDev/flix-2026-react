type AudioTrackInfo = {
  id: number;
  name: string;
  lang?: string;
  audioCodec?: string;
  channels?: number;
};

type TextTrackInfo = {
  name: string;
  lang?: string;
  forced: boolean;
};

type VideoTrackInfo = {
  name: string;
  frameRate?: number;
  videoCodec?: string;
};

export type TrackType = {
  audio: AudioTrackInfo;
  text: TextTrackInfo;
  video: VideoTrackInfo;
};

export const USER_TEXT_KINDS = new Set<string>([
  'subtitles',
  'captions',
  'forced',
]);

/**
 * Library-neutral video SDK.
 *
 * Dispatches CustomEvents on `video`:
 * - `audio:updated`, `text:updated`, `video:updated` when a list changes
 * - `audio:selected`, `text:selected`, `video:selected` when a selection is
 *   requested (by user or ABR); selection getters return the requested index
 * - `unload` when the source is dropped
 * - `sdk:error` (`detail: VideoError`) for non-fatal errors at any time and
 *   fatal errors after `load` resolves
 *
 * List getters return the same array until the list changes.
 * Selection is an index into the list; text index -1 means subtitles off.
 * `load` starts at `startTime` when given, rejects with a fatal `VideoError`
 * and unloads the previous source first.
 * `play` resolves once playback starts; resolves silently when the browser
 * blocks autoplay (NotAllowedError) or the play is interrupted by pause/load
 * (AbortError); rejects with other errors.
 */
export type VideoSdk = {
  readonly video: HTMLVideoElement;
  load(url: string, startTime?: number): Promise<void>;
  play(): Promise<void>;
  unload(): void;
  destroy(): void;

  readonly audioTracks: TrackType['audio'][];
  readonly audioTrack: number;
  selectAudioTrack(idx: number): void;

  readonly textTracks: TrackType['text'][];
  readonly textTrack: number;
  selectTextTrack(idx: number): void;

  readonly videoTracks: TrackType['video'][];
  readonly videoTrack: number;
  selectVideoTrack(idx: number): void;
};
