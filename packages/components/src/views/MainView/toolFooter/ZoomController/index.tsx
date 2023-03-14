import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import React from 'react';
import { connect } from 'react-redux';

import adaptIcon from '@/assets/annotation/common/icon_adapt.svg';
import adaptIconBlack from '@/assets/annotation/common/icon_adapt_black.svg';
import type { AppState } from '@/store';
import type { ToolInstance } from '@/store/annotation/types';

import { footerCls } from '../index';
import ZoomLevel from './ZoomLevel';

interface IProps {
  toolInstance: ToolInstance;
  mode?: 'light' | 'dark';
}

const ZoomController: React.FC<IProps> = ({ toolInstance, mode }) => {
  const initialPosition = () => {
    toolInstance.initImgPos();
  };

  let defaultIcon = adaptIcon;

  if (mode === 'light') {
    defaultIcon = adaptIconBlack;
  }

  return (
    <div>
      <span className={`${footerCls}__zoomController`}>
        <MinusOutlined
          className={`${footerCls}__highlight`}
          onClick={() => {
            toolInstance.zoomChanged(false);
          }}
        />
        <span className={`${footerCls}__zoomText`} onClick={initialPosition}>
          <img src={defaultIcon} className="adaptIcon" />
          <ZoomLevel />
        </span>
        <PlusOutlined
          className={`${footerCls}__highlight`}
          onClick={() => {
            toolInstance.zoomChanged(true);
          }}
        />
      </span>
    </div>
  );
};

const mapStateToProps = (state: AppState) => ({
  toolInstance: state.annotation.toolInstance,
});

export default connect(mapStateToProps)(ZoomController);
