import Hls, { type ErrorData } from 'hls.js';
import { attachHlsTracks } from './hlsTracks';
import { HLS_CONFIG } from '../../config/hlsConfig';
import { createCachingLoader } from './cache';
import { VideoError, type VideoSdk } from '../types';

const CODEC_ERRORS = new Set([
  Hls.ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR,
  Hls.ErrorDetails.BUFFER_INCOMPATIBLE_CODECS_ERROR,
  Hls.ErrorDetails.BUFFER_ADD_CODEC_ERROR,
]);

type Options = {
  cache: boolean;
};

export function createHlsSdk(
  video: HTMLVideoElement,
  { cache }: Options,
): VideoSdk & { hls: Hls } {
  const caching = cache ? createCachingLoader() : undefined;
  const hls = new Hls(
    caching ? { ...HLS_CONFIG, loader: caching.loaderClass } : HLS_CONFIG,
  );

  caching?.bindEvents(hls);

  let abortLoading: (() => void) | undefined;

  const unload = () => {
    abortLoading?.();
    video.dispatchEvent(new CustomEvent('unload'));
    hls.stopLoad();
    hls.detachMedia();
  };

  const load = (url: string) => {
    const { promise, resolve, reject } = Promise.withResolvers<void>();

    unload();

    const onLoad = () => {
      cleanup();
      resolve();
    };

    const onLoadError = (_event: typeof Hls.Events.ERROR, data: ErrorData) => {
      if (data.fatal) {
        cleanup();
        video.dispatchEvent(new CustomEvent('unload'));
        reject(
          CODEC_ERRORS.has(data.details)
            ? VideoError.UnsupportedCodec
            : VideoError.Other,
        );
      }
    };

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoad);
      hls.off(Hls.Events.ERROR, onLoadError);
      abortLoading = undefined;
    };

    abortLoading = () => {
      cleanup();
      reject(VideoError.Interrupted);
    };

    hls.loadSource(url);
    hls.attachMedia(video);

    video.addEventListener('loadedmetadata', onLoad);
    hls.on(Hls.Events.ERROR, onLoadError);

    return promise;
  };

  const destroy = () => {
    unload();
    hls.destroy();
  };

  return {
    load,
    unload,
    destroy,

    ...attachHlsTracks(hls, video),

    video,
    hls,
  };
}
