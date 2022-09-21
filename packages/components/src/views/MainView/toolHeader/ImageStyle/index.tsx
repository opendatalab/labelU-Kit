import React, { FC } from 'react';
import { Popover } from 'antd/es';
import ToolStyle from './ToolStyle';
import { prefix } from '@/constant';

const ImageStyle: FC = () => {
  const toolStyle = <ToolStyle />;

  
  const content = (
    <div className={`${prefix}-sidebar`}>
      {toolStyle}

    </div>
  );
  return (
    <Popover
      placement='topLeft'
      content={content}
      // visible={visible}
      // @ts-ignore
      // onMouseMove={() => setFlag(true)}
      // onMouseLeave={() => {
      //   setFlag(false);
      // }}
      overlayClassName='tool-hotkeys-popover'
      // visible={svgFlag}
    >
      <div
        className='item'
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
