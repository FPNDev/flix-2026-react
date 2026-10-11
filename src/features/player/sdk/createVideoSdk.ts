import Hls from 'hls.js';
import { createHlsSdk } from './hls/hlsSdk';
import { isCacheSupported } from './hls/cache';
import { createNativeSdk } from './native/nativeSdk';
import type { VideoSdk } from './types';

export function createVideoSdk(video: HTMLVideoElement): VideoSdk | undefined {
  if (Hls.isSupported()) {
    return createHlsSdk(video, { cache: isCacheSupported() });
  }

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    return createNativeSdk(video);
  }

  return undefined;
}
