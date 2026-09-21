import clsx from 'clsx';
import classes from './MagnetForm.module.scss';
import { Icon } from '@/components/DesignSystem/Icon';

type Props = React.PropsWithChildren<{
  magnetURI: string;
  onMagnetURIChange: (magnetURI: string) => void;
  onSubmit: (ev: React.SubmitEvent) => void;
}>;

export function MagnetForm({
  magnetURI,
  onMagnetURIChange,
  onSubmit,
  children,
}: Props) {
  return (
    <form
      className={clsx(classes.controlForm, 't-body-lg')}
      onSubmit={onSubmit}
    >
      <input
        name="magnetURI"
        value={magnetURI}
        placeholder="Magnet URI"
        onChange={(ev) => onMagnetURIChange(ev.target.value)}
        autoFocus
      />
      {children}
      <button className="btn btn--lg btn--primary">
        <Icon as="span" icon="play_arrow" size="xl" variant="fill" />
      </button>
    </form>
  );
}
