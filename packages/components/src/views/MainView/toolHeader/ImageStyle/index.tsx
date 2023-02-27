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
    <Popover
      placement="topLeft"
      content={content}
      // visible={visible}
      // @ts-ignore
      // onMouseMove={() => setFlag(true)}
      // onMouseLeave={() => {
      //   setFlag(false);
      // }}
      overlayClassName="tool-hotkeys-popover"
      // visible={svgFlag}
    >
      <div
        className="item"
        //   onMouseMove={() => setFlag(true)}
        //   onMouseLeave={() => setFlag(false)}
        //   style={containerStyle}
      >
        工具样式
      </div>
    </Popover>
  );
};

export default ImageStyle;
