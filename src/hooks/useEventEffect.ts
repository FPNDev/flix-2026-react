import { useEffect, useEffectEvent } from 'react';

export function useEventEffect(
  cb: () => void | (() => void),
  deps: readonly unknown[],
) {
  const handleEffect = useEffectEvent(cb);
  useEffect(() => handleEffect(), deps);
}
