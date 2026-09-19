/**
 * Generates a URL to magnet-link media remuxer endpoint
 */
export function magnetRemuxerURI(
  pathname: string,
  queryParams?: Record<string, Serializable | Serializable[]>,
) {
  const url = new URL(import.meta.env.VITE_MAGNET_REMUXER_URI);
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
