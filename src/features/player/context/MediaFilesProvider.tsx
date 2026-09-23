import { type PropsWithChildren } from 'react';
import { useVideoFileSelection } from '../hooks/useVideoFileSelection';
import {
  MediaFileActionsContext,
  MediaFilesStateContext,
} from './MediaFilesContext';

export function MediaFilesProvider({ children }: PropsWithChildren) {
  const { files, selectedFileIndex, navigateFiles, selectFile, setFiles } =
    useVideoFileSelection();

  return (
    <MediaFilesStateContext
      value={{
        selectedFileIndex,
        files,
      }}
    >
      <MediaFileActionsContext
        value={{
          setFiles,
          selectFile,
          navigateFiles,
        }}
      >
        {children}
      </MediaFileActionsContext>
    </MediaFilesStateContext>
  );
}
