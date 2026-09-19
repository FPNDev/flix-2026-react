import shaka from 'shaka-player';
import type { RemuxerError, ShakaHttpError } from '../types/httpErrors.types';

export function isRemuxerError(error: unknown): error is RemuxerError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof error.error === 'string'
  );
}

export function isShakaNetworkingError(error: shaka.extern.Error): boolean {
  return error.category === shaka.util.Error.Category.NETWORK;
}

export function parseShakaNetworkError<T>(
  error: shaka.extern.Error,
): ShakaHttpError<T> | undefined {
  if (!isShakaNetworkingError(error)) {
    return;
  }

  const errorResponse = error.data[2];
  let parsedError;
  try {
    parsedError = JSON.parse(errorResponse);
  } catch {}

  return {
    status: +error.data[1] || null,
    data: parsedError,
  };
}
