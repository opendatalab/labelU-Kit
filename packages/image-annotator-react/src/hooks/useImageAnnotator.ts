import type { AnnotatorOptions } from '@labelu/image';
import { Annotator } from '@labelu/image';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ResizeObserver from 'resize-observer-polyfill';

export type ImageAnnotatorOptions = Omit<AnnotatorOptions, 'container'>;

export const useImageAnnotator = (containerRef: React.RefObject<HTMLDivElement>, options: ImageAnnotatorOptions) => {
  const [engine, setAnnotationEngine] = useState<Annotator | null>(null);
  const [optionsState, setOptionsState] = useState<ImageAnnotatorOptions>(options);
  const ignoredFirstRun = useRef<boolean>(true);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !engine) {
        return;
      }

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      engine.resize(width, height);

      // 需要加载图片后才能居中，否则标注坐标计算会有误差
      if (engine.backgroundRenderer?.image) {
        engine.center();
      }
    };

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0) {
        return;
      }

      // 忽略第一次运行
      if (ignoredFirstRun.current) {
        ignoredFirstRun.current = false;

        return;
      }

      handleResize();
    });

    resizeObserver.observe(containerRef.current as HTMLElement);

    // 监听 devicePixelRatio 变化（浏览器缩放、全屏切换等场景）
    let dprMediaQuery: MediaQueryList | null = null;
    const handleDprChange = () => {
      handleResize();

      // dpr 变化后需要重新监听新的 dpr 值
      dprMediaQuery?.removeEventListener('change', handleDprChange);
      dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprMediaQuery.addEventListener('change', handleDprChange);
    };

    dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    dprMediaQuery.addEventListener('change', handleDprChange);

    return () => {
      resizeObserver.disconnect();
      dprMediaQuery?.removeEventListener('change', handleDprChange);
    };
  }, [containerRef, engine]);

  useEffect(() => {
    if (JSON.stringify(options) === JSON.stringify(optionsState)) {
      return;
    }

    setOptionsState(options);
  }, [options, optionsState]);

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return;
    }

    // 创建和销毁必须放在 effect 体内，而不是 setState 的 updater 里：
    // updater 必须是纯函数，StrictMode 下会被双调用，导致引擎实例泄漏
    const annotator = new Annotator({
      ...(optionsState || {}),
      container: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    setAnnotationEngine(annotator);

    return () => {
      annotator.destroy();
      setAnnotationEngine(null);
    };
    // 只依赖内容去重后的 optionsState；依赖原始 options 引用会绕过上面的 stringify 去重，
    // 使内联传入的 options 对象在每次渲染时都触发引擎销毁重建
  }, [optionsState, containerRef]);

  return engine;
};
