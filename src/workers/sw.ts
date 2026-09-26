/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

self.skipWaiting();

import { initViteSW } from './vite.sw';
import './shaka-cache.sw';

initViteSW(self.__WB_MANIFEST);
