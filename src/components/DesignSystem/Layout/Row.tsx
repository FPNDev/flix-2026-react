import React from 'react';
import { Group, type GroupProps } from './Group';

type Props<T extends React.ElementType> = Omit<GroupProps<T>, 'variant'>;

export function Row<T extends React.ElementType = 'div'>({
  as,
  ...props
}: Props<T>) {
  return React.createElement(Group, {
    as,
    variant: 'row',
    ...props,
  });
}
