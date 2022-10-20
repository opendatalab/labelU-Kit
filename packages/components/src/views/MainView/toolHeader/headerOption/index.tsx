import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppState } from '@/store';
// import rotateSvg from '@/assets/annotation/common/icon_r.svg';
import revocationSvg from '@/assets/annotation/common/icon_next.svg';
import restoreSvg from '@/assets/annotation/common/icon_back.svg';
// import rotateHighlightSvg from '@/assets/annotation/common/icon_rA.svg';
import revocationHighlightSvg  from '@/assets/annotation/common/icon_nextA.svg';
import restoreHighlightSvg from '@/assets/annotation/common/icon_backA.svg';
// import saveSvg from '@/assets/annotation/common/icon_save.svg';
// import saveLightSvg from '@/assets/annotation/common/icon_saveA.svg';
import { prefix } from '@/constant';
import { EToolName } from '@/data/enums/ToolType';
// import { ChangeSave } from '@/store/annotation/actionCreators';
import { IStepInfo } from '@/types/step';
import { useTranslation } from 'react-i18next';
import { cTool, PrevResult } from '@label-u/annotation';
import { Popover } from 'antd';
import { UpdateImgList } from '@/store/annotation/actionCreators';
import { toolList } from '../ToolOperation';
const { EVideoToolName } = cTool;

interface IProps {
  isBegin?: boolean;
  stepInfo: IStepInfo;
}

enum EColor {
  Hover = '#666fff',
  Normal = '#cccccc',
}
  
export const labelTool = [EToolName.Rect,EToolName.Point,EToolName.Line,EToolName.Polygon];

const HeaderOption: React.FC<IProps> = (props) => {
  const [toolHover, setToolHover] = useState('');
  const { stepInfo } = props;
  const dispatch = useDispatch();
  const {
    annotation: { toolInstance, onSave,imgList,imgIndex,currentToolName }
  } = useSelector((state: AppState) => ({
    annotation: state.annotation,
    imgAttribute: state.imgAttribute,
  }));
  const { t } = useTranslation();

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

  // const revocation = useCallback(() => {
  //   toolInstance?.undo();
  // }, [toolInstance]);




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

  // 统一处理撤回
  const revocation = ()=>{
    if (imgList && imgList.length > 0 && imgList.length > imgIndex) {
      let count = 0;
      let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
      for(let tool of labelTool){
        if(oldImgResult[tool]?.result){
          count += oldImgResult[tool]?.result.length;
        }
      }
      for(let tool of labelTool){
        let tmpResult = oldImgResult[tool]?.result;
        if(tmpResult&&tmpResult.length>0){
           let newTmpResult = tmpResult.reduce((res: any[], item: { order: number; })=>{
            if(item.order !== count){
              res.push(item);
            }
            return res;
           },[] as any[])
           oldImgResult[tool].result = newTmpResult;
        }
      }
      imgList[imgIndex].result = JSON.stringify(oldImgResult);
      dispatch(UpdateImgList(imgList));
      updateCanvasView(oldImgResult);
    }
  }

  // 统一处理重做
  const restore = ()=>{
    let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    for(let tool of labelTool){
      let tmpResult = oldImgResult[tool]?.result;
      if(tmpResult&&tmpResult.length>0){
         oldImgResult[tool].result = [];
      }
    }
    imgList[imgIndex].result = JSON.stringify(oldImgResult);
    dispatch(UpdateImgList(imgList));
    updateCanvasView(oldImgResult);

  }


  // const restore = useCallback(() => {
  //   toolInstance?.redo();
  // }, [toolInstance]);

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
      toolName: 'restore',
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
    },
    {
      toolName: 'revocation',
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
            <Popover key={info.toolName} content={t(info.toolName)} trigger='hover'>
              <div
                className='item'
                onMouseEnter={() => setToolHover(info.toolName)}
                onMouseLeave={() => setToolHover('')}
              >
                <a className='item' onClick={info.click}>
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
