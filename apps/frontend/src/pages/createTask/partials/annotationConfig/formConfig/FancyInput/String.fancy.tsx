import type { InputProps } from 'antd';
import { Input } from 'antd';
import type { TextAreaProps } from 'antd/es/input';

export interface FancyStringProps extends InputProps {
  alias?: 'input' | 'textarea';
}

export function FancyString({ alias = 'input', ...props }: FancyStringProps) {
  if (alias === 'input') {
    return <Input {...props} />;
  }

  return <Input.TextArea {...(props as TextAreaProps)} />;
}
