import { cTool } from '@label-u/annotation';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { store } from '@/index';
import ImgAttribute from '@/store/imgAttribute/actionCreators';
import type { ImgAttributeState } from '@/store/imgAttribute/types';

import rotateSvg from '../../../../assets/annotation/common/icon_r.svg';
import rotateHighlightSvg from '../../../../assets/annotation/common/icon_rA.svg';
import { prefix } from '../../../../constant';
import { EToolName } from '../../../../data/enums/ToolType';
import type { AppState } from '../../../../store';
// import { ChangeSave } from '@/store/annotation/actionCreators';
import type { IStepInfo } from '../../../../types/step';

const { EVideoToolName } = cTool;

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
  const { stepInfo } = props;
  // const dispatch = useDispatch();
  const {
    annotation: { toolInstance },
  } = useSelector((state: AppState) => ({
    annotation: state.annotation,
    imgAttribute: state.imgAttribute,
  }));
  const { t } = useTranslation();

  const isTagTool = [EToolName.Tag, EVideoToolName.VideoTagTool].includes(stepInfo?.tool as any);
  const isVideo = [EVideoToolName.VideoTagTool].includes(stepInfo?.tool as any);

  const isBegin = props.isBegin || isTagTool;

  const updateRotate = () => {
    /**
     * 1. 非第一步无法旋转
     * 2. 单步骤不存在 dataSourceStep
     */
    if (stepInfo.dataSourceStep !== 0 && stepInfo.dataSourceStep !== undefined) {
      return;
    }

    toolInstance?.updateRotate();
  };

  const commonOptionList: any = [
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
  return (
    <div className={`${prefix}-footer__option`}>
      {commonOptionList.map((info: any) => {
        return (
          info.show && (
            <div
              key={info.toolName}
              className="oneOption"
              onMouseEnter={(e) => {
                setToolHover(info.toolName);
                e.stopPropagation();
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                setToolHover('');
              }}
            >
              <a className="item" onClick={info.click}>
                <img
                  className="singleTool"
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
