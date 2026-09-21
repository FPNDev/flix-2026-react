export const SHAKA_CONFIG = {
  abr: {
    enabled: false,
  },
  streaming: {
    retryParameters: {
      connectionTimeout: 0,
      stallTimeout: 0,
      timeout: 150_000,
    },
    segmentPrefetchLimit: 2,
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
};
