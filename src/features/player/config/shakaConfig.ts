import type { ShakaPlayerConfig } from '../types/shaka.types';

export const SHAKA_CONFIG = {
  abr: {
    enabled: false,
  },
  streaming: {
    bufferingGoal: 30,
    retryParameters: {
      maxAttempts: 5,
      connectionTimeout: 0,
      stallTimeout: 15_000,
      timeout: 180_000,
    },
    // Other values arent yet supported by disk cache manager
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
} as const satisfies ShakaPlayerConfig;

// We're loading real segments via the Service Worker onto the disk
// to allow for "forever" loading, instead of limiting to bufferingGoal
// This both helps keeping our streaming warm and improves reads for large media files
export const SHAKA_SEGMENTS_MAX_RETRIES = 3;
