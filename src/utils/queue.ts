export type Queue = {
  add: (item: () => Promise<unknown>) => Promise<unknown>;
  onIdle: (callback: () => void) => void;
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

    const [item, resolveItem, rejectItem] = items.shift()!;
    let res;
    try {
      res = item();
      if (res instanceof Promise) {
        res.then(resolveItem, rejectItem).finally(() => {
          processQueue();
        });
      } else {
        resolveItem(res);
        processQueue();
      }
    } catch (err) {
      rejectItem(err);
    }
  }

  return {
    add: <T>(item: () => Promise<T>) => {
      let resolveItem: (val: T) => void;
      let rejectItem: (err: unknown) => void;
      const promise = new Promise<T>((resolve, reject) => {
        resolveItem = resolve;
        rejectItem = reject;
      });

      items.push([item, resolveItem! as (v: unknown) => void, rejectItem!]);
      if (!working) {
        processQueue();
      }

      return promise;
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
