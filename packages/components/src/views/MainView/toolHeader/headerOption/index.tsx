import React, { useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cTool } from '@label-u/annotation';
import { Popover } from 'antd';
import { cloneDeep } from 'lodash-es';
import { useHotkeys } from 'react-hotkeys-hook';

import revocationSvg from '@/assets/annotation/common/icon_next.svg';
import restoreSvg from '@/assets/annotation/common/icon_back.svg';
import revocationHighlightSvg from '@/assets/annotation/common/icon_nextA.svg';
import restoreHighlightSvg from '@/assets/annotation/common/icon_backA.svg';
import { labelTool, prefix } from '@/constant';
import { EToolName } from '@/data/enums/ToolType';
import ViewContext from '@/view.context';

const { EVideoToolName } = cTool;

import './index.scss';

enum EColor {
  Hover = '#666fff',
  Normal = '#cccccc',
}

const HeaderOption = () => {
  const { currentToolName, sample, result, setResult, syncResultToEngine } = useContext(ViewContext);
  const [toolHover, setToolHover] = useState('');
  const [historyRevocation, setHistoryRevocation] = useState<any>([]);
  const undoRef = useRef<HTMLElement>();
  const redoRef = useRef<HTMLElement>();

  const { t } = useTranslation();

  const isTagTool = [EToolName.Tag, EVideoToolName.VideoTagTool].includes(currentToolName as any);

  const isBegin = isTagTool;

  // 统一处理撤回
  const restore = () => {
    if (!sample) {
      return;
    }
    let count = 0;
    const newResult = cloneDeep(result);

    for (const tool of labelTool) {
      if (result[tool]?.result) {
        count += result[tool]?.result.length;
      }
    }
    for (const tool of labelTool) {
      const tmpResult = newResult[tool]?.result;
      if (tmpResult && tmpResult.length > 0) {
        const newTmpResult = tmpResult.reduce((res, item) => {
          if (item.order !== count) {
            res.push(item);
          } else {
            historyRevocation.push({ ...item, toolName: tool });
            setHistoryRevocation(historyRevocation);
          }
          return res;
        }, [] as any[]);

        newResult[tool].result = newTmpResult;
      }
    }

    setResult(newResult);
    setTimeout(syncResultToEngine);
  };

  // 统一处理重做
  const revocation = () => {
    const newResult = cloneDeep(result);

    const lastRestore = historyRevocation.pop();
    if (!lastRestore) {
      setHistoryRevocation([]);
      return;
    }
    // 获取最大序号
    let maxOrder = 0;
    for (const tool of labelTool) {
      const tmpResult = newResult[tool]?.result;
      if (tmpResult && tmpResult.length > 0) {
        maxOrder += tmpResult.length;
      }
    }
    lastRestore.order = maxOrder + 1;
    for (const tool of labelTool) {
      let tmpResult = newResult[tool]?.result;

      if (lastRestore.toolName === tool) {
        delete lastRestore.toolName;
        if (tmpResult && tmpResult.length > 0) {
          tmpResult = [...tmpResult, lastRestore];
        } else {
          tmpResult = [lastRestore];
        }
        newResult[tool].result = tmpResult;
      }
    }

    setResult(newResult);
    setTimeout(syncResultToEngine);
  };

  useHotkeys(
    'ctrl+z, meta+z',
    () => {
      undoRef.current?.click();
    },
    [],
  );
  useHotkeys(
    'ctrl+shift+z, meta+shift+z',
    () => {
      redoRef.current?.click();
    },
    [],
  );

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
        restore();
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
        revocation();
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
