import { useEffectWithPrevious } from '@/hooks/useEffectWithPrevious';
import { createStore } from '@/utils/store';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type shaka from 'shaka-player';

type UsePlayerSubscriptionProps<T> = {
  player?: Maybe<shaka.Player>;
  events: string[];
  selector: (player: shaka.Player) => T;
  fallback: T;
};

/**
 * Subscribes to Shaka player events and exposes the selected value as a store snapshot
 */
export function usePlayerSubscription<T>({
  player,
  events,
  selector,
  fallback,
}: UsePlayerSubscriptionProps<T>) {
  const [store] = useState(() => createStore<T>(fallback));

  const refresh = () => {
    store.set(player ? selector(player) : fallback);
  };

  useEffectWithPrevious(
    ([oldPlayer]) => {
      if (oldPlayer !== player) {
        store.set(fallback);
      }
    },
    [player],
  );

  useEffect(() => {
    if (!player) {
      return;
    }

    const onPlayerEvent = () => {
      store.set(selector(player));
    };

    for (const eventName of events) {
      player.addEventListener(eventName, onPlayerEvent);
    }

    return () => {
      for (const eventName of events) {
        player.removeEventListener(eventName, onPlayerEvent);
      }
    };
  }, [player, events, selector, store]);

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return { snapshot, refresh };
}
