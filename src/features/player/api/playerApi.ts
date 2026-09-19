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

  handleHttpError(response);

  return response.json() as T;
}
