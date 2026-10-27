import { attachNativeTracks } from './nativeTracks';
import { createStallWatchdog } from '../stallWatchdog';
import type { VideoSdk } from '../types';
import {
  playVideo,
  serverError,
  VideoError,
  VideoErrorCode,
} from '../videoError';

const VARIANT_CODECS = /^#EXT-X-STREAM-INF:(?:.*,)?CODECS="([^"]*)"/gmu;

const MEDIA_ERROR_CODES: Partial<Record<number, VideoErrorCode>> = {
  [MediaError.MEDIA_ERR_NETWORK]: VideoErrorCode.Network,
  [MediaError.MEDIA_ERR_DECODE]: VideoErrorCode.Decode,
  [MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]: VideoErrorCode.Manifest,
};

function fromMediaError(error: MediaError | null): VideoError {
  return new VideoError(
    (error && MEDIA_ERROR_CODES[error.code]) ?? VideoErrorCode.Other,
    { cause: error },
  );
}

async function loadErrorCause(
  video: HTMLVideoElement,
  url: string,
  signal: AbortSignal,
): Promise<VideoError> {
  let playlist: string;
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      return serverError(response.status, await response.text(), {
        cause: video.error,
      });
    }

    playlist = await response.text();
  } catch (error) {
    return new VideoError(VideoErrorCode.Network, { cause: error });
  }

  let found = false;
  for (const [, codecs] of playlist.matchAll(VARIANT_CODECS)) {
    if (video.canPlayType(`video/mp4; codecs="${codecs}"`)) {
      return fromMediaError(video.error);
    }
    found = true;
  }

  return found
    ? new VideoError(VideoErrorCode.UnsupportedCodec, { cause: video.error })
    : fromMediaError(video.error);
}

export function createNativeSdk(video: HTMLVideoElement): VideoSdk {
  const { detach, tracks } = attachNativeTracks(video);
  const watchdog = createStallWatchdog(video);

  let abortLoading: (() => void) | undefined;

  const unload = () => {
    abortLoading?.();
    watchdog.stop();
    video.dispatchEvent(new CustomEvent('unload'));
    video.removeAttribute('src');
    video.load();
  };

  const load = (url: string, startTime?: number) => {
    const { promise, resolve, reject } = Promise.withResolvers<void>();

    unload();

    const controller = new AbortController();

    const onLoad = () => {
      cleanup();
      if (startTime !== undefined) {
        video.currentTime = startTime;
      }
      resolve();
      watchdog.start();
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
      reject(new VideoError(VideoErrorCode.Interrupted));
    };

    video.addEventListener('loadedmetadata', onLoad);
    video.addEventListener('error', onLoadError);
    video.src = url;

    return promise;
  };

  const onError = () => {
    if (!abortLoading) {
      watchdog.stopUntilPlaying();
      video.dispatchEvent(
        new CustomEvent('sdk:error', { detail: fromMediaError(video.error) }),
      );
    }
  };

  video.addEventListener('error', onError);

  const destroy = () => {
    unload();
    detach();
    video.removeEventListener('error', onError);
  };

  return Object.assign(tracks, {
    load,
    play: () => playVideo(video),
    unload,
    destroy,
    video,
  });
}
