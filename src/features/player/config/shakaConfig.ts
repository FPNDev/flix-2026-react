import type shaka from 'shaka-player';

const RETRY_PARAMETERS = {
  maxAttempts: 4,
  fuzzFactor: 0,
  timeout: 180_000,
  connectionTimeout: 0,
  stallTimeout: 0,
} satisfies Partial<shaka.extern.RetryParameters>;

export const SHAKA_CONFIG = {
  abr: {
    enabled: false,
  },
  streaming: {
    bufferBehind: 0,
    segmentPrefetchLimit: 0,
    retryParameters: RETRY_PARAMETERS,
  },
  manifest: {
    retryParameters: RETRY_PARAMETERS,
    hls: {
      disableClosedCaptionsDetection: true,
    },
  },
} satisfies DeepPartial<shaka.extern.PlayerConfiguration>;
