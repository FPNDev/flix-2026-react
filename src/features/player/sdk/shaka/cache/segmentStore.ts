export const CACHE_SUPPORTED = 'caches' in self;

const EVICT_COUNT = 5;
const CACHE_PREFIX = 'segments-';

async function sweep(ownName: string) {
  for (const name of await caches.keys()) {
    if (name.startsWith(CACHE_PREFIX) && name !== ownName) {
      await navigator.locks.request(name, { ifAvailable: true }, (lock) =>
        lock ? caches.delete(name) : undefined,
      );
    }
  }
}

export function createSegmentStore() {
  let cacheHandle: Cache | undefined;

  const cacheName = `${CACHE_PREFIX}${crypto.randomUUID()}`;
  const cachedUrls = new Set<string>();
  const servedUrls = new Set<string>();
  const { promise: released, resolve: releaseLock } =
    Promise.withResolvers<void>();

  if ('locks' in navigator) {
    navigator.locks.request(cacheName, () => released).catch(() => {});
    sweep(cacheName).catch(() => {});
  }

  const getCacheHandle = async () => {
    return (cacheHandle ??= await caches.open(cacheName));
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

  const clear = () => {
    cacheHandle = undefined;
    cachedUrls.clear();
    servedUrls.clear();
    caches.delete(cacheName).catch(() => {});
    releaseLock();
  };

  return { has, match, put, clear, markServed };
}
