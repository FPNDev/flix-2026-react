class HttpError<T> {
  public status!: number;
  public url!: string;
  public data?: T;

  constructor(status: number, url: string, data: T) {
    this.data = data;
    this.status = status;
    this.url = url;
  }
}

export async function handleHttpError(res: Response) {
  if (res.ok) {
    return;
  }

  const errorText = await res.text().catch(() => {});
  let errorData: unknown = errorText;
  if (errorText) {
    try {
      errorData = JSON.parse(errorText) as unknown;
    } catch {
      // Data already assigned to text - skip
    }
  }

  throw new HttpError(res.status, res.url, errorData);
}
