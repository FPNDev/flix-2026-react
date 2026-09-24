/** Parses JSON, but returns undefined instead of throwing */
export function parseJson<T>(text: string): T | undefined {
  try {
    return JSON.parse(text);
  } catch {
    // failed, returns undefined
  }
}
