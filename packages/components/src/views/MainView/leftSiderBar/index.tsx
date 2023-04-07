import React, { useContext, useLayoutEffect, useRef, useState } from 'react';

import CollapseIcon from '@/assets/cssIcon/collapse.svg';
import SpreadIcon from '@/assets/cssIcon/spread.svg';
import ViewContext from '@/view.context';

import { prefix } from '../../../constant';
import type { IFileItem } from '../../../types/data';
const layoutCls = `${prefix}-layout`;

interface LeftSiderProps {
  path: string;
  loading: boolean;
  imgList: IFileItem[];
  currentToolName: string;
  imgIndex: string;
  leftSiderContent?: React.ReactNode | React.ReactNode;
  style?: React.CSSProperties;
}

const LeftSider: React.FC<LeftSiderProps> = (props) => {
  const { style = {} } = props;
  const { leftSiderContent } = useContext(ViewContext);

  const [collapsed, toggleCollapse] = useState<boolean>(false);
  const sliderBoxRef = useRef<HTMLDivElement | null>(null);

  // 将左侧属性栏高度设置为剩余高度
  useLayoutEffect(() => {
    if (!sliderBoxRef.current) {
      return;
    }

    const rect = sliderBoxRef.current.getBoundingClientRect();
    const attributeWrapperHeight = window.innerHeight - rect.top;
    sliderBoxRef.current.style.height = `${attributeWrapperHeight}px`;
  }, []);

  if (!leftSiderContent) {
    return <div />;
  }

  return (
    <div className="sliderBox" id="sliderBoxId" style={style} ref={sliderBoxRef}>
      <div className={collapsed ? `${layoutCls}__left_sider_hide` : `${layoutCls}__left_sider`}>{leftSiderContent}</div>

      <img
        className="itemOpIcon"
        src={collapsed ? SpreadIcon : CollapseIcon}
        onClick={(e) => {
          toggleCollapse(!collapsed);
          e.stopPropagation();
        }}
      />
    </div>
  );
};

export default LeftSider;
