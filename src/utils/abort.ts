/**
 * Aborts a controller inside ref, assigns new one and returns it
 *
 * @param abortControllerRef Ref with abort controller type
 * @returns Fresh abort controller
 */
export const renewAbortController = (
  abortControllerRef: React.RefObject<AbortController | null>,
): AbortController => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  abortControllerRef.current = new AbortController();

  return abortControllerRef.current;
};

export const isAbortError = (err: unknown): err is DOMException => {
  return err instanceof DOMException && err.name === 'AbortError';
};

export const anyAbortSignal = (signals: AbortSignal[]): AbortSignal => {
  if ('any' in AbortSignal) {
    return AbortSignal.any(signals);
  }

  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), {
      once: true,
    });
  }
  return controller.signal;
};
