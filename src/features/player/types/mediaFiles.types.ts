export type MediaFilesState = {
  files: MediaFile[];
  selectedFileIndex: number;
};

export type MediaFileActions = {
  navigateFiles: (direction: 1 | -1) => void;
  selectFile: (selectedIndex: number) => void;
  setFiles: (files: MediaFile[]) => void;
};

export type FilesResponse = {
  infoHash: string;
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
