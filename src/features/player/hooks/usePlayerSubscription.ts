import { createStore } from '@/utils/store';
import {
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
} from 'react';
import type { VideoSdk } from '../sdk';

type Props<T> = {
  player: VideoSdk | undefined;
  events: string[];
  selector: (player: VideoSdk, evt?: Event) => T;
  fallback: T;
};

/**
 * Subscribes to video SDK events and exposes the selected value as a store snapshot
 */
export function usePlayerSubscription<T>({
  player,
  events,
  selector,
  fallback,
}: Props<T>) {
  const [store] = useState(() => createStore<T>(fallback));

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
      player.video.addEventListener(eventName, setValueOnEvent);
    }

    return () => {
      for (const eventName of events) {
        player.video.removeEventListener(eventName, setValueOnEvent);
      }
    };
  }, [player, events]);

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return { snapshot };
}
