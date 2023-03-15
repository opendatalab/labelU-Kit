import type { SelectProps } from 'antd';
import { Select } from 'antd';

export type FancyEnumProps = SelectProps;

export function FancyEnum(props: FancyEnumProps) {
  return <Select {...props} />;
}
