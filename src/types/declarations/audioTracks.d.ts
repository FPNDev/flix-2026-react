type AudioTrack = {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly language: string;
  enabled: boolean;
};

type AudioTrackList = EventTarget & {
  readonly length: number;
  readonly [index: number]: AudioTrack;
  [Symbol.iterator](): ArrayIterator<AudioTrack>;
};

interface HTMLMediaElement {
  readonly audioTracks?: AudioTrackList;
}
