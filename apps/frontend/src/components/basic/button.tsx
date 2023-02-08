import type { FC } from 'react';
import { Button } from 'antd';
import type { ButtonProps } from 'antd/lib/button';

type MyButtonProps = ButtonProps;

const BaseButton: FC<MyButtonProps> = (props) => {
  return <Button {...props} />;
};

const MyButton = Object.assign(Button, BaseButton);

export default MyButton;
