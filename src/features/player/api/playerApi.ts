import { handleHttpError } from '@/api/errors';
import { remuxerURI } from './urls';
import type { FilesResponse } from '../types/mediaFiles.types';
import { isAbortError } from '@/utils/abort';

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

export async function fetchPlayableFiles(
  sourceURI: string,
  signal: AbortSignal,
) {
  if (!sourceURI) {
    throw new Error('Specify URL first');
  }

  let data: FilesResponse;
  try {
    data = await fetchMediaFiles<FilesResponse>(sourceURI, signal);
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
