import { Popover } from 'antd/es';
import type { FC } from 'react';
import { useState } from 'react';

import { prefix } from '@/constant';

import ImageAdjust from '../../../../assets/annotation/common/image_adjust.svg';
import ImageAdjustA from '../../../../assets/annotation/common/image_adjustA.svg';
import ImgAttributeInfo from '../../sidebar/ImgAttributeInfo';

const FooterTips: FC = () => {
  const [toolHover, setToolHover] = useState('');
  const imageAttributeInfo = <ImgAttributeInfo />;

  const content = <div className={`${prefix}-sidebar`}>{imageAttributeInfo}</div>;
  return (
    <Popover placement="topLeft" content={content} overlayClassName="tool-hotkeys-popover">
      <div
        onMouseEnter={() => {
          setToolHover('imageAdjst');
        }}
        onMouseLeave={() => {
          setToolHover('');
        }}
        className="imgTipsBar"
      >
        <img style={{ width: 16 }} src={toolHover === 'imageAdjst' ? ImageAdjustA : ImageAdjust} />
        图片调整
      </div>
    </Popover>
  );
};

export default FooterTips;
