import { attachNativeTracks } from './nativeTracks';
import { VideoError, type VideoSdk } from '../types';

const VARIANT_CODECS = /^#EXT-X-STREAM-INF:(?:.*,)?CODECS="([^"]*)"/gmu;

async function loadErrorCause(
  video: HTMLVideoElement,
  url: string,
  signal: AbortSignal,
): Promise<VideoError> {
  let playlist: string;
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      return VideoError.Other;
    }

    playlist = await response.text();
  } catch {
    return VideoError.Other;
  }

  let found = false;
  for (const [, codecs] of playlist.matchAll(VARIANT_CODECS)) {
    if (video.canPlayType(`video/mp4; codecs="${codecs}"`)) {
      return VideoError.Other;
    }
    found = true;
  }

  return found ? VideoError.UnsupportedCodec : VideoError.Other;
}

export function createNativeSdk(video: HTMLVideoElement): VideoSdk {
  const { detach, ...tracks } = attachNativeTracks(video);

  let abortLoading: (() => void) | undefined;

  const unload = () => {
    abortLoading?.();
    video.dispatchEvent(new CustomEvent('unload'));
    video.removeAttribute('src');
    video.load();
  };

  const load = (url: string) => {
    const { promise, resolve, reject } = Promise.withResolvers<void>();

    unload();

    const controller = new AbortController();

    const onLoad = () => {
      cleanup();
      resolve();
    };

    const onLoadError = async () => {
      const cause = await loadErrorCause(video, url, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      cleanup();
      video.dispatchEvent(new CustomEvent('unload'));
      reject(cause);
    };

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoad);
      video.removeEventListener('error', onLoadError);
      abortLoading = undefined;
    };

    abortLoading = () => {
      cleanup();
      controller.abort();
      reject(VideoError.Interrupted);
    };

    video.addEventListener('loadedmetadata', onLoad);
    video.addEventListener('error', onLoadError);
    video.src = url;

    return promise;
  };

  const destroy = () => {
    unload();
    detach();
  };

  return {
    load,
    unload,
    destroy,

    ...tracks,

    video,
  };
}
