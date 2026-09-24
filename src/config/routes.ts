import App from '@/App';
import type { RouteObject } from 'react-router';

export const routes = {
  index: '/',
};

export const routerConfig: RouteObject[] = [
  {
    Component: App,
    HydrateFallback: () => 'loading page',
    children: [
      {
        index: true,
        lazy: () => import('@/pages/PlayerPage'),
      },
    ],
  },
];
