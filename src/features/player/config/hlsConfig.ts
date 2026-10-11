import type { HlsConfig, LoadPolicy } from 'hls.js';

const LOAD_POLICY = {
  default: {
    maxTimeToFirstByteMs: 180_000,
    maxLoadTimeMs: 180_000,
    timeoutRetry: {
      maxNumRetry: 3,
      retryDelayMs: 0,
      maxRetryDelayMs: 120_000,
    },
    errorRetry: {
      maxNumRetry: 3,
      retryDelayMs: 1_000,
      maxRetryDelayMs: 120_000,
    },
  },
} as const satisfies LoadPolicy;

export const HLS_CONFIG = {
  manifestLoadPolicy: LOAD_POLICY,
  playlistLoadPolicy: LOAD_POLICY,
  fragLoadPolicy: LOAD_POLICY,

  maxBufferLength: 10,
  backBufferLength: 0,
  maxBufferSize: Infinity,
} as const satisfies DeepPartial<HlsConfig>;
