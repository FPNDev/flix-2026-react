if (!Promise.withResolvers) {
  Promise.withResolvers = <T>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve, reject };
  };
}

if (!AbortSignal.any) {
  AbortSignal.any = (signals: AbortSignal[]) => {
    const controller = new AbortController();
    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort(signal.reason);
        break;
      }

      signal.addEventListener(
        'abort',
        () => {
          controller.abort(signal.reason);
        },
        {
          once: true,
        },
      );
    }

    return controller.signal;
  };
}
