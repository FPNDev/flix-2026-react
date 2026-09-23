import shaka from 'shaka-player';
import { isRemuxerError, parseShakaNetworkError } from './httpErrors';

export function isShakaError(error: unknown): error is shaka.util.Error {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'category' in error &&
    'severity' in error
  );
}

export const throwIfNotInterrupted = (err: unknown) => {
  if (isShakaError(err)) {
    if (err.code === shaka.util.Error.Code.LOAD_INTERRUPTED) {
      return;
    }

    const networkError = parseShakaNetworkError(err);
    if (networkError && isRemuxerError(networkError.data)) {
      throw networkError;
    }
  }

  throw err;
};
