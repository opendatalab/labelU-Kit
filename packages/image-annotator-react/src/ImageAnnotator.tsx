import styled from 'styled-components';
import { useHotkeys } from 'react-hotkeys-hook';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type {
  Attribute,
  ILabel,
  TextAnnotationType,
  TagAnnotationType,
  TextAttribute,
  EnumerableAttribute,
} from '@labelu/interface';
import { useRedoUndo } from '@labelu/components-react';
import { TOOL_NAMES } from '@labelu/image';
import type {
  AnnotationData,
  ToolName,
  Annotator as ImageAnnotatorClass,
  AnnotationToolData,
  EditType,
} from '@labelu/image';
import cloneDeep from 'lodash.clonedeep';

import Sidebar from './Sidebar';
import { AnnotatorToolbar } from './Toolbar';
import { LabelSection, openAttributeModal } from './LabelSection';
import { AttributePanel } from './AttributePanel';
import type { ImageAnnotatorOptions } from './hooks/useImageAnnotator';
import { useImageAnnotator } from './hooks/useImageAnnotator';
import Footer from './Footer';
import type {
  AllAnnotationMapping,
  AllAnnotationType,
  AnnotationDataInUI,
  AnnotationWithTool,
  GlobalAnnotation,
} from './context/annotation.context';
import { AnnotationContext } from './context/annotation.context';
import type { GlobalToolConfig } from './context/tool.context';
import { ToolContext } from './context/tool.context';
import { HistoryContext } from './context/history.context';
import type { ImageSample } from './context/sample.context';
import { SampleContext } from './context/sample.context';

function omit<T, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
}

function addToolNameToAnnotationData(annotationData: Partial<Record<ToolName, AnnotationData[]>>) {
  const result = [] as AnnotationDataInUI[];

  Object.keys(annotationData).forEach((key) => {
    const _toolName = key as ToolName;
    annotationData[_toolName]?.forEach((item) => {
      result.push({
        ...item,
        tool: _toolName,
      });
    });
  });

  return result;
}

const Wrapper = styled.div.attrs((props) => {
  return {
    ...props,
    className: 'labelu-image-annotator',
  };
})`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex-grow: 1;
  background-color: #fff;

  .labelu-video-wrapper {
    flex: 1;
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
`;

const ContentMid = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const AnnotationContainer = styled.div`
  flex: 1;
  width: auto !important;
  height: auto !important;
`;

export type { ImageAnnotatorOptions } from './hooks/useImageAnnotator';

export interface AnnotatorRef {
  getAnnotations: () => Partial<Record<AllAnnotationType, AnnotationData[] | GlobalAnnotation[]>> | undefined;
  getSample: () => ImageSample | undefined;

  getEngine: () => ImageAnnotatorClass | null;
}

export interface ImageAnnotatorProps {
  samples?: ImageSample[];
  config?: ImageAnnotatorOptions & Partial<GlobalToolConfig>;

  /**
   * 预标注的标签配置
   */
  preAnnotationLabels?: Partial<
    Record<ToolName | TextAnnotationType | TagAnnotationType, ILabel[] | TextAttribute[] | EnumerableAttribute[]>
  >;

  preAnnotations?: Partial<
    Record<ToolName | TextAnnotationType | TagAnnotationType, AnnotationData[] | GlobalAnnotation[]>
  >;

  renderSidebar?: null | (() => React.ReactNode);
  renderAttributes?: () => React.ReactNode;
  editingSample?: ImageSample;

  maxHistoryCount?: number;
  primaryColor?: string;
  toolbarExtra?: React.ReactNode;
  toolbarRight?: React.ReactNode;

  onError?: (error: { type: string; message: string; value?: any }) => void;

  onLoad?: (engine: ImageAnnotatorClass) => void;

  onLabelChange?: (toolName: ToolName | undefined, label: ILabel) => void;

  onToolChange?: (toolName: ToolName) => void;

  selectedLabel?: string;

  selectedTool?: ToolName;

  /**
   * 标注是否可编辑
   */
  requestEdit?: (type: EditType, payload: { toolName: ToolName; label?: string; modifiedProperty?: string }) => boolean;

  /**
   * 顶部距离
   *
   * @default 0
   */
  offsetTop?: number;
}

function ForwardAnnotator(
  {
    samples: propsSamples,
    renderSidebar,
    config,
    renderAttributes,
    offsetTop = 0,
    editingSample,
    maxHistoryCount = 20,
    primaryColor = '#007aff',
    toolbarExtra,
    toolbarRight,
    preAnnotationLabels,
    preAnnotations,
    requestEdit,
    onLabelChange: propsOnLabelChange,
    selectedLabel: propsSelectedLabel,
    onToolChange: propsOnToolChange,
    selectedTool: propsSelectedTool,
    onError,
    onLoad,
  }: ImageAnnotatorProps,
  ref: React.Ref<AnnotatorRef>,
) {
  // ================== sample ==================
  const [currentSample, setCurrentSample] = useState<ImageSample | undefined>(editingSample);
  const samples = useMemo(() => propsSamples ?? [], [propsSamples]);

  useEffect(() => {
    setCurrentSample(editingSample || samples?.[0]);
  }, [editingSample, samples, setCurrentSample]);

  const isSampleDataEmpty = useMemo(() => {
    return Object.values(currentSample?.data ?? {}).every((item) => item.length === 0);
  }, [currentSample]);

  // ================== tool ==================
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentTool, setCurrentTool] = useState<ToolName | undefined>(propsSelectedTool);

  useEffect(() => {
    setCurrentTool(propsSelectedTool);
  }, [propsSelectedTool]);

  const onToolChange = useCallback(
    (toolName: ToolName) => {
      propsOnToolChange?.(toolName);
      setCurrentTool(toolName);
    },
    [propsOnToolChange],
  );

  const tools = useMemo(() => {
    const result: ToolName[] = [];

    TOOL_NAMES.forEach((tool) => {
      if (config?.[tool]) {
        result.push(tool);
      }
    });

    return result;
  }, [config]);

  const globalToolConfig = useMemo(() => {
    return {
      text: config?.text,
      tag: config?.tag,
    };
  }, [config?.tag, config?.text]);

  const annotationOptions = useMemo(() => {
    const configWithPreAnnotationLabels = cloneDeep(config ?? {}) as ImageAnnotatorOptions & Partial<GlobalToolConfig>;

    TOOL_NAMES.forEach((tool) => {
      const preLabels = preAnnotationLabels?.[tool];
      const _labels = [...(configWithPreAnnotationLabels?.[tool]?.labels ?? [])];

      for (const preLabel of preLabels ?? []) {
        if (!_labels?.find((label) => label.value === preLabel.value)) {
          _labels?.push(preLabel as ILabel);
        }
      }

      if (preLabels) {
        if (!configWithPreAnnotationLabels![tool]) {
          configWithPreAnnotationLabels![tool] = {};
        }

        configWithPreAnnotationLabels![tool]!.labels = _labels;
      }
    });

    return {
      showOrder: true,
      requestEdit,
      ...configWithPreAnnotationLabels,
      image: {
        url: currentSample?.url ?? '',
        rotate: currentSample?.meta?.rotate ?? 0,
      },
    };
  }, [config, currentSample?.meta?.rotate, currentSample?.url, requestEdit, preAnnotationLabels]);

  const engine = useImageAnnotator(containerRef, annotationOptions);

  const [orderVisible, setOrderVisible] = useState<boolean>(true);

  const onOrderVisibleChange = useCallback(
    (value: boolean) => {
      setOrderVisible(value);

      if (engine) {
        engine.showOrder = value;
      }
    },
    [engine],
  );

  useEffect(() => {
    engine?.on('toolChange', onToolChange);

    return () => {
      engine?.off('toolChange', onToolChange);
    };
  }, [engine, onToolChange]);

  // ================== annotation ==================
  // ================== label ==================
  const labels = useMemo(() => {
    if (!currentTool) {
      return [];
    }

    return config?.[currentTool]?.labels ?? [];
  }, [config, currentTool]);

  const selectedLabelFromProps = useMemo(() => {
    return labels.find((item) => item.value === propsSelectedLabel);
  }, [labels, propsSelectedLabel]);

  const [selectedLabel, setSelectedLabel] = useState<Attribute | undefined>(
    propsSelectedLabel ? selectedLabelFromProps : labels[0],
  );

  useEffect(() => {
    setSelectedLabel(selectedLabelFromProps);
  }, [selectedLabelFromProps]);

  const [selectedAnnotation, setSelectedAnnotation] = useState<AnnotationDataInUI | undefined>();
  const annotationsFromSample = useMemo(() => {
    return currentSample?.data ?? {};
  }, [currentSample]);

  useEffect(() => {
    if (!engine || !engine.renderer) {
      return;
    }

    engine
      .loadImage(currentSample?.url ?? '', {
        rotate: currentSample?.meta?.rotate ?? 0,
      })
      .then(() => {
        Object.keys(annotationsFromSample).forEach((key) => {
          if (TOOL_NAMES.includes(key as ToolName)) {
            engine?.loadData(key as ToolName, annotationsFromSample[key as ToolName] as AnnotationToolData<ToolName>);
          }
        });

        if (isSampleDataEmpty) {
          Object.keys(preAnnotations ?? {}).forEach((key) => {
            if (TOOL_NAMES.includes(key as ToolName)) {
              engine?.loadData(
                key as ToolName,
                preAnnotations![key as ToolName] as unknown as AnnotationToolData<ToolName>,
              );
            }
          });
        }

        if (tools[0] && config?.[tools[0]]?.labels?.length) {
          engine.switch(propsSelectedTool || tools[0]);

          if (propsSelectedLabel) {
            engine.setLabel(propsSelectedLabel);
          }
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    annotationsFromSample,
    config,
    currentSample,
    engine,
    isSampleDataEmpty,
    preAnnotations,
    propsSelectedLabel,
    tools,
  ]);

  const selectedIndexRef = useRef<number>(-1);

  const onRedoUndo = useCallback(
    (currentAnnotations: AllAnnotationMapping) => {
      engine?.clearData();
      const imageAnnotations: Partial<Record<ToolName, AnnotationDataInUI[]>> = {};

      Object.values(currentAnnotations).forEach((_item) => {
        if (TOOL_NAMES.includes(_item.tool as ToolName)) {
          const toolName = _item.tool as ToolName;
          if (!imageAnnotations[toolName]) {
            imageAnnotations[toolName] = [];
          }

          imageAnnotations![toolName]!.push(_item as AnnotationDataInUI);
        }
      });

      Object.keys(imageAnnotations).forEach((key) => {
        engine?.loadData(key as ToolName, imageAnnotations[key as ToolName] as AnnotationToolData<ToolName>);
      });
    },
    [engine],
  );

  const annotationsMapping = useMemo(() => {
    const mapping: AllAnnotationMapping = {};
    const _data = currentSample?.data ?? {};
    const _preData = preAnnotations ?? {};

    if (isSampleDataEmpty) {
      Object.keys(_preData).forEach((key) => {
        _preData[key as AllAnnotationType]?.forEach((item) => {
          mapping[item.id] = {
            ...item,
            tool: key as AllAnnotationType,
          };
        });
      });
    }

    Object.keys(_data).forEach((key) => {
      _data[key as ToolName]?.forEach((item) => {
        mapping[item.id] = {
          ...item,
          tool: key as ToolName,
        };
      });
    });

    return mapping;
  }, [currentSample?.data, isSampleDataEmpty, preAnnotations]);

  const [annotationsWithGlobal, updateAnnotationsWithGlobal, redo, undo, pastRef, futureRef, reset] =
    useRedoUndo<AllAnnotationMapping>(annotationsMapping, {
      maxHistory: maxHistoryCount,
      onRedo: onRedoUndo,
      onUndo: onRedoUndo,
    });

  const onAnnotationClear = useCallback(() => {
    engine?.clearData();
    updateAnnotationsWithGlobal(() => {
      return {};
    });
  }, [engine, updateAnnotationsWithGlobal]);

  const onAnnotationRemove = useCallback(
    (_annotation: AnnotationWithTool) => {
      if (!_annotation?.tool) {
        return;
      }

      updateAnnotationsWithGlobal((pre) => (pre ? omit(pre, _annotation.id) : pre));
      setSelectedAnnotation(undefined);
    },
    [updateAnnotationsWithGlobal],
  );

  const onAnnotationsRemove = useCallback(
    (_annotations: AnnotationWithTool[]) => {
      updateAnnotationsWithGlobal((pre) => {
        let newAnnotationWithGlobal = pre;

        if (newAnnotationWithGlobal) {
          _annotations.forEach((item) => {
            newAnnotationWithGlobal = omit(newAnnotationWithGlobal!, item.id);
          });
        }

        return newAnnotationWithGlobal;
      });

      setSelectedAnnotation(undefined);
    },
    [updateAnnotationsWithGlobal],
  );

  const sortedImageAnnotations = useMemo(() => {
    const result = Object.values(annotationsWithGlobal).filter((item) => {
      return TOOL_NAMES.includes(item.tool as ToolName);
    }) as AnnotationDataInUI[];

    result.sort((a, b) => a.order - b.order);

    return result;
  }, [annotationsWithGlobal]);

  const onAnnotationsChange = useCallback(
    (_annotations: AnnotationWithTool[]) => {
      const annotationGroupByTool: AllAnnotationMapping = {};

      _annotations.forEach((item) => {
        annotationGroupByTool[item.id] = item;
      });

      updateAnnotationsWithGlobal((pre) => {
        return {
          ...pre!,
          ...annotationGroupByTool,
        };
      });
    },
    [updateAnnotationsWithGlobal],
  );

  const onAnnotationDelete = useCallback(
    (restAnnotations: AnnotationWithTool[]) => {
      const annotationGroupByTool: AllAnnotationMapping = {};

      restAnnotations.forEach((item) => {
        annotationGroupByTool[item.id] = item;
      });

      updateAnnotationsWithGlobal(() => {
        return annotationGroupByTool;
      });
    },
    [updateAnnotationsWithGlobal],
  );

  const onAnnotationChange = useCallback(
    (_annotation: AnnotationWithTool, skipHistory?: boolean) => {
      updateAnnotationsWithGlobal((pre) => {
        return {
          ...pre!,
          [_annotation.id]: _annotation,
        };
      }, skipHistory);
    },
    [updateAnnotationsWithGlobal],
  );

  useEffect(() => {
    const handleOpenAttributePanel = (e: MouseEvent, selectedId: string) => {
      if (!selectedId) {
        return;
      }

      const annotation = sortedImageAnnotations.find((item) => item.id === selectedId);
      // 按住shift键时，调起属性框
      if (engine?.keyboard?.Shift && annotation) {
        e.preventDefault();
        e.stopPropagation();
        const labelConfig = labels.find((item) => item.value === annotation?.label);
        openAttributeModal({
          labelValue: annotation.label,
          e,
          openModalAnyway: true,
          engine,
          labelConfig,
        });
      }
    };

    engine?.on('rightClick', handleOpenAttributePanel);

    return () => {
      engine?.off('rightClick', handleOpenAttributePanel);
    };
  }, [engine, labels, sortedImageAnnotations]);

  useEffect(() => {
    const handleUnSelect = () => {
      setSelectedAnnotation(undefined);
    };

    engine?.on('unselect', handleUnSelect);

    return () => {
      engine?.off('unselect', handleUnSelect);
    };
  }, [engine]);

  const labelMappingByTool = useMemo(() => {
    const mapping: Record<string, Record<string, Attribute>> = {};

    TOOL_NAMES.forEach((key) => {
      const _labels: Attribute[] = config?.[key]?.labels ?? [];
      mapping[key] = {};
      _labels.reduce((acc, cur) => {
        acc[cur.value] = cur;
        return acc;
      }, mapping[key]);
    });

    return mapping;
  }, [config]);

  const preLabelsMappingByTool = useMemo(() => {
    const mapping: Record<string, Record<string, Attribute>> = {};

    [...TOOL_NAMES, 'tag' as const, 'text' as const].forEach((key) => {
      const _labels: Attribute[] = (preAnnotationLabels?.[key] as unknown as Attribute[]) ?? [];
      mapping[key] = {};
      _labels.reduce((acc, cur) => {
        acc[cur.value] = cur;
        return acc;
      }, mapping[key]);
    });

    return mapping;
  }, [preAnnotationLabels]);

  const onLabelChange = useCallback(
    (label: ILabel) => {
      engine?.setLabel(label.value);
      engine?.setAttributes({});
      setSelectedLabel(label);
      propsOnLabelChange?.(currentTool, label);
    },
    [currentTool, engine, propsOnLabelChange],
  );

  // effects
  useEffect(() => {
    // 删除标记
    engine?.on('delete', (annotation: AnnotationData) => {
      onAnnotationDelete(addToolNameToAnnotationData(engine!.getDataByTool()));
      setSelectedAnnotation((pre) => {
        if (pre?.id === annotation.id) {
          return undefined;
        }

        return pre;
      });
    });
  }, [engine, onAnnotationDelete]);

  useEffect(() => {
    const handleAttributesChange = (annotation: AnnotationData) => {
      if (!engine) {
        return;
      }

      setSelectedAnnotation({
        ...annotation,
        tool: engine.activeToolName!,
      });
    };

    engine?.on('attributesChange', handleAttributesChange);

    return () => {
      engine?.off('attributesChange', handleAttributesChange);
    };
  }, [engine, labelMappingByTool, onAnnotationsChange]);

  useEffect(() => {
    const handleAnnotationAdded = (annotations: AnnotationData[]) => {
      if (!engine) {
        return;
      }

      onAnnotationsChange(addToolNameToAnnotationData(engine!.getDataByTool()));
      setSelectedAnnotation({
        // 默认选中第一个
        ...annotations[0],
        tool: engine.activeToolName!,
      });
    };
    // 添加标记
    engine?.on('add', handleAnnotationAdded);

    return () => {
      engine?.off('add', handleAnnotationAdded);
    };
  }, [engine, onAnnotationsChange]);

  useEffect(() => {
    const _onAnnotationsChange = () => {
      onAnnotationsChange(addToolNameToAnnotationData(engine!.getDataByTool()));
    };

    // 标记变更，如移动，编辑等
    engine?.on('change', _onAnnotationsChange);

    return () => {
      engine?.off('change', _onAnnotationsChange);
    };
  }, [engine, onAnnotationsChange]);

  useEffect(() => {
    const handleLabelChange = (label: string) => {
      if (label === selectedLabel?.value && engine?.activeToolName === currentTool) {
        return;
      }

      onAnnotationsChange(addToolNameToAnnotationData(engine!.getDataByTool()));

      setSelectedLabel(engine?.activeToolName ? labelMappingByTool[engine.activeToolName][label] : undefined);
    };
    // 改变标签
    engine?.on('labelChange', handleLabelChange);

    return () => {
      engine?.off('labelChange', handleLabelChange);
    };
  }, [currentTool, engine, labelMappingByTool, onAnnotationsChange, selectedLabel?.value]);

  useEffect(() => {
    const handleSelectAnnotation = (annotation: AnnotationData, toolName: ToolName) => {
      // 选中了隐藏的标记，需要显示
      engine?.toggleAnnotationsVisibility(toolName, [annotation.id], true);
      engine?.setLabel(annotation.label!);
      const newAnnotation = {
        ...annotation,
        tool: toolName,
        visible: true,
      };
      setSelectedAnnotation(newAnnotation);
      onAnnotationChange(newAnnotation, true);
      selectedIndexRef.current = sortedImageAnnotations.findIndex((item) => item.id === annotation.id);
    };

    engine?.on('select', handleSelectAnnotation);

    return () => {
      engine?.off('select', handleSelectAnnotation);
    };
  }, [engine, labels, onAnnotationChange, sortedImageAnnotations]);

  useEffect(() => {
    if (!onError) {
      return;
    }

    engine?.on('error', onError);

    return () => {
      engine?.off('error', onError);
    };
  }, [engine, onError]);

  useEffect(() => {
    if (!onLoad) {
      return;
    }

    const handleOnLoad = () => {
      onLoad(engine!);
    };

    engine?.on('backgroundImageLoaded', handleOnLoad);

    return () => {
      engine?.off('backgroundImageLoaded', handleOnLoad);
    };
  }, [engine, onLoad]);

  // 重置历史记录
  useEffect(() => {
    reset();
  }, [currentSample, reset]);

  // ================== sample ==================

  const onSampleSelect = useCallback(
    (sample: ImageSample) => {
      setCurrentSample(sample);
      setSelectedAnnotation(undefined);
      reset();
    },
    [reset, setCurrentSample],
  );

  // ================== 快捷键 ==================
  useHotkeys(
    'escape',
    () => {
      engine?.selectAnnotation(undefined, undefined);
    },
    {
      preventDefault: true,
    },
    [engine],
  );

  // 上一个标记
  useHotkeys(
    'ArrowUp',
    () => {
      selectedIndexRef.current = Math.max(selectedIndexRef.current - 1, 0);
      engine?.selectAnnotation(
        sortedImageAnnotations[selectedIndexRef.current].tool,
        sortedImageAnnotations[selectedIndexRef.current].id,
      );
    },
    {
      keyup: true,
      keydown: false,
    },
    [sortedImageAnnotations, engine],
  );

  // 下一个标记
  useHotkeys(
    'ArrowDown',
    () => {
      selectedIndexRef.current = Math.min(selectedIndexRef.current + 1, sortedImageAnnotations.length - 1);
      engine?.selectAnnotation(
        sortedImageAnnotations[selectedIndexRef.current].tool,
        sortedImageAnnotations[selectedIndexRef.current].id,
      );
    },
    {
      keyup: true,
      keydown: false,
    },
    [sortedImageAnnotations, engine],
  );

  // 1 ~ 9 设置标签
  useHotkeys(
    '1,2,3,4,5,6,7,8,9',
    (e) => {
      const index = Number(e.key) - 1;

      if (index < labels.length) {
        engine?.setAttributes({});
        engine?.setLabel(labels[index].value);
        // 清空上一次的属性
        openAttributeModal({
          labelValue: labels[index].value,
          engine,
          labelConfig: labels[index],
        });
      }
    },
    [engine, labels],
  );

  useImperativeHandle(
    ref,
    () => ({
      getAnnotations: () => {
        const result: Partial<Record<AllAnnotationType, AnnotationData[] | GlobalAnnotation[]>> = {};

        Object.values(annotationsWithGlobal).forEach((item) => {
          // @ts-ignore
          // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
          const { visible, tool, ...rest } = item;
          const _toolName = tool || (item as GlobalAnnotation).type;

          if (!result[_toolName]) {
            result[_toolName] = [];
          }

          result![_toolName]!.push(rest as any);
        });

        return result;
      },
      getSample: () => currentSample,

      getEngine: () => engine,
    }),
    [annotationsWithGlobal, currentSample, engine],
  );

  const annotationContextValue = useMemo(
    () => ({
      annotationsWithGlobal,
      sortedImageAnnotations,
      selectedAnnotation,
      allAnnotationsMapping: annotationsMapping,
      onAnnotationChange,
      onAnnotationsChange,
      onAnnotationRemove,
      onAnnotationsRemove,
      onAnnotationClear,
      orderVisible,
      preAnnotationsWithGlobal: preAnnotations,
      onOrderVisibleChange,
    }),
    [
      annotationsWithGlobal,
      sortedImageAnnotations,
      selectedAnnotation,
      annotationsMapping,
      onAnnotationChange,
      onAnnotationsChange,
      onAnnotationRemove,
      onAnnotationsRemove,
      onAnnotationClear,
      orderVisible,
      preAnnotations,
      onOrderVisibleChange,
    ],
  );

  const toolContextValue = useMemo(
    () => ({
      engine: engine!,
      currentTool,
      config,
      selectedLabel,
      requestEdit,
      onLabelChange,
      tools,
      globalToolConfig,
      labelMapping: labelMappingByTool,
      preLabelMapping: preLabelsMappingByTool,
      labels,
    }),
    [
      engine,
      currentTool,
      config,
      selectedLabel,
      requestEdit,
      onLabelChange,
      tools,
      globalToolConfig,
      labelMappingByTool,
      preLabelsMappingByTool,
      labels,
    ],
  );

  const historyContextValue = useMemo(
    () => ({
      redo,
      undo,
      pastRef,
      futureRef,
    }),
    [futureRef, pastRef, redo, undo],
  );

  const sampleContextValue = useMemo(() => {
    return {
      currentSample,
      samples,
      onSampleSelect,
    };
  }, [currentSample, onSampleSelect, samples]);

  const attributeSide = useMemo(() => {
    return typeof renderAttributes === 'function' ? renderAttributes() : <AttributePanel />;
  }, [renderAttributes]);

  return (
    <SampleContext.Provider value={sampleContextValue}>
      <AnnotationContext.Provider value={annotationContextValue}>
        <ToolContext.Provider value={toolContextValue}>
          <HistoryContext.Provider value={historyContextValue}>
            {/* @ts-ignore */}
            <Wrapper style={{ '--color-primary': primaryColor, '--offset-top': `${offsetTop}px` }}>
              <AnnotatorToolbar extra={toolbarExtra} right={toolbarRight} />
              <LabelSection />
              <Content>
                <Sidebar renderSidebar={renderSidebar} />
                <ContentMid>
                  <AnnotationContainer ref={containerRef} />
                  <Footer />
                </ContentMid>
                {attributeSide}
              </Content>
            </Wrapper>
          </HistoryContext.Provider>
        </ToolContext.Provider>
      </AnnotationContext.Provider>
    </SampleContext.Provider>
  );
}

export const Annotator = forwardRef<AnnotatorRef, ImageAnnotatorProps>(ForwardAnnotator);
