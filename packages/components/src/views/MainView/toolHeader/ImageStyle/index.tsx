import type { FC } from 'react';
import { useMemo } from 'react';
import { Popover } from 'antd/es';

import { prefix } from '@/constant';

import ToolStyle from './ToolStyle';

const ImageStyle: FC = () => {
  const toolStyle = useMemo(() => <ToolStyle />, []);

  const content = useMemo(
    () => (
      <div className={`${prefix}-sidebar`} style={{ overflow: 'clip' }}>
        {toolStyle}
      </div>
    ),
    [toolStyle],
  );

  return (
    <Popover placement="topLeft" content={content} overlayClassName="tool-hotkeys-popover">
      <div className="item">工具样式</div>
    </Popover>
  );
};

export default ImageStyle;
