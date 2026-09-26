import type { ShakaRetryParameters } from '@/features/player/types/shaka.types';

export function fetchWithRetry(
  url: string,
  cache: Cache,
  {
    maxAttempts = 2,
    baseDelay = 1000,
    backoffFactor = 2,
    fuzzFactor = 0.5,
    timeout = 0,
  }: ShakaRetryParameters = {},
): Promise<Response> {
  const makeAttempt = async (attempt = 1): Promise<Response> => {
    try {
      const response = await fetch(url, {
        signal: timeout ? AbortSignal.timeout(timeout) : undefined,
      });

      if (!response.ok) {
        // Cache terminal errors on final attempt to prevent loop-thrashing
        if (attempt >= maxAttempts) {
          await cache.put(url, response.clone());
        }
        return response;
      }

      await cache.put(url, response.clone());
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw error;
      }

      if (attempt >= maxAttempts) {
        if (error instanceof Response) {
          await cache.put(url, error.clone());
          return error;
        }

        const errorResponse = new Response(null, {
          status: 400,
          statusText: 'Network Error',
        });

        await cache.put(url, errorResponse.clone());
        return errorResponse;
      }

      const delay =
        baseDelay *
        backoffFactor ** attempt *
        (1 + (Math.random() * 2 - 1) * fuzzFactor);
      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });

      return makeAttempt(attempt + 1);
    }
  };

  return makeAttempt();
}
