import shaka from 'shaka-player';
import type { createSegmentStore } from './segmentStore';

type Fetched = {
  response: shaka.extern.Response;
  stored: Promise<void>;
};

type SharedFetch = {
  promise: Promise<Fetched>;
  abort: () => void;
  users: number;
};

type SegmentStore = ReturnType<typeof createSegmentStore>;

const { HttpFetchPlugin, NetworkingEngine } = shaka.net;

export function createSharedFetches(
  store: SegmentStore,
  onStorageError: (error: unknown) => void,
) {
  const inFlights = new Map<string, SharedFetch>();

  const fetchAndStore = async (
    url: string,
    operation: shaka.extern.IAbortableOperation<shaka.extern.Response>,
  ): Promise<Fetched> => {
    const response = await operation.promise;
    const stored = store
      .put(
        url,
        shaka.util.BufferUtils.toArrayBuffer(response.data),
        response.headers,
      )
      .catch(onStorageError);

    return { response, stored };
  };

  const start = (
    url: string,
    retryParameters: shaka.extern.RetryParameters,
  ) => {
    const operation = HttpFetchPlugin.parse(
      url,
      NetworkingEngine.makeRequest([url], retryParameters),
      NetworkingEngine.RequestType.SEGMENT,
      () => {},
      () => {},
      {},
    ) as shaka.extern.IAbortableOperation<shaka.extern.Response>;

    const remove = () => {
      if (inFlights.get(url) === shared) {
        inFlights.delete(url);
      }
    };

    const shared: SharedFetch = {
      promise: fetchAndStore(url, operation),
      abort: () => {
        remove();
        void operation.abort();
      },
      users: 0,
    };
    shared.promise.then(({ stored }) => stored.then(remove), remove);

    inFlights.set(url, shared);

    return shared;
  };

  const join = (
    url: string,
    retryParameters: shaka.extern.RetryParameters,
    signal: AbortSignal,
  ) => {
    if (signal.aborted) {
      return Promise.reject<Fetched>(signal.reason);
    }

    const shared = inFlights.get(url) ?? start(url, retryParameters);
    shared.users++;

    const { promise, resolve, reject } = Promise.withResolvers<Fetched>();

    const onAbort = () => {
      reject(signal.reason);
      if (--shared.users === 0) {
        shared.abort();
      }
    };
    signal.addEventListener('abort', onAbort, { once: true });

    shared.promise.then(resolve, reject).finally(() => {
      signal.removeEventListener('abort', onAbort);
    });

    return promise;
  };

  return { join };
}
