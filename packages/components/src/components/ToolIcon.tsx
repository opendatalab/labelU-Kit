import Icon from '@ant-design/icons';
import React from 'react';
import { isEqual } from 'lodash-es';

interface ToolIconProps {
  style: React.CSSProperties;
  className?: string;
  icon: any;
}

const MemoToolIcon = React.memo(
  function ToolIcon({ style, icon, className }: ToolIconProps) {
    return <Icon className={className} component={icon} style={style} />;
  },
  (props, nextProps) => {
    return isEqual(props.style, nextProps.style) && props.className === nextProps.className;
  },
);

export default MemoToolIcon;
