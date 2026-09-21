import clsx from 'clsx';
import classes from './SourceForm.module.scss';
import { Icon } from '@/components/DesignSystem/Icon';

type Props = React.PropsWithChildren<{
  sourceURI: string;
  onSourceURIChange: (sourceURI: string) => void;
  onSubmit: (ev: React.SubmitEvent) => void;
}>;

export function SourceForm({
  sourceURI,
  onSourceURIChange,
  onSubmit,
  children,
}: Props) {
  return (
    <form
      className={clsx(classes.controlForm, 't-body-lg')}
      onSubmit={onSubmit}
    >
      <input
        name="sourceURI"
        value={sourceURI}
        placeholder="Source URI"
        onChange={(ev) => onSourceURIChange(ev.target.value)}
        autoFocus
      />
      {children}
      <button className="btn btn--lg btn--primary">
        <Icon as="span" icon="play_arrow" size="xl" variant="fill" />
      </button>
    </form>
  );
}
