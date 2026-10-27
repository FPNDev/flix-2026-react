import shaka from 'shaka-player';
import { CACHE_SUPPORTED } from './segmentStore';

type SegmentHandler = (
  uri: string,
) => shaka.extern.IAbortableOperation<shaka.extern.Response>;

const { HttpFetchPlugin, NetworkingEngine } = shaka.net;

const handlers = new WeakMap<shaka.extern.Request, SegmentHandler>();

export function routeRequest(
  request: shaka.extern.Request,
  handler: SegmentHandler,
) {
  handlers.set(request, handler);
}

function cachingPlugin(
  ...[uri, request, ...rest]: Parameters<shaka.extern.SchemePlugin>
): ReturnType<shaka.extern.SchemePlugin> {
  const handler = handlers.get(request);
  if (handler) {
    return handler(uri);
  }

  return HttpFetchPlugin.parse(
    uri,
    request,
    ...rest,
  ) as shaka.extern.IAbortableOperation<shaka.extern.Response>;
}

if (CACHE_SUPPORTED) {
  for (const scheme of ['http', 'https']) {
    NetworkingEngine.registerScheme(
      scheme,
      cachingPlugin,
      NetworkingEngine.PluginPriority.APPLICATION,
      true,
    );
  }
}
