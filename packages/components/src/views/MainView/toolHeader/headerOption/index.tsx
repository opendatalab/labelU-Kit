import React, { useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from '@/store/ctx';
import { AppState } from '@/store';
import revocationSvg from '@/assets/annotation/common/icon_next.svg';
import restoreSvg from '@/assets/annotation/common/icon_back.svg';
import revocationHighlightSvg from '@/assets/annotation/common/icon_nextA.svg';
import restoreHighlightSvg from '@/assets/annotation/common/icon_backA.svg';
import { prefix } from '@/constant';
import { IStepInfo } from '@/types/step';
import { useTranslation } from 'react-i18next';
import { cTool, PrevResult, EKeyCode, EToolName, ImageLabelTool } from '@label-u/annotation';
import { Popover } from 'antd';
import { UpdateImgList } from '@/store/annotation/actionCreators';
import { toolList } from '../ToolOperation';
import { PointCloudContext } from '@/components/pointCloudView/PointCloudContext';
import { IFileItem } from '@/types/data';
const { EVideoToolName } = cTool;

interface IProps {
  isBegin?: boolean;
  stepInfo: IStepInfo;
}

enum EColor {
  Hover = '#666fff',
  Normal = '#cccccc',
}

export const labelTool = [EToolName.PointCloud, ...ImageLabelTool];

const HeaderOption: React.FC<IProps> = (props) => {
  const [toolHover, setToolHover] = useState('');
  const [historyRevocation, setHistoryRevocation] = useState<any>([]);
  const { stepInfo } = props;
  const dispatch = useDispatch();
  const ptCtx = useContext(PointCloudContext);
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

  const isBegin = props.isBegin || isTagTool;

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
    for (let oneTool of toolList) {
      if (oneTool.toolName !== currentToolName && newLabelResult[oneTool.toolName]) {
        let onePrevResult = {
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

  // 刷新工具标注试图
  const refreshToolsView = (imgList: IFileItem[]) => {
    setTimeout(() => {
      if (ptCtx?.mainViewInstance) {
        ptCtx?.mainViewInstance.clearBoxList();
        ptCtx?.mainViewInstance.emit('refreshPointCloud3dView');
      } else {
        updateCanvasView(imgList);
      }
    }, 10);
  };

  // 统一处理撤回
  const restore = () => {
    if (imgList && imgList.length > 0 && imgList.length > imgIndex) {
      let count = 0;
      let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
      for (let tool of labelTool) {
        if (oldImgResult[tool]?.result) {
          count += oldImgResult[tool]?.result.length;
        }
      }
      for (let tool of labelTool) {
        let tmpResult = oldImgResult[tool]?.result;
        if (tmpResult && tmpResult.length > 0) {
          let newTmpResult = tmpResult.reduce((res: any[], item: { order: number }) => {
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
      refreshToolsView(oldImgResult);
    }
  };

  // 统一处理重做
  const revocation = () => {
    let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    let lastRestore = historyRevocation.pop();
    if (!lastRestore) {
      setHistoryRevocation([]);
      return;
    }
    // 获取最大序号
    let maxOrder = 0;
    for (let tool of labelTool) {
      let tmpResult = oldImgResult[tool]?.result;
      if (tmpResult && tmpResult.length > 0) {
        maxOrder += tmpResult.length;
      }
    }
    lastRestore.order = maxOrder + 1;
    for (let tool of labelTool) {
      let tmpResult = oldImgResult[tool]?.result;

      if (lastRestore.toolName === tool) {
        delete lastRestore['toolName'];
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
    refreshToolsView(oldImgResult);
  };

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
            <Popover key={info.toolName} content={t(info.toolName)} trigger='hover'>
              <div
                className='item'
                onMouseEnter={() => setToolHover(info.toolName)}
                onMouseLeave={() => setToolHover('')}
              >
                <a ref={info.ref} className='item' onClick={info.click}>
                  <img
                    className='singleTool'
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
