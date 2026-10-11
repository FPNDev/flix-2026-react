import Hls, {
  LoaderContextType,
  PlaylistLevelType,
  XhrLoader,
  type FragmentLoaderContext,
  type LevelDetails,
  type LoaderCallbacks,
  type LoaderContext,
  type LoaderStats,
} from 'hls.js';
import { createSegmentStore } from './segmentStore';

type SegmentRequest = {
  context: LoaderContext;
  callbacks: LoaderCallbacks<LoaderContext>;
  stats: LoaderStats;
  signal: AbortSignal;
};

export function createCachingLoader() {
  let hls: Hls;
  let activeLevel = 0;

  const store = createSegmentStore();
  const cursors = new Map<PlaylistLevelType, number>();
  const inFlights = new Map<string, Promise<void>>();
  const prefetchers = new Map<PlaylistLevelType, AbortController>();

  const abortPrefetch = (type: PlaylistLevelType) => {
    prefetchers.get(type)?.abort();
    prefetchers.delete(type);
  };

  const abortPrefetches = () => {
    for (const controller of prefetchers.values()) {
      controller.abort();
    }
    prefetchers.clear();
  };

  const clear = () => {
    abortPrefetches();
    store.clear();
  };

  function bindEvents(instance: Hls) {
    hls = instance;

    const onUpdated = (type: PlaylistLevelType) => () => {
      cursors.delete(type);
      abortPrefetch(type);
    };

    hls.on(Hls.Events.MANIFEST_LOADING, () => {
      abortPrefetches();
      cursors.clear();
    });
    hls.on(Hls.Events.LEVEL_UPDATED, onUpdated(PlaylistLevelType.MAIN));
    hls.on(Hls.Events.AUDIO_TRACK_UPDATED, onUpdated(PlaylistLevelType.AUDIO));
    hls.on(
      Hls.Events.SUBTITLE_TRACK_UPDATED,
      onUpdated(PlaylistLevelType.SUBTITLE),
    );
    hls.on(Hls.Events.DESTROYING, () => {
      clear();
      window.removeEventListener('pagehide', clear);
    });
    window.addEventListener('pagehide', clear);
  }

  async function getSegment(
    type: PlaylistLevelType,
    segmentNumber: number,
    url: string,
    signal: AbortSignal,
  ) {
    while (inFlights.has(url)) {
      await inFlights.get(url);
    }

    const { promise, resolve } = Promise.withResolvers<void>();
    inFlights.set(url, promise);

    try {
      let response = await store.match(url);
      if (!response) {
        response = await fetch(url, { signal });
        if (!response.ok) {
          throw response;
        }
        try {
          await store.put(url, response);
        } catch (err: unknown) {
          if (!signal.aborted) {
            reportError(err);
          }
        }
      }

      if (cursors.get(type) === segmentNumber) {
        cursors.set(type, segmentNumber + 1);
        void prefetch(type, segmentNumber + 1);
      }

      return response;
    } finally {
      inFlights.delete(url);
      resolve();
    }
  }

  async function prefetch(type: PlaylistLevelType, segmentNumber: number) {
    let details: LevelDetails | undefined;
    switch (type) {
      case PlaylistLevelType.MAIN:
        details = hls.levels[activeLevel]?.details;
        break;
      case PlaylistLevelType.AUDIO:
        details = hls.audioTracks[hls.audioTrack]?.details;
        break;
      case PlaylistLevelType.SUBTITLE:
        details = hls.subtitleTracks[hls.subtitleTrack]?.details;
        break;
    }

    const fragment = details?.fragments[segmentNumber - details.startSN];
    if (!fragment) {
      return;
    }

    const controller = prefetchers.get(type) ?? new AbortController();
    prefetchers.set(type, controller);

    const { signal } = controller;
    const { maxLoadTimeMs, timeoutRetry, errorRetry } =
      hls.config.fragLoadPolicy.default;

    for (
      let retry = 0;
      cursors.get(type) === segmentNumber && !signal.aborted;
      retry++
    ) {
      try {
        await getSegment(
          type,
          segmentNumber,
          fragment.url,
          AbortSignal.any([signal, AbortSignal.timeout(maxLoadTimeMs)]),
        );

        return;
      } catch (err: unknown) {
        const retryConfig =
          err instanceof Error && err.name === 'TimeoutError'
            ? timeoutRetry
            : errorRetry;

        if (!retryConfig || retry >= retryConfig.maxNumRetry) {
          return;
        }

        const delay = Math.min(
          2 ** retry * retryConfig.retryDelayMs,
          retryConfig.maxRetryDelayMs,
        );

        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
      }
    }
  }

  async function deliver(request: SegmentRequest, response: Response) {
    const { context, callbacks, stats, signal } = request;
    stats.loading.first = performance.now();

    let data: ArrayBuffer;
    try {
      data = await response.arrayBuffer();
    } catch (err: unknown) {
      fail(request, err);
      return;
    }

    if (signal.aborted) {
      return;
    }

    stats.loading.end = performance.now();
    stats.loaded = stats.total = data.byteLength;
    callbacks.onSuccess({ url: response.url, data }, stats, context, response);
  }

  function fail(
    { context, callbacks, stats, signal }: SegmentRequest,
    err: unknown,
  ) {
    if (signal.aborted) {
      return;
    }

    stats.loading.end = performance.now();
    const response = err instanceof Response ? err : null;
    callbacks.onError(
      response
        ? { code: response.status, text: response.statusText }
        : { code: 0, text: String(err) },
      context,
      response,
      stats,
    );
  }

  function loadFromCache(request: SegmentRequest) {
    const { context, signal } = request;
    if (context.type !== LoaderContextType.MEDIA_FRAGMENT) {
      return;
    }

    const { frag } = context as FragmentLoaderContext;
    const { type, sn } = frag;
    if (sn === 'initSegment') {
      return;
    }

    if (type === PlaylistLevelType.MAIN) {
      activeLevel = frag.level;
    }

    if (hls.media?.seeking && cursors.get(type) !== sn) {
      abortPrefetch(type);
    }

    cursors.set(type, sn);

    return getSegment(type, sn, context.url, signal).then(
      (response) => deliver(request, response),
      (err: unknown) => {
        fail(request, err);
      },
    );
  }

  const loaderClass = class extends XhrLoader {
    #controller = new AbortController();

    protected loadInternal() {
      const { context, config, callbacks, stats } = this;
      if (!context || !config || !callbacks) {
        return;
      }

      const { signal } = this.#controller;
      const loading = loadFromCache({ context, callbacks, stats, signal });
      if (!loading) {
        super.loadInternal();
        return;
      }

      this.requestTimeout = self.setTimeout(() => {
        this.loadtimeout();
      }, config.loadPolicy.maxLoadTimeMs);

      void loading.finally(() => {
        self.clearTimeout(this.requestTimeout);
      });
    }

    protected abortInternal() {
      if (this.callbacks) {
        this.stats.aborted = true;
      }
      this.#controller.abort();
      super.abortInternal();
    }
  };

  return { loaderClass, bindEvents };
}
