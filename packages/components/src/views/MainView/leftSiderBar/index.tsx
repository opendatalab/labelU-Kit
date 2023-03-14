import classnames from 'classnames';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { connect, useDispatch } from 'react-redux';

import CollapseIcon from '@/assets/cssIcon/collapse.svg';
import SpreadIcon from '@/assets/cssIcon/spread.svg';
import { PageJump } from '@/store/annotation/actionCreators';

// import { updateCollapseStatus } from '../../../store/toolStyle/actionCreators';

import { prefix } from '../../../constant';
import type { AppState } from '../../../store';
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
  const { imgList, imgIndex, leftSiderContent, style = {} } = props;

  const [imgListCollapse, setImgListCollapse] = useState<boolean>(false);
  const sliderBoxRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useDispatch();
  const pageJump = (page: number) => {
    dispatch(PageJump(page));
  };

  // 将左侧属性栏高度设置为剩余高度
  useLayoutEffect(() => {
    if (!sliderBoxRef.current) {
      return;
    }

    const rect = sliderBoxRef.current.getBoundingClientRect();
    const attributeWrapperHeight = window.innerHeight - rect.top;
    sliderBoxRef.current.style.height = `${attributeWrapperHeight}px`;
  }, []);

  if (imgList.length === 1 && !leftSiderContent) {
    return <div />;
  }

  return (
    <div className="sliderBox" id="sliderBoxId" style={style} ref={sliderBoxRef}>
      <div className={imgListCollapse ? `${layoutCls}__left_sider_hide` : `${layoutCls}__left_sider`}>
        {leftSiderContent
          ? leftSiderContent
          : imgList.map((item, index) => {
              return (
                <div key={item.id} className="item">
                  <div
                    className={classnames({ imgItem: true, chooseImg: index === Number(imgIndex) })}
                    onClick={async (e) => {
                      e.stopPropagation();
                      pageJump(index);
                    }}
                  >
                    <img
                      className={classnames({
                        leftSiderImg: true,
                      })}
                      src={item.url}
                    />
                  </div>
                  <span
                    className={classnames({
                      chooseNumber: index === Number(imgIndex),
                      pageNumber: true,
                    })}
                  >
                    {index + 1}
                  </span>
                </div>
              );
            })}
      </div>

      <img
        className="itemOpIcon"
        src={imgListCollapse ? SpreadIcon : CollapseIcon}
        onClick={(e) => {
          setImgListCollapse(!imgListCollapse);
          e.stopPropagation();
        }}
      />
    </div>
  );
};

const mapStateToProps = ({ annotation }: AppState) => {
  const { imgList, imgIndex } = annotation;
  return {
    imgList,
    imgIndex,
  };
};

export default connect(mapStateToProps)(LeftSider);
