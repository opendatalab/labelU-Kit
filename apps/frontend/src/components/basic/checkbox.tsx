import type { FC } from 'react';
import { Checkbox } from 'antd';
import type { CheckboxProps } from 'antd/lib/checkbox';

type MyButtonProps = CheckboxProps;

const BaseCheckBox: FC<MyButtonProps> = (props) => {
  return <Checkbox {...props} />;
};

const MyCheckBox = Object.assign(Checkbox, BaseCheckBox);

export default MyCheckBox;
