import type { ShakaRetryParameters } from '@/features/player/types/shaka.types';
import { fetchWithRetry } from '@/utils/shakaCacheWorker';

const CACHE_INSTANCE_HEADER = 'X-Shaka-Cache-Instance';
const CACHE_PREFIX = `shaka-cache`;

type ActiveInstance = {
  queues: Record<'video' | 'audio' | 'text', string[]>;
  cachedHistory: string[];
  isPrefetching: boolean;
  isBufferFull: boolean;
  retryConfig: ShakaRetryParameters;
};

// Global deduplication map (prevents SW Prefetch & Shaka Engine from fetching the same URL twice)
const inFlightRequests = new Map<string, Promise<Response>>();
const activeInstances = new Map<string, ActiveInstance>();

const cacheKey = (instanceId: string) => `${CACHE_PREFIX}/${instanceId}`;

async function fetchAndCache(
  instanceId: string,
  url: string,
): Promise<Response> {
  const flightKey = `${instanceId}|${url}`;
  if (inFlightRequests.has(flightKey)) {
    return (await inFlightRequests.get(flightKey)!).clone();
  }

  const promise = (async () => {
    const cache = await caches.open(cacheKey(instanceId));
    const cached = await cache.match(url);

    if (cached) {
      return cached.clone();
    }

    try {
      const currentState = activeInstances.get(instanceId)!;
      const response = await fetchWithRetry(
        url,
        cache,
        currentState?.retryConfig,
      );

      // Successfully fetched & cached inside fetchWithRetry, record history
      const pushState = activeInstances.get(instanceId);
      if (pushState && !pushState.cachedHistory.includes(url)) {
        pushState.cachedHistory.push(url);
      }

      return response;
    } catch (err) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        const currentState = activeInstances.get(instanceId);
        if (currentState) {
          currentState.isBufferFull = true;
        }

        await trimAndResume(instanceId);

        // One last retry after cleaning space
        try {
          const retryState = activeInstances.get(instanceId)!;
          return await fetchWithRetry(url, cache, retryState?.retryConfig);
        } catch {
          return new Response(null, {
            status: 507,
            statusText: 'Insufficient Storage',
          });
        }
      }
      throw err;
    } finally {
      // Always cleanup flight requests
      inFlightRequests.delete(flightKey);
    }
  })();

  inFlightRequests.set(flightKey, promise);
  return promise;
}

async function trimAndResume(instanceId: string) {
  const state = activeInstances.get(instanceId);
  if (!state || !state.isBufferFull) {
    return;
  }

  const cache = await caches.open(cacheKey(instanceId));
  const toDelete = state.cachedHistory.splice(0, 5);

  await Promise.allSettled(toDelete.map((url) => cache.delete(url)));

  state.isBufferFull = false;
  processQueues(instanceId).catch(console.error);
}

async function processQueues(instanceId: string) {
  const state = activeInstances.get(instanceId);
  if (!state || state.isPrefetching || state.isBufferFull) {
    return;
  }

  state.isPrefetching = true;

  // Recursive drain ensures ESLint no-await-in-loop compliance and
  // safely evaluates new state/queues dropped in via START_PREFETCH
  const drainNextBatch = async (): Promise<void> => {
    const current = activeInstances.get(instanceId);
    if (!current || current.isBufferFull) {
      return;
    }

    // Shift exactly one chunk from each track type
    const urlsToFetch = [
      current.queues.video?.shift(),
      current.queues.audio?.shift(),
      current.queues.text?.shift(),
    ].filter(Boolean) as string[];

    if (urlsToFetch.length === 0) {
      return;
    }

    // Wait for this chunk block to finish before pulling next
    await Promise.allSettled(
      urlsToFetch.map((url) => fetchAndCache(instanceId, url)),
    );

    return drainNextBatch();
  };

  try {
    await drainNextBatch();
  } finally {
    const currentState = activeInstances.get(instanceId);
    if (currentState) {
      currentState.isPrefetching = false;
    }
  }
}

self.addEventListener('message', (event) => {
  const { type, instanceId } = event.data ?? {};

  if (!type) {
    return;
  }

  // Keeps SW working while video is "active"
  if (type === 'WARMUP') {
    return;
  }

  if (type === 'INIT_SESSION') {
    inFlightRequests.clear();
    activeInstances.clear();
    caches.keys().then((keys) => {
      for (const key of keys) {
        if (key.startsWith(CACHE_PREFIX)) {
          caches.delete(key);
        }
      }
    });
    return;
  }

  if (type === 'CLEAR_CACHE' && instanceId) {
    activeInstances.delete(instanceId);
    caches.delete(cacheKey(instanceId));
    return;
  }

  if (type === 'START_PREFETCH' && instanceId) {
    const existingState = activeInstances.get(instanceId);
    const {
      retryParams,
      videoUris = [],
      audioUris = [],
      textUris = [],
    } = event.data;

    activeInstances.set(instanceId, {
      queues: { video: videoUris, audio: audioUris, text: textUris },
      retryConfig: retryParams ?? {},
      isPrefetching: existingState?.isPrefetching ?? false,
      isBufferFull: existingState?.isBufferFull ?? false,
      cachedHistory: existingState?.cachedHistory ?? [],
    });

    processQueues(instanceId).catch(console.error);
  }
});

self.addEventListener('fetch', ((event: FetchEvent) => {
  const instanceId = event.request.headers.get(CACHE_INSTANCE_HEADER);
  if (!instanceId) {
    return;
  }

  event.respondWith(
    (() => {
      const state = activeInstances.get(instanceId);
      if (state?.isBufferFull) {
        // Trigger a clean if we hit cache limits while Shaka was loading
        event.waitUntil(trimAndResume(instanceId));
      }

      return fetchAndCache(instanceId, event.request.url);
    })(),
  );
}) as Parameters<typeof self.addEventListener>[1]);
