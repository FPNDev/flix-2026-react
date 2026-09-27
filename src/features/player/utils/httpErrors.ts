import shaka from 'shaka-player';

type ShakaHttpError<T> = {
  status: number | null;
  data?: T;
};

type RemuxerError = {
  error: string;
};

export function isRemuxerError(error: unknown): error is RemuxerError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof error.error === 'string'
  );
}

function isShakaNetworkingError(error: shaka.extern.Error): boolean {
  return error.category === shaka.util.Error.Category.NETWORK;
}

export function parseShakaNetworkError<T>(
  error: shaka.extern.Error,
): ShakaHttpError<T> | undefined {
  if (!isShakaNetworkingError(error)) {
    return;
  }

  const errorResponse = error.data[2] as string;
  let parsedError: T | undefined;
  try {
    parsedError = JSON.parse(errorResponse) as T | undefined;
  } catch {}

  return {
    status: +error.data[1] || null,
    data: parsedError,
  };
}
