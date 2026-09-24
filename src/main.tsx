import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { routerConfig } from './config/routes.ts';

createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <RouterProvider router={createBrowserRouter(routerConfig)} />
  </StrictMode>,
);
