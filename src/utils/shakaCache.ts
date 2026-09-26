import type shaka from 'shaka-player';

const CACHE_INSTANCE_HEADER = 'X-Shaka-Cache-Instance';

// Initialize session on page load (clears old caches)
await navigator.serviceWorker.ready.then(({ active: worker }) => {
  worker?.postMessage({ type: 'INIT_SESSION' });
});

export function attachShakaCache(player: shaka.Player) {
  const instanceId = crypto.randomUUID();
  let videoElement: HTMLVideoElement;

  const streamingRetryParams =
    player.getConfiguration().streaming.retryParameters;
  const originalMaxAttempts = streamingRetryParams.maxAttempts;

  // Rely on SW for retries
  player.configure('streaming.retryParameters.maxAttempts', 1);

  const networkingEngine = player.getNetworkingEngine();
  if (networkingEngine) {
    networkingEngine.registerRequestFilter((_type, request) => {
      request.headers[CACHE_INSTANCE_HEADER] = instanceId;
    });
  }

  if (navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {
      console.error(`[Shaka Cache] Could not request storage persistence`);
    });
  }

  async function syncPrefetch() {
    if (!videoElement) {
      return;
    }

    const manifest = player.getManifest();
    if (!manifest) {
      return;
    }

    const extractUris = async (stream: Maybe<shaka.extern.Stream>) => {
      if (!stream) {
        return [];
      }
      console.log(await stream.createSegmentIndex());
      console.log(stream.segmentIndex);
      if (!stream.segmentIndex) {
        return [];
      }

      const startPosition = stream.segmentIndex.find(videoElement.currentTime);
      if (startPosition === null) {
        return [];
      }

      const uris: string[] = [];
      let reference = stream.segmentIndex.get(startPosition);
      let currentPosition = startPosition;

      while (reference) {
        uris.push(reference.getUris()[0]);
        reference = stream.segmentIndex.get(++currentPosition);
      }
      return uris;
    };

    const activeVariant = player.getVariantTracks().find((t) => t.active);
    const activeText = player.getTextTracks().find((t) => t.active);

    const variantStream = activeVariant
      ? manifest.variants.find((v) => v.id === activeVariant.id)
      : undefined;
    const textStream = activeText
      ? manifest.textStreams.find((s) => s.id === activeText.id)
      : undefined;

    console.log(variantStream, variantStream?.audio);

    // Extract all segments in parallel
    const [videoUris, audioUris, textUris] = await Promise.all([
      extractUris(variantStream?.video),
      extractUris(variantStream?.audio),
      extractUris(textStream),
    ]);

    navigator.serviceWorker.controller?.postMessage({
      type: 'START_PREFETCH',
      instanceId,
      videoUris,
      audioUris,
      textUris,
      retryParams: {
        maxAttempts: originalMaxAttempts ?? 2,
        baseDelay: streamingRetryParams.baseDelay ?? 1000,
        backoffFactor: streamingRetryParams.backoffFactor ?? 2,
        fuzzFactor: streamingRetryParams.fuzzFactor ?? 0.5,
        timeout: streamingRetryParams.timeout ?? 180_000,
      },
    });
  }

  let keepWarmInterval = 0;

  const startInstance = () => {
    videoElement = player.getMediaElement()! as HTMLVideoElement;
    videoElement.addEventListener('seeked', syncPrefetch);

    clearInterval(keepWarmInterval);

    // Wake up SW controller and keep it alive
    navigator.serviceWorker.controller?.postMessage({ type: 'WARMUP' });
    keepWarmInterval = setInterval(() => {
      navigator.serviceWorker.controller?.postMessage({ type: 'WARMUP' });
    }, 20000);
  };

  const cleanupInstance = () => {
    videoElement.removeEventListener('seeked', syncPrefetch);
    navigator.serviceWorker.controller?.postMessage({
      type: 'CLEAR_CACHE',
      instanceId,
    });
    clearInterval(keepWarmInterval);
  };

  // Ensure queues resync when SW comes back online mid-playback
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (
      navigator.serviceWorker.controller &&
      videoElement &&
      player.getManifest()
    ) {
      syncPrefetch();
    }
  });

  player.addEventListener('loaded', syncPrefetch);
  player.addEventListener('adoption', syncPrefetch);
  player.addEventListener('variantchanged', syncPrefetch);
  player.addEventListener('texttrackchanged', syncPrefetch);

  player.addEventListener('loading', startInstance);
  player.addEventListener('unloading', cleanupInstance);
}
