import shaka from 'shaka-player';
import { USER_TEXT_KINDS, type TrackType } from '../types';

function toLang(language: string) {
  return language === 'und' ? undefined : language;
}

function showNativeTextTrack(
  video: HTMLVideoElement,
  track: shaka.extern.TextTrack | undefined,
) {
  const shakaTracks = new Set<TextTrack>();
  for (const node of video.querySelectorAll('track')) {
    shakaTracks.add(node.track);
  }

  for (const native of video.textTracks) {
    if (shakaTracks.has(native) || !USER_TEXT_KINDS.has(native.kind)) {
      continue;
    }
    const matches =
      track !== undefined &&
      native.label === (track.label ?? '') &&
      shaka.util.LanguageUtils.normalize(native.language || 'und') ===
        track.language;
    native.mode = matches ? 'showing' : 'disabled';
  }
}

/** Caches one Shaka track list; dispatches when the list loads or the active track changes. */
function createTrackList<
  K extends keyof TrackType,
  S extends { active: boolean },
>(
  video: HTMLVideoElement,
  kind: K,
  toInfo: (track: S, index: number) => TrackType[K],
) {
  let infos: TrackType[K][] = [];
  let tracks: S[] = [];
  let selected = -1;

  const select = (index: number) => {
    selected = index;
    video.dispatchEvent(new CustomEvent(`${kind}:selected`));
  };

  const load = (next: S[]) => {
    const nextInfos: TrackType[K][] = [];
    let active = -1;
    for (const [index, track] of next.entries()) {
      nextInfos.push(toInfo(track, index));
      if (track.active) {
        active = index;
      }
    }

    tracks = next;
    infos = nextInfos;
    video.dispatchEvent(new CustomEvent(`${kind}:updated`));
    select(active);
  };

  const syncActive = (next: S[]) => {
    if (tracks.length === 0) {
      return;
    }
    const active = next.findIndex((track) => track.active);
    if (active !== selected) {
      select(active);
    }
  };

  const clear = () => {
    if (tracks.length > 0) {
      tracks = [];
      infos = [];
      video.dispatchEvent(new CustomEvent(`${kind}:updated`));
    }
    if (selected !== -1) {
      select(-1);
    }
  };

  return {
    get infos() {
      return infos;
    },
    get selected() {
      return selected;
    },
    track: (index: number): S | undefined => tracks[index],
    select,
    load,
    syncActive,
    clear,
  };
}

export function attachShakaTracks(
  player: shaka.Player,
  video: HTMLVideoElement,
) {
  const audio = createTrackList(
    video,
    'audio',
    (track: shaka.extern.AudioTrack, index) => ({
      id: index,
      name: track.label ?? '',
      lang: toLang(track.language),
      audioCodec: track.codecs ?? undefined,
      channels: track.channelsCount ?? undefined,
    }),
  );
  const text = createTrackList(
    video,
    'text',
    (track: shaka.extern.TextTrack) => ({
      name: track.label ?? '',
      lang: toLang(track.language),
      forced: track.forced,
    }),
  );
  const videoList = createTrackList(
    video,
    'video',
    (track: shaka.extern.VideoTrack) => ({
      name: track.label ?? (track.height ? `${track.height}p` : ''),
      frameRate: track.frameRate ?? undefined,
      videoCodec: track.codecs ?? undefined,
    }),
  );

  const clear = () => {
    audio.clear();
    text.clear();
    videoList.clear();
  };

  player.addEventListener('loaded', () => {
    if (player.getLoadMode() !== shaka.Player.LoadMode.MEDIA_SOURCE) {
      return;
    }

    audio.load(player.getAudioTracks());
    text.load(player.getTextTracks());
    videoList.load(player.getVideoTracks());
  });
  player.addEventListener('variantchanged', () => {
    if (player.isRemotePlayback()) {
      return;
    }
    audio.syncActive(player.getAudioTracks());
    videoList.syncActive(player.getVideoTracks());
  });
  player.addEventListener('textchanged', () => {
    if (player.isRemotePlayback()) {
      return;
    }
    text.syncActive(player.getTextTracks());
  });
  player.addEventListener('unloading', clear);

  return {
    clear,
    tracks: {
      get audioTracks() {
        return audio.infos;
      },
      get audioTrack() {
        return audio.selected;
      },
      selectAudioTrack: (index: number) => {
        const track = audio.track(index);
        if (track) {
          player.selectAudioTrack(track);
          audio.select(index);
        }
      },

      get textTracks() {
        return text.infos;
      },
      get textTrack() {
        return text.selected;
      },
      selectTextTrack: (index: number) => {
        const track = text.track(index);
        player.selectTextTrack(track ?? null);
        text.select(index);
        if (player.isRemotePlayback()) {
          showNativeTextTrack(video, track);
        }
      },

      get videoTracks() {
        return videoList.infos;
      },
      get videoTrack() {
        return videoList.selected;
      },
      selectVideoTrack: (index: number) => {
        const track = videoList.track(index);
        if (track) {
          player.selectVideoTrack(track, true);
          videoList.select(index);
        }
      },
    },
  };
}
