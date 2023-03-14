import type { AnnotationEngine } from '@label-u/annotation';
import { ImgUtils } from '@label-u/annotation';
import { i18n } from '@label-u/utils';
import { message } from 'antd/es';
import _ from 'lodash-es';
import React, { useEffect, useRef, useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import type { AppState } from 'src/store';
import type { ImgAttributeState } from 'src/store/imgAttribute/types';

import type { AppProps } from '@/App';
import FileError from '@/components/fileException/FileError';
import useSize from '@/hooks/useSize';
import { store } from '@/index';
import { InitToolStyleConfig } from '@/store/toolStyle/actionCreators';
import { ChangeSave } from '@/store/annotation/actionCreators';

interface IProps extends AppState, AppProps {
  imgAttribute: ImgAttributeState;
  imgIndex: number;
  annotationEngine: AnnotationEngine;
  loading: boolean;
  toolName: string; // 通过工具名称实现工具dom 更新
}

const AnnotationOperation: React.FC<IProps> = (props: IProps) => {
  const initializeTime = useRef(Date.now());
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
  } = props;
  const annotationRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // const windowSize = useContext(viewportContext);
  // const canvasSize = getFormatSize(windowSize);
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
    // annotationEngine?.forbidOperation()
    // toolInstance?.setForbidOperation(true)
    annotationEngine?.setDataInjectionAtCreation(dataInjectionAtCreation);
    annotationEngine?.setRenderEnhance(renderEnhance);
  }, [annotationEngine, dataInjectionAtCreation, renderEnhance]);

  useEffect(() => {
    if (!toolInstance) {
      return;
    }

    const handleMessageError = (error: string) => {
      message.error(error);
    };

    const handleMessageInfo = (info: string) => {
      message.info(info);
    };

    const handleToggleAnnotationVisibility = () => {
      forceRender((s) => s + 1);
    };

    toolInstance.singleOn('messageError', handleMessageError);
    toolInstance.singleOn('messageInfo', handleMessageInfo);
    toolInstance.singleOn('changeAnnotationShow', handleToggleAnnotationVisibility);

    return () => {
      toolInstance?.unbind('messageError', handleMessageError);
      toolInstance?.unbind('messageInfo', handleMessageInfo);
      toolInstance?.unbind('changeAnnotationShow', handleToggleAnnotationVisibility);
    };
  }, [toolInstance]);

  useEffect(() => {
    if (toolInstance) {
      toolInstance.setImgAttribute(imgAttribute);
    }
  }, [imgAttribute, toolInstance]);

  /** 样式同步 */
  useEffect(() => {
    if (toolInstance) {
      toolInstance.setStyle(toolStyle);
    }
    if (annotationEngine) {
      annotationEngine.setStyle(toolStyle);
    }
  }, [annotationEngine, toolInstance, toolStyle]);

  /** 窗口大小监听 */
  useEffect(() => {
    if (toolInstance?.setSize) {
      toolInstance.setSize(size);
    }

    if (annotationEngine) {
      annotationEngine.setSize(size);
    }
  }, [annotationEngine, size, toolInstance]);

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
      const returnFunction = () => {
        if (timmer) {
          clearTimeout(timmer);
        }
        timmer = setTimeout(() => {
          // TODO: 引擎优化后删除以下代码
          if (initializeTime.current > 0 && Date.now() - initializeTime.current > 2000) {
            fun();
          }
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
      // TODO：以上代码不必要
    }, 100);

    document.getElementById('toolContainer')?.addEventListener('saveLabelResultToImg', throtthleSave);

    return () => {
      initializeTime.current = 0;
      document.getElementById('toolContainer')?.removeEventListener('saveLabelResultToImg', throtthleSave);
    };
  }, [dispatch]);

  return (
    <div ref={annotationRef} className="annotationOperation">
      <div className="canvas" ref={containerRef} style={size} id="toolContainer" key={toolName} />
      {toolInstance?.isImgError === true && (
        <FileError {...size} reloadImage={reloadImg} backgroundColor="#e2e2e2" ignoreOffsetY={true} />
      )}
    </div>
  );
};

const mapStateToProps = (state: AppState) => {
  const annotationState = _.pickBy(state.annotation, (v, k) =>
    ['imgList', 'imgIndex', 'stepList', 'step', 'toolInstance', 'annotationEngine', 'loading'].includes(k),
  );
  return {
    imgAttribute: state.imgAttribute,
    toolStyle: state.toolStyle,
    ...annotationState,
  };
};

export default connect(mapStateToProps)(AnnotationOperation);
