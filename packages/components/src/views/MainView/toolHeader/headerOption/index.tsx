import React, { useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cTool } from '@label-u/annotation';
import { Popover } from 'antd';
import { useHotkeys } from 'react-hotkeys-hook';

import revocationSvg from '@/assets/annotation/common/icon_next.svg';
import restoreSvg from '@/assets/annotation/common/icon_back.svg';
import revocationHighlightSvg from '@/assets/annotation/common/icon_nextA.svg';
import restoreHighlightSvg from '@/assets/annotation/common/icon_backA.svg';
import { prefix } from '@/constant';
import { EToolName } from '@/data/enums/ToolType';
import ViewContext from '@/view.context';

const { EVideoToolName } = cTool;

import './index.scss';

enum EColor {
  Hover = '#666fff',
  Normal = '#cccccc',
}

const HeaderOption = () => {
  const { currentToolName, redo, undo } = useContext(ViewContext);
  const [toolHover, setToolHover] = useState('');
  const undoRef = useRef<HTMLElement>();
  const redoRef = useRef<HTMLElement>();

  const { t } = useTranslation();

  const isTagTool = [EToolName.Tag, EVideoToolName].includes(currentToolName as any);

  const isBegin = isTagTool;

  useHotkeys('ctrl+z, meta+z', undo, []);
  useHotkeys('ctrl+shift+z, meta+shift+z', redo, []);

  const commonOptionList: any = [
    {
      toolName: 'revocation',
      show: true,
      commonSvg: restoreSvg,
      selectedSvg: restoreHighlightSvg,
      click: () => {
        if (isTagTool) {
          return;
        }
        undo();
      },
      style: {
        opacity: isBegin === true ? 0.4 : 1,
        fontSize: '12px',
        color: !isBegin && toolHover === 'restore' ? EColor.Hover : EColor.Normal,
      },
      ref: undoRef,
    },
    {
      toolName: 'restore',
      show: true,
      commonSvg: revocationSvg,
      selectedSvg: revocationHighlightSvg,
      click: () => {
        if (isTagTool) {
          return;
        }
        redo();
      },
      style: {
        opacity: isBegin === true ? 0.4 : 1,
        fontSize: '12px',
        color: !isBegin && toolHover === 'revocation' ? EColor.Hover : EColor.Normal,
      },
      ref: redoRef,
    },
  ];
  return (
    <div className={`${prefix}-header__hotKey`}>
      {commonOptionList.map((info: any) => {
        return (
          info.show && (
            <Popover key={info.toolName} content={t(info.toolName)} trigger="hover">
              <div
                className="item"
                onMouseEnter={() => setToolHover(info.toolName)}
                onMouseLeave={() => setToolHover('')}
              >
                <a ref={info.ref} className="item" onClick={info.click}>
                  <img
                    className="singleTool"
                    src={toolHover === info.toolName ? info.selectedSvg : info.commonSvg}
                    style={info.style}
                  />
                  <div style={info.style}>{t(info.title)}</div>
                </a>
              </div>
            </Popover>
          )
        );
      })}
    </div>
  );
};

export default HeaderOption;
