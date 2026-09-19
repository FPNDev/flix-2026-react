export type Queue = {
  add: (item: () => Promise<unknown>) => void;
  onIdle: (callback: () => void) => void;
};
/**
 * Creates a queue of promises, useful to keep async effects consecutive
 *
 * @returns Queue manager
 */
export function queue(): Queue {
  const items: (() => unknown)[] = [];
  const callbacks: (() => void)[] = [];

  let working = false;

  function processQueue() {
    if (items.length === 0) {
      working = false;
      const callbackToRun = [...callbacks];
      callbacks.length = 0;
      for (const cb of callbackToRun) {
        cb();
      }

      return;
    }

    working = true;
    const item = items.shift()!;
    Promise.resolve(item()).finally(() => {
      processQueue();
    });
  }

  return {
    add: (item) => {
      items.push(item);
      if (!working) {
        processQueue();
      }
    },
    onIdle: (callback) => {
      if (working) {
        callbacks.push(callback);
      } else {
        callback();
      }
    },
  };
}
