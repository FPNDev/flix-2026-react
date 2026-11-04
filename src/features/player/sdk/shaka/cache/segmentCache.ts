import shaka from 'shaka-player';
import { isClientError } from '../shakaErrors';
import { routeRequest } from './cachingScheme';
import { ensureSegmentStore } from './segmentStore';
import { createSharedFetches } from './sharedFetches';

type Chain = {
  stream: shaka.extern.Stream;
  start: number;
  position: number;
  failed: boolean;
  controller: AbortController;
  retryParameters: shaka.extern.RetryParameters;
};

const { AbortableOperation } = shaka.util;
const { SegmentReference } = shaka.media;
const { AdvancedRequestType, RequestType } = shaka.net.NetworkingEngine;
const { Category, Code, Severity } = shaka.util.Error;

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export function createSegmentCache(
  player: shaka.Player,
  onStorageError: (error: unknown) => void,
) {
  const store = ensureSegmentStore();
  const { join } = createSharedFetches(store, onStorageError);
  const chains = new Map<string, Chain>();

  const prefetch = async (
    url: string,
    retryParameters: shaka.extern.RetryParameters,
    signal: AbortSignal,
  ) => {
    const { maxAttempts, baseDelay, backoffFactor } = retryParameters;

    let delay = baseDelay;
    for (let attempt = 1; ; attempt++) {
      try {
        const { stored } = await join(url, retryParameters, signal);
        await stored;

        return store.has(url);
      } catch (error: unknown) {
        if (signal.aborted || attempt >= maxAttempts || isClientError(error)) {
          return false;
        }
      }

      await wait(delay, signal);
      delay *= backoffFactor;
    }
  };

  const isCached = async (url: string) => {
    if (store.has(url)) {
      return true;
    }

    try {
      return (await store.match(url)) !== undefined;
    } catch (error: unknown) {
      onStorageError(error);

      return false;
    }
  };

  const runChain = async (chain: Chain) => {
    const { stream, retryParameters, controller } = chain;
    const { signal } = controller;

    while (!signal.aborted) {
      const reference: unknown = stream.segmentIndex?.get(chain.position);
      if (!(reference instanceof SegmentReference)) {
        return;
      }

      const [url] = reference.getUris();
      if (url && !(await isCached(url))) {
        const fetched = await prefetch(url, retryParameters, signal);
        if (!fetched) {
          chain.failed = true;

          return;
        }
      }

      chain.position++;
    }
  };

  const updateChain = (
    stream: shaka.extern.Stream,
    segment: shaka.media.SegmentReference,
    retryParameters: shaka.extern.RetryParameters,
  ) => {
    const position: unknown = stream.segmentIndex?.find(segment.getStartTime());
    if (typeof position !== 'number') {
      return;
    }

    const chain = chains.get(stream.type);
    if (
      chain?.stream === stream &&
      chain.start <= position &&
      (position < chain.position ||
        (position === chain.position && !chain.failed))
    ) {
      return;
    }

    chain?.controller.abort();
    const next: Chain = {
      stream,
      start: position,
      position,
      failed: false,
      controller: new AbortController(),
      retryParameters,
    };
    chains.set(stream.type, next);
    void runChain(next);
  };

  const serve = async (
    uri: string,
    request: shaka.extern.Request,
    signal: AbortSignal,
  ): Promise<shaka.extern.Response> => {
    try {
      const cached = await store.match(uri);
      if (cached) {
        const data = await cached.arrayBuffer();
        store.markServed(uri);

        return {
          uri,
          originalUri: uri,
          data,
          status: cached.status,
          headers: Object.fromEntries(cached.headers),
          fromCache: true,
          originalRequest: request,
        };
      }
    } catch (error: unknown) {
      onStorageError(error);
    }

    const { response, stored } = await join(
      uri,
      request.retryParameters,
      signal,
    );
    void stored.then(() => {
      store.markServed(uri);
    });

    return { ...response, originalRequest: request };
  };

  const requestFilter: shaka.extern.RequestFilter = (_, request, context) => {
    const stream = context?.stream;
    const segment = context?.segment;
    if (
      context?.type !== AdvancedRequestType.MEDIA_SEGMENT ||
      !stream ||
      !segment
    ) {
      return;
    }

    routeRequest(request, (uri) => {
      updateChain(stream, segment, request.retryParameters);

      const controller = new AbortController();

      return new AbortableOperation(
        serve(uri, request, controller.signal),
        () => {
          controller.abort(
            new shaka.util.Error(
              Severity.RECOVERABLE,
              Category.NETWORK,
              Code.OPERATION_ABORTED,
              uri,
              RequestType.SEGMENT,
            ),
          );

          return Promise.resolve();
        },
      );
    });
  };

  player.getNetworkingEngine()?.registerRequestFilter(requestFilter);

  const abort = () => {
    for (const chain of chains.values()) {
      chain.controller.abort();
    }
    chains.clear();
  };

  return { abort };
}
