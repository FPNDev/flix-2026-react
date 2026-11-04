export const CACHE_SUPPORTED = 'caches' in self;

const EVICT_COUNT = 5;
const CACHE_NAME = 'segments';
const LOCKS_SUPPORTED = 'locks' in navigator;

function deleteIfUnused() {
  return navigator.locks.request(CACHE_NAME, { ifAvailable: true }, (lock) =>
    lock ? caches.delete(CACHE_NAME) : undefined,
  );
}

export function createSegmentStore() {
  let cacheHandle: Cache | undefined;

  const cachedUrls = new Set<string>();
  const servedUrls = new Set<string>();
  const { promise: held, resolve: markHeld } = Promise.withResolvers<void>();
  const { promise: released, resolve: releaseLock } =
    Promise.withResolvers<void>();

  if (LOCKS_SUPPORTED) {
    deleteIfUnused().catch(() => {});
    navigator.locks
      .request(CACHE_NAME, { mode: 'shared' }, () => {
        markHeld();

        return released;
      })
      .then(deleteIfUnused)
      .catch(() => {});
  } else {
    markHeld();
  }

  const getCacheHandle = async () => {
    await held;

    return (cacheHandle ??= await caches.open(CACHE_NAME));
  };

  const writeCache = async (
    cache: Cache,
    url: string,
    data: BufferSource,
    headers: Record<string, string>,
  ) => {
    await cache.put(url, new Response(data, { headers }));
    cachedUrls.add(url);
  };

  const put = async (
    url: string,
    data: BufferSource,
    headers: Record<string, string>,
  ) => {
    const cache = await getCacheHandle();
    try {
      await writeCache(cache, url, data, headers);
    } catch (error: unknown) {
      if (!(error instanceof Error && error.name === 'QuotaExceededError')) {
        throw error;
      }

      let evicted = 0;
      for (const oldUrl of servedUrls) {
        servedUrls.delete(oldUrl);
        if (!cachedUrls.delete(oldUrl)) {
          continue;
        }
        await cache.delete(oldUrl);

        if (++evicted === EVICT_COUNT) {
          break;
        }
      }
      if (evicted === 0) {
        throw error;
      }
      await writeCache(cache, url, data, headers);
    }
  };

  const match = async (url: string) => {
    const cache = await getCacheHandle();
    const response = await cache.match(url);
    if (!response) {
      cachedUrls.delete(url);
    }

    return response;
  };

  const has = (url: string) => {
    return cachedUrls.has(url);
  };

  const markServed = (url: string) => {
    servedUrls.add(url);
  };

  window.addEventListener('pagehide', (event) => {
    if (event.persisted) {
      return;
    }
    if (LOCKS_SUPPORTED) {
      releaseLock();
    } else {
      caches.delete(CACHE_NAME).catch(() => {});
    }
  });

  return { has, match, put, markServed };
}

let store: ReturnType<typeof createSegmentStore> | undefined;

export function ensureSegmentStore() {
  return (store ??= createSegmentStore());
}
