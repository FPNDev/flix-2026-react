export type FilesResponse = {
  hash: string;
  name: string;
  files: MediaFile[];
};

export type MediaFile = {
  index: number;
  name: string;
  path: string;
  length: number;
  playable: boolean;
};
