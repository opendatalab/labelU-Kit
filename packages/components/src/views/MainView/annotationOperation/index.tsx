import { AppProps, store } from '@/index';
import { LabelUContext, useDispatch } from '@/store/ctx';
import _ from 'lodash-es';
import React, { useEffect, useRef, useState } from 'react';
import { message } from 'antd/es';
import { connect } from 'react-redux';
import { ImgAttributeState } from 'src/store/imgAttribute/types';

import { AppState } from 'src/store';
import FileError from '@/components/fileException/FileError';
import useSize from '@/hooks/useSize';
import { InitToolStyleConfig } from '@/store/toolStyle/actionCreators';
import { AnnotationEngine, ImgUtils } from '@label-u/annotation';
import { i18n } from '@label-u/utils';

import { IStepInfo } from '@/types/step';
// import StepUtils from '@/utils/StepUtils';
import { ChangeSave } from '@/store/annotation/actionCreators';

export interface IProps extends AppState, AppProps {
  imgAttribute: ImgAttributeState;
  imgIndex: number;
  annotationEngine: AnnotationEngine;
  loading: boolean;
  stepList: IStepInfo[];
  step: number;
  toolName: string; // 通过工具名称实现工具dom 更新
}

const AnnotationOperation: React.FC<IProps> = (props: IProps) => {
  const [, forceRender] = useState<number>(0);
  const dispatch = useDispatch();
  const {
    toolName,
    imgAttribute,
    toolStyle,
    toolInstance,
    annotationEngine,
    imgList,
    imgIndex,
    dataInjectionAtCreation,
    renderEnhance,
    customRenderStyle,
    // stepList,
    // step,
    drawLayerSlot,
  } = props;
  const [annotationPos, setAnnotationPos] = useState({ zoom: 1, currentPos: { x: 0, y: 0 } });
  const annotationRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const size = useSize(annotationRef);

  useEffect(() => {
    store.dispatch(InitToolStyleConfig());
  }, []);

  useEffect(() => {
    if (!annotationEngine) {
      return;
    }

    // 更改 toolInstance 内部国际化语言
    switch (i18n.language) {
      case 'cn':
      case 'en':
        annotationEngine.setLang(i18n.language);
        break;
      default: {
        //
        break;
      }
    }
    annotationEngine?.setDataInjectionAtCreation(dataInjectionAtCreation);
    annotationEngine?.setRenderEnhance(renderEnhance);
    if (customRenderStyle) {
      annotationEngine?.setCustomRenderStyle(customRenderStyle);
    }
  }, [annotationEngine, dataInjectionAtCreation, renderEnhance, customRenderStyle]);

  useEffect(() => {
    const renderZoom = (zoom: number, currentPos: { x: number; y: number }) => {
      setAnnotationPos({ zoom, currentPos });
    };

    const dragMove = (props: { currentPos: { x: number; y: number }; zoom: number }) => {
      setAnnotationPos(props);
    };

    if (toolInstance) {
      toolInstance.singleOn('messageError', (error: string) => {
        message.error(error);
      });

      toolInstance.singleOn('messageInfo', (info: string) => {
        message.info(info);
      });

      toolInstance.singleOn('changeAnnotationShow', () => {
        forceRender((s) => s + 1);
      });

      toolInstance.on('renderZoom', renderZoom);
      toolInstance.on('dragMove', dragMove);
    }

    return () => {
      if (toolInstance) {
        toolInstance.unbind('renderZoom', renderZoom);
        toolInstance.unbind('dragMove', dragMove);
      }
    };
  }, [toolInstance]);

  useEffect(() => {
    if (toolInstance) {
      toolInstance.setImgAttribute(imgAttribute);
    }
  }, [imgAttribute]);

  /** 样式同步 */
  useEffect(() => {
    if (toolInstance) {
      toolInstance.setStyle(toolStyle);
    }
    if (annotationEngine) {
      annotationEngine.setStyle(toolStyle);
    }
  }, [toolStyle]);

  /** 窗口大小监听 */
  useEffect(() => {
    if (toolInstance?.setSize) {
      toolInstance.setSize(size);
    }

    if (annotationEngine) {
      annotationEngine.setSize(size);
    }
  }, [size]);

  // to make sure
  // useEffect(() => {
  //   // Update StepList When it update by outside
  //   const currentStepInfo = StepUtils.getCurrentStepInfo(step, stepList);
  //   toolInstance?.setConfig(currentStepInfo.config);
  // }, [stepList]);

  /**
   * 重新加载图片，避免网络问题导致的图片无法加载
   * @returns
   */
  const reloadImg = () => {
    const imgInfo = imgList?.[imgIndex];
    if (!imgInfo?.url) {
      return;
    }

    ImgUtils.load(imgInfo.url).then((imgNode) => {
      annotationEngine.setImgNode(imgNode as HTMLImageElement);
    });
  };

  // 定义全局保存标注结果事件监听
  useEffect(() => {
    // 初始化配置防抖方法
    const throttle = (fun: () => void, time: number) => {
      let timmer: any;
      let returnFunction = () => {
        if (timmer) {
          clearTimeout(timmer);
        }
        timmer = setTimeout(() => {
          fun();
        }, time);
      };
      return returnFunction;
    };
    // @ts-ignore
    window.Cthrottle = throttle;
    // @ts-ignore 添加防抖提升性能
    const throtthleSave = window.Cthrottle(() => {
      // 切换工具保存标注结果
      dispatch(ChangeSave);
    }, 100);
    document.getElementById('toolContainer')?.addEventListener('saveLabelResultToImg', (e) => {
      throtthleSave();
    });
  }, []);

  return (
    <div ref={annotationRef} className='annotationOperation'>
      <div className='canvas' ref={containerRef} style={size} id='toolContainer' key={toolName}>
        {drawLayerSlot?.(annotationPos)}
      </div>
      {toolInstance?.isImgError === true && (
        <FileError
          {...size}
          reloadImage={reloadImg}
          backgroundColor='#e2e2e2'
          ignoreOffsetY={true}
        />
      )}
    </div>
  );
};

const mapStateToProps = (state: AppState) => {
  const annotationState = _.pickBy(state.annotation, (v, k) =>
    [
      'imgList',
      'imgIndex',
      'stepList',
      'step',
      'toolInstance',
      'annotationEngine',
      'loading',
    ].includes(k),
  );
  return {
    imgAttribute: state.imgAttribute,
    toolStyle: state.toolStyle,
    ...annotationState,
  };
};

export default connect(mapStateToProps, null, null, { context: LabelUContext })(
  AnnotationOperation,
);
