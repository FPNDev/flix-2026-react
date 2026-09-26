import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

export function initViteSW(
  wbManifest: ServiceWorkerGlobalScope['__WB_MANIFEST'],
) {
  clientsClaim();

  precacheAndRoute(wbManifest);
  cleanupOutdatedCaches();
  registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));
}
