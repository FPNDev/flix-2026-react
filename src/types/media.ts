export interface FilesResponse {
  hash: string;
  name: string;
  files: MediaFile[];
}

export interface MediaFile {
  index: number;
  name: string;
  path: string;
  length: number;
  playable: boolean;
}
