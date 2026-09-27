export type Queue = {
  add: (item: () => Promise<unknown>) => Promise<unknown>;
  onIdle: () => Promise<void>;
};
/**
 * Creates a queue of promises, useful to keep async effects consecutive
 *
 * @returns Queue manager
 */
export function queue(): Queue {
  const items: [
    () => unknown,
    (value: unknown) => void,
    (err: unknown) => void,
  ][] = [];

  let reportIdle: () => void;
  let onIdle$ = Promise.resolve();

  let working = false;
  function refreshOnIdle() {
    onIdle$ = new Promise<void>((resolve) => {
      reportIdle = resolve;
    });
  }

  async function processQueue() {
    if (items.length === 0) {
      working = false;
      reportIdle();
      return;
    }

    if (!working) {
      refreshOnIdle();
      working = true;
    }

    const [item, resolveItem, rejectItem] = items.shift()!;

    try {
      resolveItem(await item());
    } catch (err) {
      rejectItem(err);
    } finally {
      void processQueue();
    }
  }

  return {
    add: <T>(item: () => Promise<T>) => {
      const { promise, resolve, reject } = Promise.withResolvers<unknown>();

      items.push([item, resolve, reject]);
      if (!working) {
        void processQueue();
      }

      return promise as Promise<T>;
    },
    onIdle: () => onIdle$,
  };
}
