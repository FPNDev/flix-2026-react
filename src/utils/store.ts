type Store<T> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  set: (next: T) => void;
};

export function createStore<T = undefined>(initial?: T): Store<T>;
export function createStore<T>(initial: T): Store<T> {
  let snapshot = initial;
  const listeners = new Set<() => void>();

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    set: (next: T) => {
      snapshot = next;
      for (const listener of listeners) {
        listener();
      }
    },
  };
}
