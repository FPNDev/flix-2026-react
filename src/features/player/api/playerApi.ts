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

  await handleHttpError(response);

  return (await response.json()) as T;
}
