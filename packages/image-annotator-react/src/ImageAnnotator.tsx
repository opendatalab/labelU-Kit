import styled from 'styled-components';
import { useHotkeys } from 'react-hotkeys-hook';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { Attribute, ILabel, TextAnnotationType, TagAnnotationType } from '@labelu/interface';
import { useRedoUndo } from '@labelu/components-react';
import { TOOL_NAMES } from '@labelu/image';
import type { AnnotationData, ToolName, Annotator as ImageAnnotatorClass } from '@labelu/image';

import Sidebar from './Sidebar';
import { AnnotatorToolbar } from './Toolbar';
import { LabelSection, openAttributeModal } from './LabelSection';
import { AttributePanel } from './AttributePanel';
import type { ImageAnnotatorOptions } from './hooks/useImageAnnotator';
import { useImageAnnotator } from './hooks/useImageAnnotator';
import Footer from './Footer';
import type {
  AnnotationDataInUI,
  AnnotationsWithGlobal,
  GlobalAnnotation,
  GlobalAnnotationPayload,
} from './context/annotation.context';
import { AnnotationContext } from './context/annotation.context';
import type { GlobalToolConfig } from './context/tool.context';
import { ToolContext } from './context/tool.context';
import { HistoryContext } from './context/history.context';
import type { ImageSample } from './context/sample.context';
import { SampleContext } from './context/sample.context';

function addToolNameToAnnotationData(item: AnnotationData, toolName: ToolName) {
  return {
    ...item,
    tool: toolName,
  };
}

function convertAnnotationDataToUI(datas: Record<string, AnnotationData[]>) {
  const result: Record<string, AnnotationDataInUI[]> = {};

  Object.keys(datas).forEach((key) => {
    result[key as ToolName] = datas[key as ToolName].map((item) => {
      return {
        ...item,
        tool: key as ToolName,
      };
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

export interface AnnotatorRef {
  getAnnotations: () => Record<ToolName, AnnotationData[]> | undefined;
  getGlobalAnnotations: () => Record<TextAnnotationType | TagAnnotationType, GlobalAnnotation[]>;
  getSample: () => ImageSample | undefined;

  getEngine: () => ImageAnnotatorClass | null;
}

export interface ImageAnnotatorProps {
  samples?: ImageSample[];
  config?: ImageAnnotatorOptions & Partial<GlobalToolConfig>;
  renderSidebar?: () => React.ReactNode;
  renderAttributes?: () => React.ReactNode;
  editingSample?: ImageSample;

  maxHistoryCount?: number;
  primaryColor?: string;
  toolbarExtra?: React.ReactNode;
  toolbarRight?: React.ReactNode;

  onError?: (error: { type: string; message: string; value?: any }) => void;

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
    onError,
  }: ImageAnnotatorProps,
  ref: React.Ref<AnnotatorRef>,
) {
  // ================== sample ==================
  const [currentSample, setCurrentSample] = useState<ImageSample | undefined>(editingSample);
  const samples = useMemo(() => propsSamples ?? [], [propsSamples]);

  useEffect(() => {
    setCurrentSample(editingSample || samples?.[0]);
  }, [editingSample, samples, setCurrentSample]);

  // ================== tool ==================
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentTool, setCurrentTool] = useState<ToolName | undefined>();

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
    return {
      width: 0,
      height: 0,
      showOrder: true,
      ...config,
      image: {
        url: currentSample?.url ?? '',
        rotate: currentSample?.meta?.rotate ?? 0,
      },
    };
  }, [config, currentSample]);

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
    engine?.on('toolChange', setCurrentTool);

    return () => {
      engine?.off('toolChange', setCurrentTool);
    };
  }, [engine]);

  // ================== annotation ==================
  // ================== label ==================
  const labels = useMemo(() => {
    if (!currentTool) {
      return [];
    }

    return config?.[currentTool]?.labels ?? [];
  }, [config, currentTool]);

  const [selectedLabel, setSelectedLabel] = useState<Attribute | undefined>(labels[0]);
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
            engine?.loadData(key as ToolName, annotationsFromSample[key as ToolName]!);
          }
        });

        engine.switch(tools[0]);
      });
  }, [annotationsFromSample, currentSample, engine, tools]);

  const selectedIndexRef = useRef<number>(-1);

  const onRedoUndo = useCallback(
    (currentAnnotations: AnnotationsWithGlobal) => {
      engine?.clearData();
      const imageAnnotations = currentAnnotations.image;

      Object.keys(imageAnnotations).forEach((tool) => {
        engine?.loadData(tool as ToolName, imageAnnotations[tool as ToolName]);
      });
    },
    [engine],
  );

  const [annotationsWithGlobal, updateAnnotationsWithGlobal, redo, undo, pastRef, futureRef, reset] =
    useRedoUndo<AnnotationsWithGlobal>(
      {
        image: convertAnnotationDataToUI({
          line: annotationsFromSample.line ?? [],
          rect: annotationsFromSample.rect ?? [],
          polygon: annotationsFromSample.polygon ?? [],
          point: annotationsFromSample.point ?? [],
          cuboid: annotationsFromSample.cuboid ?? [],
        }),
        global: {
          text: annotationsFromSample.text ?? [],
          tag: annotationsFromSample.tag ?? [],
        },
      },
      {
        maxHistory: maxHistoryCount,
        onRedo: onRedoUndo,
        onUndo: onRedoUndo,
      },
    );

  const annotationsMapping = useMemo(() => {
    const mapping: Record<string, AnnotationDataInUI> = {};

    Object.keys(annotationsWithGlobal.global).forEach((key) => {
      annotationsWithGlobal.global[key as TextAnnotationType | TagAnnotationType]?.forEach((item) => {
        mapping[item.id] = item as unknown as AnnotationDataInUI;
      });
    });

    Object.keys(annotationsWithGlobal.image).forEach((key) => {
      annotationsWithGlobal.image[key as ToolName]?.forEach((item) => {
        mapping[item.id] = {
          ...item,
          tool: key as ToolName,
        };
      });
    });

    return mapping;
  }, [annotationsWithGlobal.global, annotationsWithGlobal.image]);

  const onGlobalAnnotationChange = useCallback(
    (newGlobalAnnotations: GlobalAnnotationPayload) => {
      updateAnnotationsWithGlobal((pre) => {
        return {
          ...pre!,
          global: {
            ...pre!.global,
            ...newGlobalAnnotations,
          },
        };
      });
    },
    [updateAnnotationsWithGlobal],
  );

  const onGlobalAnnotationClear = useCallback(() => {
    updateAnnotationsWithGlobal((pre) => {
      return {
        ...pre!,
        global: {
          text: [],
          tag: [],
        },
      };
    });
  }, [updateAnnotationsWithGlobal]);

  const sortedImageAnnotations = useMemo(() => {
    const result: AnnotationDataInUI[] = [];

    Object.keys(annotationsWithGlobal.image).forEach((key) => {
      result.push(...annotationsWithGlobal.image[key as ToolName]);
    });

    return result.sort((a, b) => a.order - b.order);
  }, [annotationsWithGlobal.image]);

  const onAnnotationsChange = useCallback(
    (_annotations: AnnotationDataInUI[]) => {
      updateAnnotationsWithGlobal((pre) => {
        const preImageAnnotations = { ...pre!.image };

        _annotations.forEach((item) => {
          preImageAnnotations[item.tool] = preImageAnnotations[item.tool].map((annotation) => {
            if (annotation.id === item.id) {
              return item;
            }

            return annotation;
          });
        });

        return {
          ...pre!,
          image: preImageAnnotations,
        };
      });
    },
    [updateAnnotationsWithGlobal],
  );

  const onImageAnnotationsClear = useCallback(() => {
    updateAnnotationsWithGlobal((pre) => {
      const preImageAnnotations = { ...pre!.image };

      Object.keys(preImageAnnotations).forEach((key) => {
        preImageAnnotations[key as ToolName] = [];
      });

      return {
        ...pre!,
        image: preImageAnnotations,
      };
    });
  }, [updateAnnotationsWithGlobal]);

  const onImageAnnotationChange = useCallback(
    (_annotation: AnnotationDataInUI) => {
      const toolName = _annotation.tool;

      updateAnnotationsWithGlobal((pre) => {
        const preImageAnnotations = { ...pre!.image };
        const toolAnnotations = preImageAnnotations[toolName].map((item) => {
          if (_annotation.id === item.id) {
            return _annotation;
          }

          return item;
        });

        return {
          ...pre!,
          image: {
            ...preImageAnnotations,
            [toolName]: toolAnnotations,
          },
        };
      });
    },
    [updateAnnotationsWithGlobal],
  );

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
      onImageAnnotationChange(newAnnotation);
      selectedIndexRef.current = sortedImageAnnotations.findIndex((item) => item.id === annotation.id);
    };

    engine?.on('select', handleSelectAnnotation);

    return () => {
      engine?.off('select', handleSelectAnnotation);
    };
  }, [engine, onImageAnnotationChange, sortedImageAnnotations]);

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
      const _attributes: Attribute[] = config?.[key]?.labels ?? [];
      mapping[key] = {};
      _attributes.reduce((acc, cur) => {
        acc[cur.value] = cur;
        return acc;
      }, mapping[key]);
    });

    return mapping;
  }, [config]);

  const onLabelChange = useCallback(
    (label: ILabel) => {
      engine?.setLabel(label.value);
      engine?.setAttributes({});
      setSelectedLabel(label);
    },
    [engine],
  );

  // effects
  useEffect(() => {
    const _onAnnotationsChange = () => {
      updateAnnotationsWithGlobal((pre) => {
        return {
          ...pre!,
          image: engine!.getDataByTool(addToolNameToAnnotationData),
        };
      });
    };
    // 添加标记
    engine?.on('add', (annotations: AnnotationData[]) => {
      _onAnnotationsChange();
      setSelectedAnnotation({
        // 默认选中第一个
        ...annotations[0],
        tool: engine.activeToolName!,
      });
    });

    // 删除标记
    engine?.on('delete', (annotation: AnnotationData) => {
      _onAnnotationsChange();
      setSelectedAnnotation((pre) => {
        if (pre?.id === annotation.id) {
          return undefined;
        }

        return pre;
      });
    });

    // 改变标签
    engine?.on('labelChange', (label) => {
      _onAnnotationsChange();
      const _currentLabel = engine.activeTool?.labelMapping?.get(label);
      setSelectedLabel(_currentLabel);
    });

    engine?.on('attributesChange', (annotation: AnnotationData) => {
      setSelectedAnnotation({
        ...annotation,
        tool: engine.activeToolName!,
      });
    });

    // 标记变更，如移动，编辑等
    engine?.on('change', _onAnnotationsChange);
  }, [engine, updateAnnotationsWithGlobal]);

  useEffect(() => {
    if (!onError) {
      return;
    }

    engine?.on('error', onError);

    return () => {
      engine?.off('error', onError);
    };
  }, [engine, onError]);

  // 重置历史记录
  useEffect(() => {
    reset();
  }, [currentSample, reset]);

  useEffect(() => {
    updateAnnotationsWithGlobal({
      image: convertAnnotationDataToUI({
        line: annotationsFromSample.line ?? [],
        rect: annotationsFromSample.rect ?? [],
        polygon: annotationsFromSample.polygon ?? [],
        point: annotationsFromSample.point ?? [],
        cuboid: annotationsFromSample.cuboid ?? [],
      }),
      global: {
        text: annotationsFromSample.text ?? [],
        tag: annotationsFromSample.tag ?? [],
      },
    });
  }, [
    annotationsFromSample.cuboid,
    annotationsFromSample.line,
    annotationsFromSample.point,
    annotationsFromSample.polygon,
    annotationsFromSample.rect,
    annotationsFromSample.tag,
    annotationsFromSample.text,
    updateAnnotationsWithGlobal,
  ]);

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
        return annotationsWithGlobal.image;
      },
      getGlobalAnnotations: () => {
        return annotationsWithGlobal.global;
      },
      getSample: () => currentSample,

      getEngine: () => engine,
    }),
    [annotationsWithGlobal.global, annotationsWithGlobal.image, currentSample, engine],
  );

  const annotationContextValue = useMemo(
    () => ({
      annotationsWithGlobal,
      sortedImageAnnotations,
      selectedAnnotation,
      allAnnotationsMapping: annotationsMapping,
      onImageAnnotationChange,
      onImageAnnotationsChange: onAnnotationsChange,
      onGlobalAnnotationsChange: onGlobalAnnotationChange,
      onGlobalAnnotationClear,
      onImageAnnotationsClear,
      orderVisible,
      onOrderVisibleChange,
    }),
    [
      annotationsMapping,
      onImageAnnotationsClear,
      annotationsWithGlobal,
      onImageAnnotationChange,
      onAnnotationsChange,
      onGlobalAnnotationChange,
      onGlobalAnnotationClear,
      onOrderVisibleChange,
      orderVisible,
      selectedAnnotation,
      sortedImageAnnotations,
    ],
  );

  const toolContextValue = useMemo(
    () => ({
      engine: engine!,
      currentTool,
      config,
      selectedLabel,
      onLabelChange,
      tools,
      globalToolConfig,
      labelMapping: labelMappingByTool,
      labels,
    }),
    [labelMappingByTool, config, currentTool, engine, globalToolConfig, labels, onLabelChange, selectedLabel, tools],
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
