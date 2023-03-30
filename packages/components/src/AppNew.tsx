import { i18n } from '@label-u/utils';
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { AnnotationEngine, BasicToolOperation, EToolName, ImgUtils } from '@label-u/annotation';
import _, { cloneDeep, isEmpty, set } from 'lodash-es';

import MainView from '@/views/MainView';
import type { BasicConfig, Attribute, OneTag, TextConfig } from '@/interface/toolConfig';

import type { ToolInstance } from './store/annotation/types';
import type { GetFileData, OnSave, OnSubmit, IFileItem, OnPageChange, OnStepChange, LoadFileList } from './types/data';
import type { Footer, Header, Sider } from './types/main';
import type { IStepInfo } from './types/step';
import ViewContext from './view.context';
import { jsonParser } from './utils';

interface IAnnotationStyle {
  stroke: string;
  fill: string;
  text: string;
  toolColor: any;
}

export interface AppProps {
  toolStyle?: IAnnotationStyle;
  exportData?: (data: any[]) => void;
  goBack?: (data: any) => void;
  imgList?: IFileItem[];
  config?: any;
  stepList?: IStepInfo[];
  step?: number;
  isPreview?: boolean; // if preview
  onSubmit?: OnSubmit;
  onSave?: OnSave;
  onPageChange?: OnPageChange;
  onStepChange?: OnStepChange;
  getFileData?: GetFileData;
  pageSize?: number;
  loadFileList?: LoadFileList;
  headerName?: string;
  initialIndex?: number;
  className?: string;
  toolInstance?: ToolInstance;
  currentToolName?: string; // redux
  header?: Header;
  footer?: Footer;
  sider?: Sider;
  style?: {
    layout?: Record<string, any>;
    header?: Record<string, any>;
    sider?: Record<string, any>;
    footer?: Record<string, any>;
  };
  setToolInstance?: (tool: ToolInstance) => void;
  mode?: 'light' | 'dark'; // 临时需求应用于 toolFooter 的操作
  showTips?: boolean; // 是否展示 tips
  defaultLang?: 'en' | 'cn'; // 国际化设置
  leftSiderContent?: React.ReactNode | React.ReactNode; // 左侧图片列表操作空间
  topActionContent?: React.ReactNode | React.ReactNode; // 顶部操作空间
  tagConfigList?: OneTag[]; // 配置tag 信息，工具共享一套tag
  attributeList?: Attribute[]; // 标签配置选项，工具共享一套标签
  toolsBasicConfig: BasicConfig[]; // 多工具配置
  textConfig: TextConfig;
  // 标注信息扩展的功能
  dataInjectionAtCreation?: (annotationData: any) => {};
  // 是否显示标注顺序
  isShowOrder?: boolean;
  // 渲染增强
  renderEnhance?: {
    staticRender?: (canvas: HTMLCanvasElement, data: any, style: IAnnotationStyle) => void;
    selectedRender?: (canvas: HTMLCanvasElement, data: any, style: IAnnotationStyle) => void;
    creatingRender?: (canvas: HTMLCanvasElement, data: any, style: IAnnotationStyle) => void;
  };

  sample: IFileItem;
}

const initialToolStyle = {
  color: 1,
  width: 2,
  borderOpacity: 9,
  fillOpacity: 9,
  imgListCollapse: true,
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

const App = (props, ref) => {
  const {
    currentToolName,
    config,
    isShowOrder,
    sample,
    isPreview,
    leftSiderContent,
    topActionContent,
    defaultLang = 'cn',
  } = props;
  const tools = config?.tools;

  // 以下是新代码
  const [imgNode, setImgNode] = useState<HTMLImageElement | null>(null);
  const parsedResult = useMemo(() => {
    return jsonParser(sample?.result);
  }, [sample?.result]);
  const [engine, setEngine] = useState<AnnotationEngine | null>(null);
  const [toolName, setToolName] = useState<string>(currentToolName as string);
  const [imageAttribute, setImageAttribute] = useState({
    brightness: 1,
    contrast: 1,
    isOriginalSize: false,
    saturation: 1,
    zoomRatio: 1,
  });
  const [toolStyle, setToolStyle] = useState<any>(initialToolStyle);
  const [result, setResult] = useState<any>({});
  const [orderVisible, toggleOrderVisible] = useState<boolean>(!!isShowOrder);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [resultVisibilityChanged, setResultVisibilityChanged] = useState<number>(Date.now());
  const resultRef = useRef<any>();

  const updateResult = useCallback((newResult) => {
    setResult(newResult);
  }, []);

  const updateSelectedResult = useCallback((newSelectedResult) => {
    setSelectedResult(newSelectedResult);
  }, []);

  const triggerVisibilityChange = useCallback(() => {
    setResultVisibilityChanged(Date.now());
  }, []);

  // 所有工具的标注结果
  const allToolResult = useMemo(() => extractResult(result), [result]);
  // 图形标注工具的标注结果
  const graphicResult = useMemo(() => extractResult(result, [EToolName.Tag, EToolName.Text]), [result]);

  const textConfig = useMemo(
    () => _.chain(config).get('tools').find({ tool: 'textTool' }).get('config.texts').value(),
    [config],
  );
  const tagConfigList = useMemo(
    () => _.chain(config).get('tools').find({ tool: 'tagTool' }).get('config.tags').value(),
    [config],
  );
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
        _.forEach([...configItem.config?.attributes, ...(config.attributes || [])], (item: Attribute) => {
          attributeMap.set(item.value, item);
        });
      }

      mapping.set(configItem.tool, attributeMap);
    });

    return mapping;
  }, [config.attributes, tools]);

  const updateEngine = useCallback(
    (container: HTMLDivElement) => {
      const _toolName = toolName || tools[0].tool;
      const toolConfig = _.find(tools, { tool: _toolName });

      setEngine(
        new AnnotationEngine({
          container,
          isShowOrder: orderVisible,
          toolName: _toolName,
          size: {
            with: 1,
            height: 1,
          },
          imgNode: new Image(),
          config: toolConfig?.config,
          style: initialToolStyle,
          tagConfigList: tagConfigList!,
          allAttributesMap,
        }),
      );
    },
    [allAttributesMap, orderVisible, tagConfigList, toolName, tools],
  );

  useEffect(() => {
    i18n.changeLanguage(defaultLang);
  }, [defaultLang]);

  useEffect(() => {
    if (!currentToolName) {
      setToolName(tools[0].tool);
    } else {
      setToolName(currentToolName);
    }
  }, [currentToolName, tools]);

  useEffect(() => {
    if (parsedResult) {
      updateResult(parsedResult);
    }
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
  }, [parsedResult, sample.id, updateResult]);

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
  }, [engine, toolName, parsedResult, resultVisibilityChanged, sample.id]);

  useEffect(() => {
    if (!engine || !toolName) {
      return;
    }

    const currentToolResult = result[toolName] || {};

    if (selectedResult && selectedResult.toolName === toolName && engine.toolName === toolName) {
      if (engine.toolName === EToolName.Line) {
        const lineResult = currentToolResult.result.find((item: any) => item.id === selectedResult.id);
        engine.toolInstance.setActiveAreaByPoint(lineResult.pointList[0]);
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
    // engine?.toolInstance.on('changeAttributeSidebar', syncResultToContext);

    return () => {
      document.getElementById('toolContainer')?.removeEventListener('saveLabelResultToImg', syncResultToContext);
      engine?.toolInstance?.off?.('updateResult', syncResultToContext);
      // engine?.toolInstance?.off?.('changeAttributeSidebar', syncResultToContext);
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
      triggerVisibilityChange,
      resultVisibilityChanged,
      graphicResult,
      isPreview,
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
    triggerVisibilityChange,
    resultVisibilityChanged,
    graphicResult,
    isPreview,
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
    <ViewContext.Provider value={viewContextValue}>
      <div id="annotation-content-area-to-get-box">
        <MainView />
      </div>
    </ViewContext.Provider>
  );
};

export default App;
