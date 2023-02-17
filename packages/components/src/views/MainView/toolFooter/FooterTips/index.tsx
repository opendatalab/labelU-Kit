import React, { FC, useState } from 'react';
import { Popover } from 'antd/es';
import ImgStyleSet from './ImgStyleSet';
import PcSet from './PcSet';
import { prefix } from '@/constant';
import ImageAdjust from '../../../../assets/annotation/common/image_adjust.svg';
import ImageAdjustA from '../../../../assets/annotation/common/image_adjustA.svg';
import { AppState } from '@/store';
import { connect } from 'react-redux';
import { LabelUContext } from '@/store/ctx';
import { ImageLabelTool } from '@label-u/annotation';

interface Iprops {
  currentToolName: string;
}

const FooterTips: FC<Iprops> = ({ currentToolName }) => {
  const [toolHover, setToolHover] = useState('');
  const imageStyleSet = <ImgStyleSet />;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const isPcTool = currentToolName === 'pointCloudTool';
  const isImgLabelTool = (ImageLabelTool as string[]).indexOf(currentToolName) >= 0;
  let content = <div />;
  let textInContent = '';

  const updatePopoverStatus = () => {
    setPopoverOpen(!popoverOpen);
  };

  if (isPcTool) {
    content = (
      <div className={`${prefix}-sidebar`}>
        <PcSet updatePopoverStatus={updatePopoverStatus} />
      </div>
    );
    textInContent = '点云设置';
  }

  if (isImgLabelTool) {
    content = <div className={`${prefix}-sidebar`}>{imageStyleSet}</div>;
    textInContent = '图片调整';
  }

  return (
    <Popover
      placement='topLeft'
      overlayInnerStyle={{
        padding: '12px 8px',
      }}
      open={popoverOpen}
      onOpenChange={updatePopoverStatus}
      content={content}
      overlayClassName='tool-hotkeys-popover'
    >
      <div
        onMouseEnter={(e) => {
          setToolHover('imageAdjst');
        }}
        onMouseLeave={(e) => {
          setToolHover('');
        }}
        className='imgTipsBar'
      >
        <img style={{ width: 16 }} src={toolHover === 'imageAdjst' ? ImageAdjustA : ImageAdjust} />
        <span onClick={updatePopoverStatus}>{textInContent}</span>
      </div>
    </Popover>
  );
};

const mapStateToProps = (state: AppState) => {
  return {
    currentToolName: state.annotation.currentToolName,
  };
};

export default connect(mapStateToProps, null, null, {
  context: LabelUContext,
})(FooterTips);
