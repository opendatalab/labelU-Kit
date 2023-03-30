import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ImgAttributeState } from '@/store/imgAttribute/types';
import ViewContext from '@/view.context';

import rotateSvg from '../../../../assets/annotation/common/icon_r.svg';
import rotateHighlightSvg from '../../../../assets/annotation/common/icon_rA.svg';
import { prefix } from '../../../../constant';

enum EColor {
  Hover = '#1B67FF',
  Normal = 'rgba(0, 0, 0, 0.72)',
}

const FooterOption = () => {
  const [toolHover, setToolHover] = useState('');
  const { setImageAttribute, annotationEngine } = useContext(ViewContext);
  const { t } = useTranslation();
  // TODO
  const isBegin = false;

  const updateRotate = () => {
    annotationEngine?.toolInstance?.updateRotate();
  };

  const commonOptionList: any = [
    {
      toolName: 'OriginalScaleSet',
      title: 'OriginalScaleSet',
      show: true,
      selectedSvg: '',
      commonSvg: '',
      click: () => {
        const payload = { isOriginalSize: true };
        setImageAttribute(payload as ImgAttributeState);
      },
      style: {
        marginRight: '4px',
        opacity: 1,
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
        updateRotate();
      },
      style: {
        marginRight: '4px',
        opacity: 1,
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
