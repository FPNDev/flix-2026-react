const CACHE_SCHEME = 'shaka-cache';
export const CACHE_PREFIX = `${CACHE_SCHEME}:`;
const QUOTA_USAGE_LIMIT = 0.75;
const QUOTA_CHECK_INTERVAL = 20;

export type CacheEntry = {
  streamId: number;
  startTime: number;
  endTime: number;
};

type StoredEntry = CacheEntry & {
  bytes: number;
};

type Playback = {
  currentTime: number;
  streamIds: ReadonlySet<number>;
};

type EvictionCandidate = {
  key: string;
  bytes: number;
  distance: number;
};

export type SegmentCache = {
  entries: Map<string, StoredEntry>;
  open: () => Promise<Cache>;
  put: (key: string, entry: CacheEntry, body: Blob) => Promise<void>;
  hasRoomFor: (entry: CacheEntry) => boolean;
  remove: (key: string) => void;
  clear: () => void;
};

export function toCacheKey(uri: string, range: Maybe<string>) {
  if (!range) {
    return uri;
  }

  const url = new URL(uri);
  url.searchParams.set(`${CACHE_SCHEME}-range`, range);
  return url.href;
}

export function createSegmentCache(
  cacheName: string,
  getPlayback: () => Playback,
  onChange: () => void,
): SegmentCache {
  const entries = new Map<string, StoredEntry>();

  let cache: Maybe<Promise<Cache>>;
  let cacheDeleted: Promise<unknown> = Promise.resolve();
  let quotaFull = false;
  let puts = 0;

  const open = () =>
    (cache ??= cacheDeleted.then(() => caches.open(cacheName)));

  const evictable = (incoming: CacheEntry) => {
    const playback = getPlayback();
    const incomingDistance = distance(incoming, playback);
    const candidates: EvictionCandidate[] = [];

    for (const [key, entry] of entries) {
      const entryDistance = distance(entry, playback);
      if (entryDistance > incomingDistance) {
        candidates.push({ key, bytes: entry.bytes, distance: entryDistance });
      }
    }

    return candidates;
  };

  const hasRoomFor = (entry: CacheEntry) =>
    !quotaFull || evictable(entry).length > 0;

  const evict = async (target: Cache, incoming: CacheEntry, bytes: number) => {
    const candidates = evictable(incoming);
    const deletions: Promise<boolean>[] = [];
    let freed = 0;

    candidates.sort((a, b) => b.distance - a.distance);

    for (const candidate of candidates) {
      if (freed >= bytes) {
        break;
      }
      freed += candidate.bytes;
      entries.delete(candidate.key);
      deletions.push(target.delete(candidate.key));
    }

    await Promise.all(deletions);
  };

  const write = async (key: string, entry: CacheEntry, body: Blob) => {
    const target = open();
    if (quotaFull) {
      await evict(await target, entry, body.size);
    }

    try {
      await (await target).put(key, new Response(body));
    } catch (error) {
      if (!isQuotaExceeded(error)) {
        throw error;
      }

      quotaFull = true;

      return;
    }

    if (target !== cache) {
      return;
    }

    entries.set(key, { ...entry, bytes: body.size });
    puts += 1;

    if (puts % QUOTA_CHECK_INTERVAL === 0) {
      quotaFull = !(await hasQuota());
    }
  };

  const put = async (key: string, entry: CacheEntry, body: Blob) => {
    if (!hasRoomFor(entry)) {
      return;
    }

    try {
      await write(key, entry, body);
    } finally {
      onChange();
    }
  };

  const remove = (key: string) => {
    if (entries.delete(key)) {
      onChange();
    }
  };

  const clear = () => {
    entries.clear();
    onChange();
    quotaFull = false;

    cacheDeleted = Promise.resolve(cache)
      .then(() => caches.delete(cacheName))
      .catch(() => false);

    cache = undefined;
  };

  return { entries, open, put, hasRoomFor, remove, clear };
}

function distance(
  { streamId, endTime }: CacheEntry,
  { currentTime, streamIds }: Playback,
) {
  return streamIds.has(streamId) && endTime > currentTime
    ? endTime - currentTime
    : Number.MAX_VALUE;
}

async function hasQuota() {
  const { usage = 0, quota = Infinity } = await navigator.storage
    .estimate()
    .catch((): StorageEstimate => ({}));

  return usage < quota * QUOTA_USAGE_LIMIT;
}

function isQuotaExceeded(error: unknown) {
  return error instanceof DOMException && error.name === 'QuotaExceededError';
}

export function holdCacheLock(cacheName: string) {
  let released = false;
  let releaseLock: Maybe<() => void>;

  void navigator.locks.request(cacheName, async () => {
    const { held = [] } = await navigator.locks.query();
    const heldNames = new Set(held.map((lock) => lock.name));
    const names = await caches.keys().catch((): string[] => []);
    const deletions: Promise<boolean>[] = [];

    for (const name of names) {
      if (name.startsWith(CACHE_PREFIX) && !heldNames.has(name)) {
        deletions.push(caches.delete(name));
      }
    }

    await Promise.all(deletions).catch(() => null);

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
