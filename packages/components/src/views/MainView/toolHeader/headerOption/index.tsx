import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { PrevResult } from '@label-u/annotation';
import { cTool, EKeyCode } from '@label-u/annotation';
import { Popover } from 'antd';

import type { AppState } from '@/store';
// import rotateSvg from '@/assets/annotation/common/icon_r.svg';
import revocationSvg from '@/assets/annotation/common/icon_next.svg';
import restoreSvg from '@/assets/annotation/common/icon_back.svg';
// import rotateHighlightSvg from '@/assets/annotation/common/icon_rA.svg';
import revocationHighlightSvg from '@/assets/annotation/common/icon_nextA.svg';
import restoreHighlightSvg from '@/assets/annotation/common/icon_backA.svg';
// import saveSvg from '@/assets/annotation/common/icon_save.svg';
// import saveLightSvg from '@/assets/annotation/common/icon_saveA.svg';
import { prefix } from '@/constant';
import { EToolName } from '@/data/enums/ToolType';
// import { ChangeSave } from '@/store/annotation/actionCreators';
import type { IStepInfo } from '@/types/step';
import { UpdateImgList } from '@/store/annotation/actionCreators';

import { toolList } from '../ToolOperation';
const { EVideoToolName } = cTool;

import './index.scss';

interface IProps {
  isBegin?: boolean;
  stepInfo: IStepInfo;
}

enum EColor {
  Hover = '#666fff',
  Normal = '#cccccc',
}

export const labelTool = [EToolName.Rect, EToolName.Point, EToolName.Line, EToolName.Polygon];

const HeaderOption: React.FC<IProps> = (props) => {
  const [toolHover, setToolHover] = useState('');
  const [historyRevocation, setHistoryRevocation] = useState<any>([]);
  const { stepInfo } = props;
  const dispatch = useDispatch();
  const undoRef = useRef<HTMLElement>();
  const redoRef = useRef<HTMLElement>();

  const { t } = useTranslation();
  const {
    annotation: { toolInstance, imgList, imgIndex, currentToolName },
  } = useSelector((state: AppState) => ({
    annotation: state.annotation,
    imgAttribute: state.imgAttribute,
  }));

  const isTagTool = [EToolName.Tag, EVideoToolName.VideoTagTool].includes(stepInfo?.tool as any);
  // const isVideo = [EVideoToolName.VideoTagTool].includes(stepInfo?.tool as any);

  const isBegin = props.isBegin || isTagTool;

  // const updateRotate = () => {
  //   /**
  //    * 1. 非第一步无法旋转
  //    * 2. 单步骤不存在 dataSourceStep
  //    */
  //   if (stepInfo.dataSourceStep !== 0 && stepInfo.dataSourceStep !== undefined) {
  //     return;
  //   }

  //   toolInstance?.updateRotate();
  // };

  // 快捷键处理
  const keydownEvent = (e: KeyboardEvent) => {
    if (e.keyCode === EKeyCode.Alt) {
      e.preventDefault();
    }
    switch (e.keyCode) {
      case EKeyCode.Z:
        if (e.ctrlKey) {
          if (e.shiftKey) {
            redoRef.current?.click();
          } else {
            undoRef.current?.click();
          }

          return false;
        }
        break;
      default: {
        break;
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', keydownEvent);
    return () => {
      document.removeEventListener('keydown', keydownEvent);
    };
  }, []);

  // 更新pre 标注结果
  const updateCanvasView = (newLabelResult: any) => {
    const prevResult: PrevResult[] = [];
    for (const oneTool of toolList) {
      if (oneTool.toolName !== currentToolName && newLabelResult[oneTool.toolName]) {
        const onePrevResult = {
          toolName: oneTool.toolName,
          result: newLabelResult[oneTool.toolName].result,
        };
        prevResult.push(onePrevResult);
      }
      if (oneTool.toolName === currentToolName) {
        toolInstance.setResult(newLabelResult[oneTool.toolName].result);
      }
    }
    toolInstance.setPrevResultList(prevResult);
    toolInstance.render();
  };

  // 统一处理撤回
  const restore = () => {
    if (imgList && imgList.length > 0 && imgList.length > imgIndex) {
      let count = 0;
      const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
      for (const tool of labelTool) {
        if (oldImgResult[tool]?.result) {
          count += oldImgResult[tool]?.result.length;
        }
      }
      for (const tool of labelTool) {
        const tmpResult = oldImgResult[tool]?.result;
        if (tmpResult && tmpResult.length > 0) {
          const newTmpResult = tmpResult.reduce((res: any[], item: { order: number }) => {
            if (item.order !== count) {
              res.push(item);
            } else {
              historyRevocation.push({ ...item, toolName: tool });
              setHistoryRevocation(historyRevocation);
            }
            return res;
          }, [] as any[]);
          oldImgResult[tool].result = newTmpResult;
        }
      }
      imgList[imgIndex].result = JSON.stringify(oldImgResult);
      dispatch(UpdateImgList(imgList));
      updateCanvasView(oldImgResult);
    }
  };

  // 统一处理重做
  const revocation = () => {
    const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    const lastRestore = historyRevocation.pop();
    if (!lastRestore) {
      setHistoryRevocation([]);
      return;
    }
    // 获取最大序号
    let maxOrder = 0;
    for (const tool of labelTool) {
      const tmpResult = oldImgResult[tool]?.result;
      if (tmpResult && tmpResult.length > 0) {
        maxOrder += tmpResult.length;
      }
    }
    lastRestore.order = maxOrder + 1;
    for (const tool of labelTool) {
      let tmpResult = oldImgResult[tool]?.result;

      if (lastRestore.toolName === tool) {
        delete lastRestore.toolName;
        if (tmpResult && tmpResult.length > 0) {
          tmpResult = [...tmpResult, lastRestore];
        } else {
          tmpResult = [lastRestore];
        }
        oldImgResult[tool].result = tmpResult;
      }
    }
    imgList[imgIndex].result = JSON.stringify(oldImgResult);
    dispatch(UpdateImgList(imgList));
    updateCanvasView(oldImgResult);
  };

  const commonOptionList: any = [
    // {
    //   toolName: 'save',
    //   title: 'Save',
    //   show: !!onSave,
    //   commonSvg: saveSvg,
    //   selectedSvg: saveLightSvg,
    //   click: () => {
    //     dispatch(ChangeSave);
    //   },
    //   style: {
    //     fontSize: '12px',
    //     color: !isBegin && toolHover === 'save' ? EColor.Hover : EColor.Normal,
    //   },
    // },
    {
      toolName: 'revocation',
      // title: 'Redo',
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
      // title: 'Undo',
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

    // {
    //   toolName: 'rotate',
    //   title: 'Rotate',
    //   show: true,
    //   selectedSvg: rotateHighlightSvg,
    //   commonSvg: rotateSvg,
    //   click: () => {
    //     if (isVideo) {
    //       // VideoTool don't need to rotate
    //       return;
    //     }

    //     updateRotate();
    //   },
    //   style: {
    //     opacity: isVideo === true ? 0.4 : 1,
    //     fontSize: '12px',
    //     color: !isBegin && toolHover === 'rotate' ? EColor.Hover : EColor.Normal,
    //   },
    // },
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
