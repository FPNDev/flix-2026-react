import shaka from 'shaka-player';
import { SHAKA_CONFIG } from '../../config/shakaConfig';
import { createStallWatchdog } from '../stallWatchdog';
import type { VideoSdk } from '../types';
import { playVideo, VideoError, VideoErrorCode } from '../videoError';
import { CACHE_SUPPORTED, createSegmentCache } from './cache';
import { isClientError, toVideoError } from './shakaErrors';
import { attachShakaTracks } from './shakaTracks';

const HLS_MIME_TYPE = 'application/x-mpegurl';
const SUBTITLE_PLAYLIST_PATH = /\/subtitles\/\d+\/index\.m3u8$/u;

const { AdvancedRequestType } = shaka.net.NetworkingEngine;
const { Category, Code, Severity } = shaka.util.Error;

function isSubtitlePlaylist(uri: string) {
  return SUBTITLE_PLAYLIST_PATH.test(new URL(uri, document.baseURI).pathname);
}

type ShakaErrorEvent = Event & {
  detail: shaka.extern.Error;
};

type DownloadFailedEvent = Event & {
  request: shaka.extern.Request;
  context?: shaka.extern.RequestContext;
  error: shaka.extern.Error | null;
};

type RetryEvent = Event & {
  error: shaka.extern.Error;
};

export function createShakaSdk(video: HTMLVideoElement): VideoSdk {
  const player = new shaka.Player();
  player.configure(SHAKA_CONFIG);

  const attached = player.attach(video);
  attached.catch(() => {});

  const { clear, tracks } = attachShakaTracks(player, video);
  const textErrors = new WeakSet<shaka.extern.Error>();
  const watchdog = createStallWatchdog(video);

  const emit = (error: VideoError) => {
    video.dispatchEvent(new CustomEvent('sdk:error', { detail: error }));
  };

  const reportSubtitles = (cause: unknown) => {
    emit(new VideoError(VideoErrorCode.Subtitles, { fatal: false, cause }));
  };

  const cache = CACHE_SUPPORTED
    ? createSegmentCache(player, (cause) => {
        emit(new VideoError(VideoErrorCode.Storage, { fatal: false, cause }));
      })
    : undefined;

  let abortLoading: ((error: VideoError) => void) | undefined;
  let unloading = 0;

  const reset = (error: VideoError) => {
    abortLoading?.(error);
    watchdog.stop();
    cache?.abort();
    video.disableRemotePlayback = false;
    video.dispatchEvent(new CustomEvent('unload'));
    clear();
  };

  const unloadPlayer = async () => {
    unloading++;
    try {
      await attached;
      await player.unload();
    } finally {
      unloading--;
    }
  };

  const drop = (error: VideoError) => {
    reset(error);
    unloadPlayer().catch(() => {});
  };

  const unload = () => {
    drop(new VideoError(VideoErrorCode.Interrupted));
  };

  const load = (url: string, startTime?: number) => {
    reset(new VideoError(VideoErrorCode.Interrupted));

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const metadata = Promise.withResolvers<void>();

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onMetadata);
      abortLoading = undefined;
    };

    const fail = (error: VideoError) => {
      cleanup();
      reject(error);
    };

    const onMetadata = () => {
      metadata.resolve();
    };

    const run = async () => {
      try {
        await unloadPlayer();
        if (abortLoading !== fail) {
          return;
        }
        await player.load(url, startTime ?? null, HLS_MIME_TYPE);
        video.disableRemotePlayback = !video.querySelector(
          `source[type="${HLS_MIME_TYPE}"]`,
        );
      } catch (error) {
        if (abortLoading === fail) {
          reset(toVideoError(error, true));
        }

        return;
      }

      await metadata.promise;
      if (abortLoading === fail) {
        cleanup();
        resolve();
        watchdog.start();
      }
    };

    abortLoading = fail;
    video.addEventListener('loadedmetadata', onMetadata);
    void run();

    return promise;
  };

  player.addEventListener('downloadfailed', (event) => {
    const { request, context, error } = event as DownloadFailedEvent;
    if (!error) {
      return;
    }
    if (context?.stream?.type === 'text') {
      textErrors.add(error);

      return;
    }
    if (
      context?.type !== AdvancedRequestType.MEDIA_PLAYLIST ||
      !isSubtitlePlaylist(request.uris[0])
    ) {
      return;
    }

    textErrors.add(error);
    if (error.code === Code.ATTEMPTS_EXHAUSTED) {
      reportSubtitles(error);
    }
  });

  player.getNetworkingEngine()?.addEventListener('retry', (event) => {
    const { error } = event as RetryEvent;
    if (isClientError(error) && !isSubtitlePlaylist(String(error.data[0]))) {
      event.preventDefault();
    }
  });

  player.addEventListener('error', (event) => {
    if (unloading > 0) {
      return;
    }

    const { detail } = event as ShakaErrorEvent;
    if (detail.category === Category.TEXT || textErrors.has(detail)) {
      reportSubtitles(detail);

      return;
    }

    const videoError = toVideoError(
      detail,
      detail.severity === Severity.CRITICAL,
    );
    if (videoError.fatal && abortLoading) {
      drop(videoError);

      return;
    }
    if (videoError.fatal) {
      watchdog.stopUntilPlaying();
    }

    emit(videoError);
  });

  const destroy = () => {
    reset(new VideoError(VideoErrorCode.Interrupted));
    void player.destroy();
  };

  return Object.assign(tracks, {
    load,
    play: () => playVideo(video),
    unload,
    destroy,
    video,
  });
}
