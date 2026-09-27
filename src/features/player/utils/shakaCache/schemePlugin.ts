import shaka from 'shaka-player';
import { CACHE_PREFIX, toCacheKey } from './segmentCache';
import type { CacheEntry } from './segmentCache';

type CacheStore = {
  entries: Map<string, CacheEntry>;
  openCache: () => Promise<Cache>;
  onServed: () => void;
};

export const stores = new Map<string, CacheStore>();

export const cachePlugin: shaka.extern.SchemePlugin = (
  uri,
  request,
  type,
  progressUpdated,
  headersReceived,
  config,
) => {
  const separator = uri.indexOf('/');
  const store = stores.get(uri.slice(CACHE_PREFIX.length, separator));
  const originalUri = decodeURIComponent(uri.slice(separator + 1));
  const key = toCacheKey(originalUri, request.headers.Range);

  let aborted = false;
  let networkOperation: Maybe<
    shaka.extern.IAbortableOperation<shaka.extern.Response>
  >;

  const promise = (async (): Promise<shaka.extern.Response> => {
    const data = store?.entries.has(key)
      ? await store
          .openCache()
          .then((cache) => cache.match(key))
          .then((cached) => cached?.arrayBuffer())
          .catch(() => null)
      : undefined;

    if (aborted) {
      throw new shaka.util.Error(
        shaka.util.Error.Severity.RECOVERABLE,
        shaka.util.Error.Category.NETWORK,
        shaka.util.Error.Code.OPERATION_ABORTED,
        originalUri,
        type,
      );
    }

    if (data) {
      store?.onServed();
      return {
        uri: originalUri,
        originalUri,
        data,
        status: 200,
        headers: {},
        originalRequest: request,
        fromCache: true,
      };
    }

    store?.entries.delete(key);
    networkOperation = shaka.net.HttpFetchPlugin.parse(
      originalUri,
      request,
      type,
      progressUpdated,
      headersReceived,
      config,
    );
    return networkOperation.promise;
  })();

  return new shaka.util.AbortableOperation(promise, () => {
    aborted = true;
    return networkOperation?.abort() ?? Promise.resolve();
  });
};

export function createRequestFilter(
  cacheName: string,
  entries: Map<string, CacheEntry>,
): shaka.extern.RequestFilter {
  return (type, request) => {
    const [uri] = request.uris;
    if (
      type === shaka.net.NetworkingEngine.RequestType.SEGMENT &&
      uri &&
      entries.has(toCacheKey(uri, request.headers.Range))
    ) {
      request.uris = [`${cacheName}/${encodeURIComponent(uri)}`];
    }
  };
}
