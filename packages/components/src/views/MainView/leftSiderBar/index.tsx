import React from "react";
import CollapseIcon from '@/assets/cssIcon/collapse.svg';
import SpreadIcon from '@/assets/cssIcon/spread.svg';
import classnames from 'classnames';
import { PageJump } from '../../../store/annotation/actionCreators';
import { updateCollapseStatus } from '../../../store/toolStyle/actionCreators';
import { connect, useDispatch } from 'react-redux';
import { prefix } from '../../../constant';
import { IFileItem } from '../../../types/data';
import { AppState } from '../../../store';
import localforage from "localforage";
import { LabelBeeContext } from "@/store/ctx";
const layoutCls = `${prefix}-layout`;

interface LeftSiderProps {
    path: string;
    loading: boolean;
    imgList: IFileItem[];
    currentToolName: string;
    imgIndex: string;
    imgListCollapse: boolean;
}


const LeftSider: React.FC<LeftSiderProps> = (props) => {
    const { imgList, imgIndex, imgListCollapse } = props;
    const dispatch = useDispatch();
    const pageJump = (page: number) => {
      dispatch(PageJump(page));
    };

    if(imgList.length === 1){
      return <div />
    }
  
    return (
      <div className='sliderBox' id='sliderBoxId'>
        {imgList && imgList.length > 0 && (
          <div
            className={imgListCollapse ? `${layoutCls}__left_sider_hide` : `${layoutCls}__left_sider`}
          >
            {imgList.map((item, index) => {
              return (
                <div key={item.id} className='item'>
                  <div
                    className={classnames({ imgItem: true, chooseImg: index === Number(imgIndex) })}
                    onClick={async (e) => {

                      e.stopPropagation();
                      await localforage.removeItem('zoom')
                      await localforage.removeItem('coordinate')
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
        )}
        <img
          className='itemOpIcon'
          src={imgListCollapse ? SpreadIcon : CollapseIcon}
          onClick={(e) => {
            dispatch(updateCollapseStatus(!imgListCollapse));
            e.stopPropagation();
          }}
        />
      </div>
    );
  };
  
  const mapStateToProps = ({ annotation, toolStyle }: AppState) => {
    const { imgList, imgIndex } = annotation;
    const { imgListCollapse } = toolStyle;
    return {
      imgList,
      imgIndex,
      imgListCollapse,
    };
  };
  
  export default connect(mapStateToProps, null, null, { context: LabelBeeContext })(LeftSider);