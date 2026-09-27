import type shaka from 'shaka-player';

export const SHAKA_CONFIG = {
  abr: {
    enabled: false,
  },
  streaming: {
    bufferBehind: 30,
    bufferingGoal: 30,
    retryParameters: {
      maxAttempts: 5,
      connectionTimeout: 10_000,
      stallTimeout: 15_000,
      timeout: 180_000,
    },
    segmentPrefetchLimit: 1,
  },
  manifest: {
    retryParameters: {
      connectionTimeout: 0,
      stallTimeout: 0,
      timeout: 180_000,
    },
    hls: {
      disableClosedCaptionsDetection: true,
    },
  },
} as const satisfies DeepPartial<shaka.extern.PlayerConfiguration>;
