import type { FC } from 'react';
import { Switch } from 'antd';

const BaseSwitch: FC = (props) => {
  // @ts-ignore
  return <Switch {...props} />;
};

const MySwitch = Object.assign(Switch, BaseSwitch);

export default MySwitch;
