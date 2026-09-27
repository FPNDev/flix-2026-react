import { handleHttpError } from '@/api/errors';
import type { FilesResponse } from '../types/mediaFiles.types';
import { isAbortError } from '@/utils/abort';

/**
 * Generates a URL to media remuxer endpoint
 */
export function remuxerURI(
  pathname: string,
  queryParams?: Record<string, Serializable | Serializable[]>,
) {
  const url = new URL(import.meta.env.VITE_REMUXER_URI);
  url.pathname = pathname;
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (Array.isArray(value)) {
        for (const entry of value as Serializable[]) {
          url.searchParams.append(key, entry.toString());
        }
      } else {
        url.searchParams.set(key, value.toString());
      }
    }
  }

  return url.toString();
}

async function fetchMediaFiles<T>(sourceURI: string, signal?: AbortSignal) {
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
