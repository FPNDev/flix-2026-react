import { useRef } from 'react';
import { useEventEffect } from './useEventEffect';

export function useEffectWithPrevious<T extends readonly unknown[]>(
  cb: (prev: T | []) => void | (() => void),
  deps: T,
) {
  const prevRef = useRef<T | []>([]);

  useEventEffect(() => {
    const cleanup = cb(prevRef.current);
    prevRef.current = deps;

    return cleanup;
  }, deps);
}
