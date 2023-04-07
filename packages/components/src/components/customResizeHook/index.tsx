import { cKeyCode } from '@label-u/annotation';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { editStepWidth, footerHeight, headerHeight, sidebarWidth } from '@/data/enums/AnnotationSize';
import type { ISize } from '@/types/main';

const EKeyCode = cKeyCode.default;

export const viewportContext = React.createContext<{
  width: number;
  height: number;
}>({
  width: typeof window !== 'undefined' ? window.innerWidth : 800,
  height: typeof window !== 'undefined' ? window.innerHeight : 400,
});

export const ViewportProviderComponent = (props: any) => {
  const { children } = props;
  const [width] = useState(typeof window !== 'undefined' ? window.innerWidth : 800);
  const [height] = useState(typeof window !== 'undefined' ? window.innerHeight : 400);

  const keydown = useCallback((e: KeyboardEvent) => {
    if (e.keyCode === EKeyCode.R) {
      // TODO: 旋转
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window?.addEventListener('keydown', keydown);
      return () => {
        window?.removeEventListener('keydown', keydown);
      };
    }
  }, [keydown]);

  const size = useMemo(() => ({ width, height }), [width, height]);

  return <viewportContext.Provider value={size}>{children}</viewportContext.Provider>;
};

export const ViewportProvider = ViewportProviderComponent;

export const useViewport = () => {
  const { width, height } = useContext(viewportContext);
  return { width, height };
};

/**
 * 获取当前 canvas 的大小
 * @param isEdit 是否为编辑模式
 * @param isTips 是否有 tips
 */
export const useCanvasViewPort = (isEdit = false, isTips = false) => {
  const { width, height } = useContext(viewportContext);
  const otherHeight = headerHeight + footerHeight;
  const placeholderHeight = isTips ? 40 + otherHeight + 40 : otherHeight;
  const placeholderWidth = isEdit ? editStepWidth + sidebarWidth : sidebarWidth;

  return {
    width: width - placeholderWidth,
    height: height - placeholderHeight,
  };
};

/**
 * 解析当前 windowSize 下的 canvasSize
 * @param size
 * @param isEdit
 * @param isTips
 */
export const getFormatSize = (windowSize: ISize, isEdit = false, isTips = false) => {
  const { width, height } = windowSize;
  const otherHeight = headerHeight + footerHeight;
  const placeholderHeight = isTips ? 40 + otherHeight + 40 : otherHeight;
  const placeholderWidth = isEdit ? editStepWidth + sidebarWidth : sidebarWidth;

  return {
    width: width - placeholderWidth,
    height: height - placeholderHeight,
  };
};
