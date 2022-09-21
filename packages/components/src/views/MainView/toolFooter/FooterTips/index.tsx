import React, { FC, useState } from 'react';
import { Popover } from 'antd/es';
import ImgAttributeInfo from '../../sidebar/ImgAttributeInfo';
import { prefix } from '@/constant';
import ImageAdjust from '../../../../assets/annotation/common/image_adjust.svg';
import ImageAdjustA from '../../../../assets/annotation/common/image_adjustA.svg';

const FooterTips: FC = () => {
  const [toolHover, setToolHover] = useState('');
  const imageAttributeInfo = <ImgAttributeInfo />;

  const content = <div className={`${prefix}-sidebar`}>{imageAttributeInfo}</div>;
  return (
    <Popover placement='topLeft' content={content} overlayClassName='tool-hotkeys-popover'>
      <div
        onMouseEnter={(e) => {
          setToolHover('imageAdjst');
        }}
        onMouseLeave={(e) => {
          setToolHover('');
        }}
        className='imgTipsBar'
      >
        <img src={toolHover === 'imageAdjst' ? ImageAdjustA : ImageAdjust} />
        图片调整
      </div>
    </Popover>
  );
};

export default FooterTips;
