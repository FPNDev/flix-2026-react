import { useEffectWithPrevious } from '@/hooks/useEffectWithPrevious';
import { createStore } from '@/utils/store';
import {
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
} from 'react';
import type shaka from 'shaka-player';

type Props<T> = {
  player: shaka.Player | undefined;
  events: string[];
  selector: (player: shaka.Player, evt?: Event) => T;
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
}: Props<T>) {
  const [store] = useState(() => createStore<T>(fallback));

  useEffectWithPrevious(
    ([oldPlayer]) => {
      if (oldPlayer !== player) {
        store.set(fallback);
      }
    },
    [player],
  );

  const setValueOnEvent = useEffectEvent((evt: Event) => {
    if (!player) {
      return;
    }
    store.set(selector(player, evt));
  });

  useEffect(() => {
    if (!player) {
      return;
    }

    for (const eventName of events) {
      player.addEventListener(eventName, setValueOnEvent);
    }

    return () => {
      for (const eventName of events) {
        player.removeEventListener(eventName, setValueOnEvent);
      }
    };
  }, [player, events]);

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return { snapshot };
}
