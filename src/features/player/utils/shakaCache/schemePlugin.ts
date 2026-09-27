import shaka from 'shaka-player';
import { toCacheKey } from './segmentCache';
import type { SegmentCache } from './segmentCache';

export const stores = new Set<SegmentCache>();

function findStore(key: string) {
  for (const store of stores) {
    if (store.entries.has(key)) {
      return store;
    }
  }
}

export const cachePlugin: shaka.extern.SchemePlugin = (
  uri,
  request,
  type,
  progressUpdated,
  headersReceived,
  config,
) => {
  const fetchNetwork = () =>
    shaka.net.HttpFetchPlugin.parse(
      uri,
      request,
      type,
      progressUpdated,
      headersReceived,
      config,
    ) as shaka.extern.IAbortableOperation<shaka.extern.Response>;

  if (type !== shaka.net.NetworkingEngine.RequestType.SEGMENT) {
    return fetchNetwork();
  }

  const key = toCacheKey(uri, request.headers.Range);
  const store = findStore(key);
  if (!store) {
    return fetchNetwork();
  }

  let aborted = false;
  let networkOperation: Maybe<
    shaka.extern.IAbortableOperation<shaka.extern.Response>
  >;

  const promise = (async (): Promise<shaka.extern.Response> => {
    const data = await store
      .open()
      .then((cache) => cache.match(key))
      .then((cached) => cached?.arrayBuffer())
      .catch(() => null);

    if (aborted) {
      throw new shaka.util.Error(
        shaka.util.Error.Severity.RECOVERABLE,
        shaka.util.Error.Category.NETWORK,
        shaka.util.Error.Code.OPERATION_ABORTED,
        uri,
        type,
      );
    }

    if (data) {
      return {
        uri,
        originalUri: uri,
        data,
        status: 200,
        headers: {},
        originalRequest: request,
        fromCache: true,
      };
    }

    store.entries.delete(key);
    networkOperation = fetchNetwork();
    return networkOperation.promise;
  })();

  return new shaka.util.AbortableOperation(promise, () => {
    aborted = true;
    return networkOperation?.abort() ?? Promise.resolve();
  });
};
