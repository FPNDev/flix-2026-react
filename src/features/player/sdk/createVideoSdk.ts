import shaka from 'shaka-player';
import { createNativeSdk } from './native/nativeSdk';
import { createShakaSdk } from './shaka/shakaSdk';
import type { VideoSdk } from './types';

shaka.polyfill.installAll();

const SHAKA_SUPPORTED =
  shaka.Player.isBrowserSupported() &&
  ('MediaSource' in window || 'ManagedMediaSource' in window);

export function createVideoSdk(video: HTMLVideoElement): VideoSdk | undefined {
  if (SHAKA_SUPPORTED) {
    return createShakaSdk(video);
  }

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    return createNativeSdk(video);
  }

  return undefined;
}
