import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { getFullscreenElement } from '@/utils/fullscreen';

const FULLSCREEN_EVENTS = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'MSFullscreenChange',
];

const subscribeFullscreen = (onFullscreenChange: () => void) => {
  for (const eventName of FULLSCREEN_EVENTS) {
    document.addEventListener(eventName, onFullscreenChange);
  }

  return () => {
    for (const eventName of FULLSCREEN_EVENTS) {
      document.removeEventListener(eventName, onFullscreenChange);
    }
  };
};

export const FullscreenPortal = ({ children }: React.PropsWithChildren) => {
  const fullscreenElement = useSyncExternalStore(
    subscribeFullscreen,
    getFullscreenElement,
  );

  if (fullscreenElement) {
    return createPortal(children, fullscreenElement);
  }

  return children;
};
