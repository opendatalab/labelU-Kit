import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  LoadingOutlined,
} from '@ant-design/icons';
import { useMemo } from 'react';

import IconText from './IconText';

export type StatusType = 'success' | 'error' | 'warning' | 'waiting' | 'processing' | 'completed' | 'failed';

export interface StatusProps {
  type: StatusType;
  className?: string;
  tooltip?: string;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  color?: string;
  children: React.ReactNode;
}

const typeColorMapping = {
  success: 'var(--success-color)',
  error: 'var(--error-color)',
  warning: 'var(--warning-color)',
  waiting: 'var(--warning-color)',
  processing: 'var(--primary-color)',
  completed: 'var(--success-color)',
  failed: 'var(--error-color)',
  fail: 'var(--error-color)',
};

const typeIconMapping = {
  success: <CheckCircleFilled />,
  error: <CloseCircleFilled />,
  warning: <ExclamationCircleFilled />,
  waiting: <ClockCircleFilled />,
  processing: <LoadingOutlined />,
  completed: <CheckCircleFilled />,
  failed: <CloseCircleFilled />,
  fail: <CloseCircleFilled />,
};

export default function Status({
  type = 'processing',
  icon = typeIconMapping[type],
  className,
  children,
  ...restProps
}: StatusProps) {
  const color = restProps.color ?? typeColorMapping[type];
  const style = useMemo(() => ({ color, '--status-color': color, ...restProps.style }), [color, restProps.style]);

  return (
    <IconText className={className} icon={icon} style={style}>
      {children}
    </IconText>
  );
}
