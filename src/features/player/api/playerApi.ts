import { handleHttpError } from '@/api/errors';
import { remuxerURI } from './urls';

export async function fetchMediaFiles<T>(
  sourceURI: string,
  signal?: AbortSignal,
) {
  const response = await fetch(
    remuxerURI('files', { source: sourceURI }),
    {
      signal,
    },
  );

  await handleHttpError(response);

  return (await response.json()) as T;
}
