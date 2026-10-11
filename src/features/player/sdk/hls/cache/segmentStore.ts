export function isCacheSupported() {
  return 'caches' in self;
}

export function createSegmentStore() {
  let cacheHandle: Cache | undefined;

  const cacheName = crypto.randomUUID();
  const cachedUrls = new Set<string>();

  navigator.storage?.persist?.().catch(() => {});

  async function getCacheHandle() {
    return (cacheHandle ??= await caches.open(cacheName));
  }

  async function writeCache(cache: Cache, url: string, response: Response) {
    await cache.put(url, response.clone());
    cachedUrls.add(url);
  }

  async function put(url: string, response: Response) {
    const cache = await getCacheHandle();
    try {
      await writeCache(cache, url, response);
    } catch (err: unknown) {
      if (!(err instanceof Error && err.name === 'QuotaExceededError')) {
        throw err;
      }

      let evicted = 0;
      for (const oldUrl of cachedUrls) {
        cachedUrls.delete(oldUrl);
        await cache.delete(oldUrl);

        if (++evicted === 5) {
          break;
        }
      }
      await writeCache(cache, url, response);
    }
  }

  async function match(url: string) {
    const cache = await getCacheHandle();
    return cache.match(url);
  }

  function clear() {
    cacheHandle = undefined;
    cachedUrls.clear();
    caches.delete(cacheName).catch(() => {});
  }

  return { match, put, clear };
}
