import { handleHttpError } from '@/api/errors';
import { magnetRemuxerURI } from './urls';
import type { FilesResponse } from '../types/mediaFiles.types';
import { isAbortError } from '@/utils/abort';

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

export async function fetchPlayableFiles(
  magnetURI: string,
  signal: AbortSignal,
) {
  if (!magnetURI) {
    throw new Error('Specify URL first');
  }

  let data: FilesResponse;
  try {
    data = await fetchMediaFiles<FilesResponse>(magnetURI, signal);
  } catch (err) {
    if (!isAbortError(err)) {
      throw new Error('Failed to fetch file list for specified URI');
    }
    return;
  }

  const playable = data.files.filter((file) => file.playable);
  if (playable.length === 0) {
    throw new Error('URI has no playable files');
  }

  return playable;
}
