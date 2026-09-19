export interface ShakaHttpError<T> {
  status: number | null;
  data?: T;
}

export interface RemuxerError {
  error: string;
}
