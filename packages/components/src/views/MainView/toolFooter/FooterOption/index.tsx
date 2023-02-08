import React, { useContext, useState } from 'react';
import { useSelector } from '@/store/ctx';
import { AppState } from '../../../../store';
import rotateSvg from '../../../../assets/annotation/common/icon_r.svg';

import rotateHighlightSvg from '../../../../assets/annotation/common/icon_rA.svg';
import topViewSvg from '../../../../assets/annotation/common/icon_topv.svg';

import { prefix } from '../../../../constant';
import { EToolName } from '../../../../data/enums/ToolType';
// import { ChangeSave } from '@/store/annotation/actionCreators';
import { IStepInfo } from '../../../../types/step';
import { useTranslation } from 'react-i18next';
import { cTool } from '@label-u/annotation';
import { store } from '@/index';
const { EVideoToolName } = cTool;
import ImgAttribute from '@/store/imgAttribute/actionCreators';
import { ImgAttributeState } from '@/store/imgAttribute/types';
import { PointCloudContext } from '@/components/pointCloudView/PointCloudContext';

interface IProps {
  isBegin?: boolean;
  stepInfo: IStepInfo;
}

enum EColor {
  Hover = '#1B67FF',
  Normal = 'rgba(0, 0, 0, 0.72)',
}

const FooterOption: React.FC<IProps> = (props) => {
  const [toolHover, setToolHover] = useState('');
  // const dispatch = useDispatch();
  const {
    annotation: { toolInstance, currentToolName },
  } = useSelector((state: AppState) => ({
    annotation: state.annotation,
    imgAttribute: state.imgAttribute,
  }));
  const { t } = useTranslation();

  console.log(currentToolName);
  const isTagTool = [EToolName.Tag, EVideoToolName.VideoTagTool].includes(currentToolName);
  const isVideo = [EVideoToolName.VideoTagTool].includes(currentToolName);
  const isPcTool = [EToolName.PointCloud].includes(currentToolName);
  const ptCtx = useContext(PointCloudContext);

  const isBegin = props.isBegin || isTagTool;

  const updateRotate = () => {
    toolInstance?.updateRotate();
  };

  const imgOptionList: any = [
    {
      toolName: 'OriginalScaleSet',
      title: 'OriginalScaleSet',
      show: true,
      selectedSvg: '',
      commonSvg: '',
      click: () => {
        if (isVideo) {
          // VideoTool don't need to rotate
          return;
        }
        const payload = { isOriginalSize: true };
        store.dispatch(ImgAttribute.UpdateImgAttribute(payload as ImgAttributeState));
      },
      style: {
        marginRight: '4px',
        opacity: isVideo === true ? 0.4 : 1,
        fontSize: '14px',
        color: !isBegin && toolHover === 'OriginalScaleSet' ? EColor.Hover : EColor.Normal,
      },
    },
    {
      toolName: 'rotate',
      title: 'Rotate',
      show: true,
      selectedSvg: rotateHighlightSvg,
      commonSvg: rotateSvg,
      click: () => {
        if (isVideo) {
          // VideoTool don't need to rotate
          return;
        }
        updateRotate();
      },
      style: {
        marginRight: '4px',
        opacity: isVideo === true ? 0.4 : 1,
        fontSize: '14px',
        color: !isBegin && toolHover === 'rotate' ? EColor.Hover : EColor.Normal,
      },
    },
  ];

  const pcOptionList = [
    {
      toolName: 'TopLook',
      title: 'TopLook',
      show: true,
      selectedSvg: topViewSvg,
      commonSvg: topViewSvg,
      click: () => {
        ptCtx?.mainViewInstance.resetCamera();
      },
      style: {
        marginRight: '4px',
        opacity: isVideo === true ? 0.4 : 1,
        fontSize: '14px',
        color: !isBegin && toolHover === 'OriginalScaleSet' ? EColor.Hover : EColor.Normal,
      },
    },
  ];

  const commonOptionList = isPcTool ? pcOptionList : imgOptionList;

  return (
    <div className={`${prefix}-footer__option`}>
      {commonOptionList.map((info: any) => {
        return (
          info.show && (
            <div
              key={info.toolName}
              className='oneOption'
              onMouseEnter={(e) => {
                setToolHover(info.toolName);
                e.stopPropagation();
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                setToolHover('');
              }}
            >
              <a className='item' onClick={info.click}>
                <img
                  className='singleTool'
                  src={toolHover === info.toolName ? info.selectedSvg : info.commonSvg}
                  style={{ ...info.style, width: 16 }}
                />
                <div style={info.style}>{t(info.title)}</div>
              </a>
            </div>
          )
        );
      })}
    </div>
  );
};

export default FooterOption;
