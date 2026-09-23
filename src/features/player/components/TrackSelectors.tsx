import { GiB } from '@/constants/filesize';
import { Row } from '@/components/DesignSystem/Layout';
import { usePlayerActions, usePlayerState } from '../context/PlayerContext';
import { addKeys } from '@/utils/list';
import {
  useMediaFileActions,
  useMediaFiles,
} from '../context/MediaFilesContext';

export function TrackSelectors() {
  const { audioTracks, selectedAudioTrackIndex } = usePlayerState();
  const { selectAudioTrack, focusPlayer } = usePlayerActions();

  const { files, selectedFileIndex } = useMediaFiles();
  const { selectFile } = useMediaFileActions();

  const onAudioTrackIndexChanged = (
    ev: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    selectAudioTrack(+ev.target.value, true);
    focusPlayer();
  };

  const onFileIndexChanged = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    selectFile(+ev.target.value);
    focusPlayer();
  };

  const tracksWithKeys = addKeys(
    audioTracks,
    (track) => `${track.id ?? track.language}-${track.label}`,
  );

  return (
    <Row spacing={2} equal>
      <select
        name="fileIndex"
        value={selectedFileIndex}
        onChange={onFileIndexChanged}
      >
        <option hidden>Select File</option>
        {files.map((file, index) => (
          <option key={file.index} value={index}>
            {file.name} - {(file.length / GiB).toFixed(1)} GiB
          </option>
        ))}
      </select>

      <select
        name="audioTrackIndex"
        value={selectedAudioTrackIndex}
        onChange={onAudioTrackIndexChanged}
      >
        <option hidden>Select Audio Track</option>
        {tracksWithKeys.map((audioTrack, index) => (
          <option key={audioTrack.key} value={index}>
            {audioTrack.label} - {audioTrack.language}
          </option>
        ))}
      </select>
    </Row>
  );
}
