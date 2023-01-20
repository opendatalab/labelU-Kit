import { cKeyCode, toolUtils } from '@label-u/annotation';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';

import { editStepWidth, footerHeight, headerHeight, sidebarWidth } from '@/data/enums/AnnotationSize';
import type { AppState } from '@/store';
import { UpdateRotate, PageBackward, PageForward } from '@/store/annotation/actionCreators';
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
  const { children, dispatch } = props;
  const [width] = useState(typeof window !== 'undefined' ? window.innerWidth : 800);
  const [height] = useState(typeof window !== 'undefined' ? window.innerHeight : 400);

  const keydown = useCallback(
    (e: KeyboardEvent) => {
      if (!toolUtils.hotkeyFilter(e)) {
        return;
      }
      if (e.keyCode === EKeyCode.M) {
        dispatch(PageBackward());
      }

      if (e.keyCode === EKeyCode.N) {
        dispatch(PageForward());
      }
      if (e.keyCode === EKeyCode.R) {
        dispatch(UpdateRotate());
      }
    },
    [dispatch],
  );

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

export const ViewportProvider = connect((state: AppState) => ({
  annotation: state.annotation,
}))(ViewportProviderComponent);

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
