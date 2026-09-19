/**
 * Generates a URL to media remuxer endpoint
 */
export function remuxerURI(
  pathname: string,
  queryParams?: Record<string, Serializable | Serializable[]>,
) {
  const url = new URL(import.meta.env.VITE_REMUXER_URI);
  url.pathname = pathname;
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (Array.isArray(value)) {
        for (const entry of value as Serializable[]) {
          url.searchParams.append(key, entry.toString());
        }
      } else {
        url.searchParams.set(key, value.toString());
      }
    }
  }

  return url.toString();
}
