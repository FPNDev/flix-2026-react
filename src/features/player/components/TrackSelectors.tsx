import type shaka from 'shaka-player';
import { GiB } from '@/constants/filesize';
import { Row } from '@/components/DesignSystem/Layout';
import type { MediaFile } from '@/types/media';

type Props = {
  files: MediaFile[];
  selectedFileIndex: number;
  onFileIndexChange: (ev: React.ChangeEvent<HTMLSelectElement>) => void;
  audioTracks: (shaka.extern.AudioTrack & { key: string })[];
  selectedAudioTrackIndex: number;
  onAudioTrackIndexChange: (ev: React.ChangeEvent<HTMLSelectElement>) => void;
};

export function TrackSelectors({
  files,
  selectedFileIndex,
  onFileIndexChange,
  audioTracks,
  selectedAudioTrackIndex,
  onAudioTrackIndexChange,
}: Props) {
  return (
    <Row spacing={2} equal>
      <select
        name="fileIndex"
        value={selectedFileIndex}
        onChange={onFileIndexChange}
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
        onChange={onAudioTrackIndexChange}
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
