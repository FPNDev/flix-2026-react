type AudioTrackInfo = {
  id: number;
  name: string;
  lang?: string;
  audioCodec?: string;
  channels?: string;
};

type TextTrackInfo = {
  name: string;
  lang?: string;
  forced: boolean;
};

export type TrackType = {
  audio: AudioTrackInfo;
  text: TextTrackInfo;
};

export type LevelInfo = {
  name: string;
  frameRate?: number;
  videoCodec?: string;
  audioCodec?: string;
};

export const VideoError = {
  Interrupted: 'Interrupted',
  UnsupportedCodec: 'UnsupportedCodec',
  Other: 'Other',
} as const;
export type VideoError = (typeof VideoError)[keyof typeof VideoError];

/**
 * Library-neutral video SDK.
 *
 * Dispatches CustomEvents on `video`:
 * - `audio:updated`, `text:updated`, `level:updated` when a list changes
 * - `audio:selected`, `text:selected`, `level:selected` when a selection is
 *   requested (by user or ABR); selection getters return the requested index
 * - `unload` when the source is dropped
 *
 * List getters return the same array until the list changes.
 * Selection is an index into the list; text index -1 means subtitles off.
 * `load` rejects with `VideoError` and unloads the previous source first.
 */
export type VideoSdk = {
  readonly video: HTMLVideoElement;
  load(url: string): Promise<void>;
  unload(): void;
  destroy(): void;

  audioTracks(): TrackType['audio'][];
  audioTrack(): number;
  selectAudioTrack(idx: number): void;

  textTracks(): TrackType['text'][];
  textTrack(): number;
  selectTextTrack(idx: number): void;

  levels(): LevelInfo[];
  level(): number;
  selectLevel(idx: number): void;
};
