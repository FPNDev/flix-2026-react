import shaka from 'shaka-player';

const IDLE_AFTER_MS = 200;

let activeRequests = 0;
let lastActivity = 0;

const settle = () => {
  activeRequests -= 1;
  lastActivity = performance.now();
};

export function trackSegmentActivity(
  plugin: shaka.extern.SchemePlugin,
): shaka.extern.SchemePlugin {
  return (uri, request, type, progressUpdated, headersReceived, config) => {
    const operation = plugin(
      uri,
      request,
      type,
      progressUpdated,
      headersReceived,
      config,
    );

    if (type === shaka.net.NetworkingEngine.RequestType.SEGMENT) {
      activeRequests += 1;
      lastActivity = performance.now();
      void operation.promise.then(settle, settle);
    }

    return operation;
  };
}

export function msUntilShakaIdle() {
  if (activeRequests > 0) {
    return IDLE_AFTER_MS;
  }
  return Math.max(0, lastActivity + IDLE_AFTER_MS - performance.now());
}
