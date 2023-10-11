import { ImgUtils } from '@labelu/annotation';
import { message } from 'antd';
import React, { useEffect, useRef, useState, useContext, useLayoutEffect } from 'react';

import FileError from '@/components/fileException/FileError';
import useSize from '@/hooks/useSize';
import ViewContext from '@/view.context';

const AnnotationOperation: React.FC<any> = () => {
  const [, forceRender] = useState<number>(0);
  const { annotationEngine, currentToolName, sample, updateEngine } = useContext(ViewContext);
  const toolInstance = annotationEngine?.toolInstance;

  const annotationRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const size = useSize(annotationRef);

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return;
    }
    updateEngine(containerRef.current);
  }, [updateEngine]);

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

  /** 窗口大小监听 */
  useEffect(() => {
    if (!size.width || !size.height) {
      return;
    }

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
    if (!sample?.url) {
      return;
    }

    ImgUtils.load(sample.url).then((imgNode) => {
      annotationEngine?.setImgNode(imgNode as HTMLImageElement);
    });
  };

  return (
    <div ref={annotationRef} className="annotationOperation">
      <div className="canvas" ref={containerRef} style={size} id="toolContainer" key={currentToolName} />
      {toolInstance?.isImgError === true && (
        <FileError {...size} reloadImage={reloadImg} backgroundColor="#e2e2e2" ignoreOffsetY={true} />
      )}
    </div>
  );
};

export default AnnotationOperation;
