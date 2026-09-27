export const CACHE_SCHEME = 'shaka-cache';
export const CACHE_PREFIX = `${CACHE_SCHEME}:`;

export type CacheEntry = {
  streamId: number;
  endTime: number;
};

type EvictionFilter = (entry: CacheEntry) => boolean;

export type SegmentCache = {
  entries: Map<string, CacheEntry>;
  open: () => Promise<Cache>;
  clear: () => void;
  evict: (filter: EvictionFilter) => Promise<boolean>;
};

export function toCacheKey(uri: string, range: Maybe<string>) {
  if (!range) {
    return uri;
  }

  const url = new URL(uri);
  url.searchParams.set(`${CACHE_SCHEME}-range`, range);
  return url.href;
}

export function createSegmentCache(cacheName: string): SegmentCache {
  const entries = new Map<string, CacheEntry>();

  let cache: Maybe<Promise<Cache>>;
  let cacheDeleted: Promise<unknown> = Promise.resolve();

  const open = () =>
    (cache ??= cacheDeleted.then(() => caches.open(cacheName)));

  const clear = () => {
    entries.clear();
    cacheDeleted = Promise.resolve(cache)
      .then(() => caches.delete(cacheName))
      .catch(() => false);
    cache = undefined;
  };

  const evict = async (filter: EvictionFilter) => {
    const target = await open();
    const deletions: Promise<boolean>[] = [];

    for (const [key, entry] of entries) {
      if (filter(entry)) {
        entries.delete(key);
        deletions.push(target.delete(key));
      }
    }

    await Promise.all(deletions);
    return deletions.length > 0;
  };

  return { entries, open, clear, evict };
}

export function holdCacheLock(cacheName: string) {
  let released = false;
  let releaseLock: Maybe<() => void>;

  void navigator.locks.request(cacheName, async () => {
    const { held = [] } = await navigator.locks.query();
    const heldNames = new Set(held.map((lock) => lock.name));
    await caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) => name.startsWith(CACHE_PREFIX) && !heldNames.has(name),
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .catch(() => null);

    if (!released) {
      await new Promise<void>((resolve) => {
        releaseLock = resolve;
      });
    }
  });

  return () => {
    released = true;
    releaseLock?.();
  };
}
