export type ShakaHttpError<T> = {
  status: number | null;
  data?: T;
};

export type RemuxerError = {
  error: string;
};
