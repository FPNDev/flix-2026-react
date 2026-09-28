import type shaka from 'shaka-player';

export const SHAKA_CONFIG = {
  abr: {
    enabled: false,
  },
  streaming: {
    bufferBehind: 0,
    bufferingGoal: 10,
    retryParameters: {
      maxAttempts: 5,
      connectionTimeout: 0,
      stallTimeout: 0,
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
  preferredVideo: [{ hdrLevel: 'AUTO' }],
} as const satisfies DeepPartial<shaka.extern.PlayerConfiguration>;
