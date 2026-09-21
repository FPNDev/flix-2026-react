import { queue, type Queue } from '@/utils/queue';
import { createStore } from '@/utils/store';
import { useLayoutEffect, useState, useSyncExternalStore } from 'react';
import shaka from 'shaka-player';
import { useToast } from '@/components/DesignSystem/Toast';
import { SHAKA_CONFIG } from '../config/shaka';

type UseShakaPlayerProps = {
  video?: HTMLVideoElement;
};

type PlayerInstance = {
  player: shaka.Player;
  playerQueue: Queue;
} | null;

shaka.polyfill.installAll();

/**
 * Manages Shaka Player under given video element as a hook
 * Detach/attach & destroy implemented
 */
export function useShakaPlayer({ video }: UseShakaPlayerProps) {
  const { addToast } = useToast();

  const [store] = useState(() => createStore<PlayerInstance>(null));
  const { player, playerQueue } =
    useSyncExternalStore(store.subscribe, store.getSnapshot) ?? {};

  // Create a new Shaka Player instance and configure it when the component mounts
  useLayoutEffect(() => {
    if (!shaka.Player.isBrowserSupported()) {
      addToast({
        icon: 'play_disabled',
        text: 'Browser does not support playback',
        variant: 'danger',
      });
      return;
    }

    const newPlayer = new shaka.Player();
    const newPlayerQueue = queue();

    newPlayer.configure(SHAKA_CONFIG);
    if (import.meta.env.DEV) {
      (window as any)['__shakaPlayer'] = newPlayer;
    }

    store.set({ player: newPlayer, playerQueue: newPlayerQueue });

    return () => {
      store.set(null);
      newPlayerQueue.add(() => newPlayer.destroy());
    };
  }, [addToast, store]);

  // Attach the Shaka Player to the video element when it changes
  useLayoutEffect(() => {
    if (!video || !player || !playerQueue) {
      return;
    }

    playerQueue.add(() => player.attach(video));

    return () => {
      playerQueue.add(() => player.detach());
    };
  }, [video, player, playerQueue]);

  return { player, playerQueue };
}
