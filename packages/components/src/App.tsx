import { i18n } from '@label-u/utils';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { InnerAttribute, LabelUAnnotationConfig, TextAttribute } from '@label-u/annotation';
import { AnnotationEngine, BasicToolOperation, EToolName, ImgUtils } from '@label-u/annotation';
import _, { cloneDeep, isEmpty, set } from 'lodash-es';
import { I18nextProvider } from 'react-i18next';

import MainView from '@/views/MainView';

import type { IFileItem } from './types/data';
import ViewContext from './view.context';
import { jsonParser } from './utils';
import type { BasicResult, ImageAttribute, SelectedResult, ToolStyle } from './interface/base';

export interface AppProps {
  config?: LabelUAnnotationConfig;
  isPreview?: boolean; // if preview
  className?: string;
  showTips?: boolean; // 是否展示 tips
  defaultLang?: 'en' | 'cn'; // 国际化设置
  leftSiderContent?: React.ReactNode | React.ReactNode; // 左侧图片列表操作空间
  topActionContent?: React.ReactNode | React.ReactNode; // 顶部操作空间
  // 是否显示标注顺序
  isShowOrder?: boolean;
  currentToolName?: EToolName;
  sample: IFileItem;
  // TODO 暂未支持
  isSidebarCollapsed?: boolean;
}

const initialToolStyle: ToolStyle = {
  color: 1,
  width: 2,
  borderOpacity: 9,
  fillOpacity: 9,
};

// 所有工具的标注结果
const extractResult = (input: any, excludeToolNames?: string[]) =>
  Object.keys(input).reduce((res, key) => {
    if (key.indexOf('Tool') > 0) {
      if (excludeToolNames && !excludeToolNames.includes(key)) {
        // @ts-ignore
        res.push(input[key]);
      } else if (!excludeToolNames) {
        // @ts-ignore
        res.push(input[key]);
      }
    }
    return res;
  }, []);

const App = forwardRef<
  {
    getResult: () => any;
    toolInstance: any;
  },
  AppProps
>((props, ref) => {
  const {
    currentToolName,
    config,
    isShowOrder,
    sample,
    isPreview = false,
    leftSiderContent,
    topActionContent,
    isSidebarCollapsed = false,
    defaultLang = 'cn',
  } = props;
  const [imgNode, setImgNode] = useState<HTMLImageElement | null>(null);
  const parsedResult = useMemo(() => {
    return jsonParser(sample?.result);
  }, [sample?.result]);
  const [engine, setEngine] = useState<AnnotationEngine | null>(null);
  const [toolName, setToolName] = useState<EToolName>(currentToolName!);
  const [imageAttribute, setImageAttribute] = useState<ImageAttribute>({
    brightness: 1,
    contrast: 1,
    isOriginalSize: false,
    saturation: 1,
    zoomRatio: 1,
  });
  const [toolStyle, setToolStyle] = useState<ToolStyle>(initialToolStyle);
  const [result, setResult] = useState<BasicResult>({} as BasicResult);
  const [orderVisible, toggleOrderVisible] = useState<boolean>(!!isShowOrder);
  const [selectedResult, setSelectedResult] = useState<SelectedResult | null>(null);
  const [engineResultUpdateTimeStamp, updateTimeStamp] = useState<number>(Date.now());
  const resultRef = useRef<BasicResult | null>();
  const engineRef = useRef<AnnotationEngine | null>(null);

  const updateResult = useCallback((newResult) => {
    setResult(newResult);
  }, []);

  const updateSelectedResult = useCallback((newSelectedResult: SelectedResult | null) => {
    setSelectedResult(newSelectedResult);
  }, []);

  const syncResultToEngine = useCallback(() => {
    updateTimeStamp(Date.now());
  }, []);

  // 所有工具的标注结果
  const allToolResult = useMemo(() => extractResult(result), [result]);
  // 图形标注工具的标注结果
  const graphicResult = useMemo(() => extractResult(result, [EToolName.Tag, EToolName.Text]), [result]);
  const tools = useMemo(() => {
    return config?.tools ?? [];
  }, [config?.tools]);
  const commonAttributes = useMemo(() => {
    return config?.attributes ?? [];
  }, [config?.attributes]);

  const textConfig = useMemo(() => {
    const textTool = tools.find((item) => item.tool === EToolName.Text);

    return (textTool?.config?.attributes as TextAttribute[]) ?? [];
  }, [tools]);
  const tagConfigList = useMemo(() => {
    const tagTool = tools.find((item) => item.tool === EToolName.Tag);

    return (tagTool?.config?.attributes as InnerAttribute[]) ?? [];
  }, [tools]);
  const allAttributesMap = useMemo(() => {
    const mapping = new Map<string, any>();

    _.forEach(tools, (configItem) => {
      const attributeMap = new Map<string, any>();
      attributeMap.set(BasicToolOperation.NONE_ATTRIBUTE, {
        key: '无标签',
        value: BasicToolOperation.NONE_ATTRIBUTE,
        color: '#ccc',
      });

      if (configItem.config?.attributes) {
        _.forEach([...configItem.config?.attributes, ...(commonAttributes || [])], (item) => {
          attributeMap.set(item.value, item);
        });
      }

      mapping.set(configItem.tool, attributeMap);
    });

    return mapping;
  }, [commonAttributes, tools]);

  const updateEngine = useCallback(
    (container: HTMLDivElement) => {
      if (!tools.length || !toolName) {
        return;
      }

      const _toolName = toolName || tools[0].tool;
      const toolConfig = _.find(tools, { tool: _toolName });

      if (engineRef.current) {
        engineRef.current.toolInstance.destroy();
      }

      const newEngine = new AnnotationEngine({
        container,
        isShowOrder: orderVisible,
        toolName: _toolName,
        size: {
          with: 1,
          height: 1,
        },
        imgNode: new Image(),
        config: { ...toolConfig?.config, drawOutsideTarget: config?.drawOutsideTarget },
        style: initialToolStyle,
        tagConfigList,
        allAttributesMap,
      });

      engineRef.current = newEngine;

      setEngine(newEngine);
    },
    [allAttributesMap, config?.drawOutsideTarget, orderVisible, tagConfigList, toolName, tools],
  );

  useEffect(() => {
    i18n.changeLanguage(defaultLang);
  }, [defaultLang]);

  useEffect(() => {
    if (!tools.length) {
      return;
    }

    if (!currentToolName) {
      setToolName(tools[0].tool as EToolName);
    } else {
      setToolName(currentToolName);
    }
  }, [currentToolName, tools]);

  useEffect(() => {
    updateResult(parsedResult);
  }, [parsedResult, updateResult]);

  useEffect(() => {
    if (engine?.toolInstance) {
      engine?.toolInstance.setImgAttribute(imageAttribute);
    }
  }, [engine?.toolInstance, imageAttribute]);

  useEffect(() => {
    if (engine) {
      engine.setStyle(toolStyle);
    }
  }, [engine, toolStyle]);

  useEffect(() => {
    if (!sample || !engine) {
      return;
    }

    ImgUtils.load(sample.url!).then((_imgNode) => {
      setImgNode(_imgNode);
      engine.setImgNode(_imgNode as HTMLImageElement, {
        rotate: result?.rotate ?? 0,
        valid: result?.valid ?? true,
      });
    });
  }, [engine, result?.rotate, result?.valid, sample]);

  useEffect(() => {
    resultRef.current = result;

    return () => {
      resultRef.current = null;
    };
  }, [result]);

  useEffect(() => {
    resultRef.current = parsedResult;
    return () => {
      // 切换样本后，清空ref
      resultRef.current = null;
      updateResult({});
      setSelectedResult(null);
    };
  }, [parsedResult, sample?.id, updateResult]);

  useEffect(() => {
    if (!engine || !imgNode) {
      return;
    }

    engine.setImgNode(imgNode as HTMLImageElement, {
      rotate: result?.rotate ?? 0,
      valid: result?.valid ?? true,
    });
  }, [engine, imgNode, result?.rotate, result?.valid, toolName]);

  useEffect(() => {
    if (!engine || engine.toolName !== toolName) {
      return;
    }

    /**
     * state中的result不实时回写到annotation engine中
     * 当工具切换时，从ref中获取最新的result，并将其回写到annotation engine中
     * ref会在result更新时更新
     */
    const finalResult = isEmpty(resultRef.current) ? parsedResult : resultRef.current;
    const currentToolResult = finalResult[toolName] || [];
    engine.setPrevResultList(extractResult(finalResult, [toolName]));
    engine.toolInstance.setResult(currentToolResult.result || []);
    engine.toolInstance.history.initRecord(currentToolResult, true);
    engine.toolInstance.renderBasicCanvas();
    engine.toolInstance.render();
  }, [engine, toolName, parsedResult, engineResultUpdateTimeStamp, sample?.id]);

  useEffect(() => {
    if (!engine || !toolName) {
      return;
    }

    const currentToolResult = result[toolName] || {};

    if (selectedResult && selectedResult.toolName === toolName && engine.toolName === toolName) {
      if (engine.toolName === EToolName.Line) {
        const lineResult = currentToolResult.result.find((item: any) => item.id === selectedResult.id);

        if (lineResult) {
          engine.toolInstance.setActiveAreaByPoint(lineResult.pointList![0]);
        }
      } else {
        engine.toolInstance.setSelectedID(selectedResult.id);
      }

      engine.toolInstance.setDefaultAttribute(selectedResult.attribute);
    }
  }, [engine, engine?.toolName, result, selectedResult, toolName]);

  useEffect(() => {
    if (!engine || !result || !toolName) {
      return;
    }

    const handleSelectedChange = () => {
      const currentToolResult = result[toolName] || [];

      if (!currentToolResult.result) {
        return;
      }

      const correctItem = currentToolResult.result.find((item: any) => item.id === engine?.toolInstance.selectedID);

      if (correctItem && correctItem.id !== selectedResult?.id) {
        setSelectedResult({
          ...correctItem,
          toolName,
        });
      } else if (!correctItem) {
        setSelectedResult(null);
      }
    };

    engine.toolInstance.singleOn('selectedChange', handleSelectedChange);

    return () => {
      engine?.toolInstance?.off?.('selectedChange', handleSelectedChange);
    };
  }, [engine, result, selectedResult?.id, toolName]);

  useEffect(() => {
    const syncResultToContext = () => {
      if (!toolName) {
        return;
      }

      setTimeout(() => {
        const [newResultAdded] = engine?.toolInstance.exportData();
        const newResult = cloneDeep(result);

        set(newResult, [toolName, 'result'], newResultAdded);
        set(newResult, [toolName, 'toolName'], toolName);
        updateResult(newResult);
      });
    };

    document.getElementById('toolContainer')?.addEventListener('saveLabelResultToImg', syncResultToContext);
    engine?.toolInstance.singleOn('updateResult', syncResultToContext);

    return () => {
      document.getElementById('toolContainer')?.removeEventListener('saveLabelResultToImg', syncResultToContext);
      engine?.toolInstance?.off?.('updateResult', syncResultToContext);
    };
  }, [engine?.toolInstance, allToolResult, toolName, result, selectedResult, updateResult]);

  const viewContextValue = useMemo(() => {
    return {
      imageAttribute,
      // 工具配置
      config,
      annotationEngine: engine,
      // TODO: 先支持一个样本
      sample,
      currentToolName: toolName,
      updateEngine,
      leftSiderContent: leftSiderContent,
      topActionContent: topActionContent,
      result,
      currentToolResult: result[toolName],
      textConfig,
      tagConfigList,
      setResult: updateResult,
      setToolName,
      allToolResult,
      allAttributesMap,
      isShowOrder: orderVisible,
      setIsShowOrder: toggleOrderVisible,
      setImageAttribute,
      toolStyle,
      setToolStyle,
      selectedResult,
      setSelectedResult: updateSelectedResult,
      syncResultToEngine,
      engineResultUpdateTimeStamp,
      graphicResult,
      isPreview,
      isSidebarCollapsed,
    };
  }, [
    imageAttribute,
    config,
    engine,
    sample,
    toolName,
    updateEngine,
    leftSiderContent,
    topActionContent,
    result,
    textConfig,
    tagConfigList,
    updateResult,
    allToolResult,
    allAttributesMap,
    orderVisible,
    toolStyle,
    selectedResult,
    updateSelectedResult,
    syncResultToEngine,
    engineResultUpdateTimeStamp,
    graphicResult,
    isPreview,
    isSidebarCollapsed,
  ]);

  // 暴露给 ref 的一些方法
  useImperativeHandle(
    ref,
    () => {
      return {
        toolInstance: engine?.toolInstance,
        getResult: () => {
          return new Promise((resolve) => {
            resolve(result);
          });
        },
      };
    },
    [engine?.toolInstance, result],
  );

  return (
    <I18nextProvider i18n={i18n}>
      <ViewContext.Provider value={viewContextValue}>
        <div id="annotation-content-area-to-get-box">
          <MainView />
        </div>
      </ViewContext.Provider>
    </I18nextProvider>
  );
});

export default App;
