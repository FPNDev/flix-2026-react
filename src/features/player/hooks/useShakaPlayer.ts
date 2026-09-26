import { queue, type Queue } from '@/utils/queue';
import { createStore } from '@/utils/store';
import {
  useEffectEvent,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import shaka from 'shaka-player';
import { useToast } from '@/components/DesignSystem/Toast';
import { SHAKA_CONFIG } from '../config/shakaConfig';
import { loadURL } from '../utils/shaka';
import { isRemuxerError } from '../utils/httpErrors';
import { attachShakaCache } from '@/utils/shakaCache';

type Props = {
  video: HTMLVideoElement | undefined;
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
export function useShakaPlayer({ video }: Props) {
  const { addToast } = useToast();

  const [store] = useState(() => createStore<PlayerInstance>(null));
  const { player, playerQueue } =
    useSyncExternalStore(store.subscribe, store.getSnapshot) ?? {};

  const [activeURI, setActiveURI] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const notifyUnsupportedBrowser = useEffectEvent(() => {
    addToast({
      icon: 'play_disabled',
      text: 'Browser does not support playback',
      variant: 'danger',
    });
  });

  // Create a new Shaka Player instance and configure it when the component mounts
  useLayoutEffect(() => {
    if (!shaka.Player.isBrowserSupported()) {
      notifyUnsupportedBrowser();
      return;
    }

    const newPlayer = new shaka.Player();
    const newPlayerQueue = queue();

    newPlayer.configure(SHAKA_CONFIG);
    newPlayerQueue.add(() =>
      navigator.serviceWorker.ready.then(() => {
        attachShakaCache(newPlayer);
      }),
    );

    if (import.meta.env.DEV) {
      (window as any)['__shakaPlayer'] = newPlayer;
    }

    store.set({ player: newPlayer, playerQueue: newPlayerQueue });

    return () => {
      store.set(null);
      newPlayerQueue.add(() => newPlayer.destroy());
    };
  }, [store]);

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

  const playFromURL = async (url: string) => {
    if (!player || !playerQueue || !video) {
      return false;
    }

    setActiveURI(url);
    if (!url) {
      playerQueue.onIdle().then(() => player.unload());
      return false;
    }

    setIsLoading(true);

    try {
      const loaded = await playerQueue
        .onIdle()
        .then(() => loadURL(player, url));
      if (loaded) {
        video.play();
        setIsLoading(false);
      }

      return loaded;
    } catch (err) {
      setIsLoading(false);

      addToast({
        icon: 'play_disabled',
        text: isRemuxerError(err) ? err.error : 'Failed loading specified link',
        variant: 'danger',
      });
    }

    return false;
  };

  return { player, activeURI, isLoading, playFromURL };
}
