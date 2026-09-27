import { type Context, useContext } from 'react';

export function useContextOrThrow<T>(
  context: Context<T | null>,
  errorMessage: string,
) {
  const state = useContext(context);
  if (state === null) {
    throw new Error(errorMessage);
  }

  return state;
}
