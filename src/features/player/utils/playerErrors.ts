import type shaka from 'shaka-player';

export function isShakaError(error: unknown): error is shaka.util.Error {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'category' in error &&
    'severity' in error
  );
}
