import { handleHttpError } from '@/api/errors';
import { magnetRemuxerURI } from './urls';

export async function fetchMediaFiles<T>(
  magnetURI: string,
  signal?: AbortSignal,
) {
  const response = await fetch(
    magnetRemuxerURI('files', { magnet: magnetURI }),
    {
      signal,
    },
  );

  handleHttpError(response);

  return response.json() as T;
}
