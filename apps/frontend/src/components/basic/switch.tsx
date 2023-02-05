import type { FC } from 'react';
import { Switch } from 'antd';

const BaseSwitch: FC = (props) => {
  // @ts-ignore
  return <Switch {...props} />;
};

// @ts-ignore
const MySwitch = Object.assign(Switch, BaseSwitch);

export default MySwitch;
