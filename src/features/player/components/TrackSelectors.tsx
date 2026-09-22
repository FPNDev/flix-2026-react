import { GiB } from '@/constants/filesize';
import { Row } from '@/components/DesignSystem/Layout';
import { usePlayerActions, usePlayerState } from '../context/PlayerContext';

export function TrackSelectors() {
  const { files, selectedFileIndex, audioTracks, selectedAudioTrackIndex } =
    usePlayerState();

  const { selectAudioTrack, selectFile, focusPlayer } = usePlayerActions();

  const onAudioTrackIndexChanged = (
    ev: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    selectAudioTrack(+ev.target.value);
    focusPlayer();
  };

  const onFileIndexChanged = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    selectFile(+ev.target.value);
    focusPlayer();
  };

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
        {audioTracks.map((audioTrack, index) => (
          <option key={audioTrack.key} value={index}>
            {audioTrack.label} - {audioTrack.language}
          </option>
        ))}
      </select>
    </Row>
  );
}
