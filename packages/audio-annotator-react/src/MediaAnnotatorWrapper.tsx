import styled from 'styled-components';
import type { AudioAnnotatorProps } from '@labelu/audio-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type {
  TagAnnotationEntity,
  TextAnnotationEntity,
  VideoAnnotationType,
  Attribute,
  VideoSegmentName,
  VideoFrameName,
  TextAttribute,
  EnumerableAttribute,
  AttributeValue,
  MediaAnnotationInUI,
  MediaAnnotationWithTextAndTag,
  MediaAnnotationType,
  AudioAnnotationType,
  AudioAnnotationInUI,
} from '@labelu/interface';
import type { MediaAnnotatorRef } from '@labelu/components-react';
import { useRedoUndo } from '@labelu/components-react';
import '@labelu/components-react/dist/style.css';
import cloneDeep from 'lodash.clonedeep';

import Sidebar from './Sidebar';
import { AttributePanel } from './AttributePanel';
import { LabelSection } from './LabelSection';
import { AnnotatorToolbar } from './Toolbar';
import { HistoryContext } from './context/history.context';
import { ToolContext } from './context/tool.context';
import type { AnnotationsWithGlobal, MediaAnnotationTypeWithGlobal } from './context/annotation.context';
import { AnnotationContext } from './context/annotation.context';
import type { MediaAnnotatorConfig, MediaSample } from './context/sample.context';
import { SampleContext } from './context/sample.context';

function generateDefaultValues(attributes?: (TextAttribute | EnumerableAttribute)[]) {
  const values: AttributeValue = {};

  attributes?.forEach((item) => {
    const defaultValues = [];

    if ((item as TextAttribute).type === 'string') {
      const stringItem = item as TextAttribute;

      values[stringItem.value] = stringItem.defaultValue || '';
    }

    const tagItem = item as EnumerableAttribute;

    if (Array.isArray(tagItem.options)) {
      for (let i = 0; i < tagItem.options.length; i++) {
        if (tagItem.options[i].isDefault) {
          defaultValues.push(tagItem.options[i].value);
        }
      }
    }

    values[tagItem.value] = defaultValues;
  });

  return values;
}

function convertAnnotationDataToUI(datas: AnnotationsWithGlobal) {
  const result: AnnotationsWithGlobal = {};

  Object.keys(datas).forEach((key) => {
    // @ts-ignore
    result[key as keyof AnnotationsWithGlobal] =
      // @ts-ignore
      datas?.[key as keyof AnnotationsWithGlobal].map((item) => {
        return {
          ...item,
          type: key as MediaAnnotationType,
        };
      }) ?? [];
  });

  return result;
}

const Wrapper = styled.div.attrs((props) => {
  return {
    ...props,
    className: 'labelu-audio-editor',
  };
})`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex-grow: 1;
  background-color: #fff;

  .labelu-audio-wrapper {
    flex: 1;
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
`;

export interface AudioAndVideoAnnotatorRef {
  getAnnotations: () => AnnotationsWithGlobal;
  getSample: () => MediaSample | undefined;
}

export interface MediaPlayerProps {
  src: string;
  /** 播放器高度 */
  playerHeight?: number;
  /** 选中的标注 */
  selectedAnnotation?: AudioAnnotationInUI;
  /** 播放器ref */
  playerRef: React.RefObject<any>;
  /** 标注器ref */
  annotatorRef?: React.RefObject<MediaAnnotatorRef>;
  containerRef: React.RefObject<HTMLDivElement>;
  /** 标注类型 */
  editingType?: AudioAnnotationType;
  /** 是否显示标注顺序 */
  showOrder?: boolean;
  /** 当前选中的标签属性 */
  editingLabel?: string;
  /** 标注列表 */
  annotations: AudioAnnotationInUI[];
  /** 是否禁用 */
  disabled?: boolean;
  /** 标注工具配置 */
  toolConfig?: {
    segment?: Attribute[];
    frame?: Attribute[];
  };
  /** 文件加载完的回调 */
  onLoad?: () => void;
  /**
   * 标注选中的回调
   *
   * @param annotation 选中的标注
   */
  onAnnotationSelect?: (annotation: AudioAnnotationInUI) => void;
  /**
   * 当标注改变时调用的回调
   *
   * @param annotations 标注列表，包含标注的可见性
   */
  onChange?: (annotations: AudioAnnotationInUI) => void;
  /**
   * 当新增标注时的回调
   *
   * @param annotations 标注列表，包含标注的可见性
   */
  onAdd?: (annotations: AudioAnnotationInUI) => void;
  /**
   * 标注结束时的回调
   *
   * @param annotation 标注
   * @param e 事件，需要根据鼠标事件中的位置来控制标签属性表单弹框的显示位置；当通过快捷键结束标注时，e为undefined，此时弹框显示在默认位置。
   */
  onAnnotateEnd?: (annotation: AudioAnnotationInUI, e?: MouseEvent) => void;
}

export interface AnnotatorProps {
  samples: MediaSample[];
  autoPlay?: boolean;
  config?: MediaAnnotatorConfig;
  renderSidebar?: () => React.ReactNode;
  renderAttributes?: () => React.ReactNode;
  editingSample?: MediaSample;

  offsetTop?: number;

  maxHistoryCount?: number;
  primaryColor?: string;
  toolbarExtra?: React.ReactNode;
  toolbarRight?: React.ReactNode;

  preAnnotationLabels?: MediaAnnotatorConfig;

  preAnnotations?: AnnotationsWithGlobal;
}

export interface AnnotatorWrapperProps extends AnnotatorProps {
  children: (args: MediaPlayerProps) => React.ReactNode;
}

function ForwardAnnotator(
  {
    samples: propsSamples,
    renderSidebar,
    config,
    renderAttributes,
    editingSample,
    maxHistoryCount = 20,
    offsetTop = 0,
    primaryColor = '#007aff',
    toolbarExtra,
    toolbarRight,
    preAnnotationLabels,
    preAnnotations,
    children,
  }: AnnotatorWrapperProps,
  ref: React.Ref<AudioAndVideoAnnotatorRef>,
) {
  const [currentSample, setCurrentSample] = useState<MediaSample | undefined>(editingSample);
  const [currentTool, setCurrentTool] = useState<VideoAnnotationType | undefined>();
  const containerRef = useRef<HTMLDivElement>(null);
  const annotatorRef = useRef<MediaAnnotatorRef | null>(null);
  const samples = useMemo(() => propsSamples ?? [], [propsSamples]);
  const selectedIndexRef = useRef<number>(-1);
  const labels = useMemo(() => {
    if (!currentTool) {
      return [];
    }

    return config?.[currentTool] ?? [];
  }, [config, currentTool]);

  const globalToolConfig = useMemo(() => {
    return {
      text: config?.text,
      tag: config?.tag,
    };
  }, [config?.tag, config?.text]);

  const tools = useMemo(() => {
    const result: MediaAnnotationType[] = [];

    (['segment', 'frame'] as const).forEach((tool) => {
      if (config?.[tool]) {
        result.push(tool);
      }
    });

    return result;
  }, [config]);

  const playerRef = useRef<any | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<MediaAnnotationInUI | undefined>();
  const [selectedLabel, setSelectedLabel] = useState<Attribute | undefined>(labels[0]);

  const annotationsFromSample = useMemo(() => {
    return currentSample?.data ?? {};
  }, [currentSample]);

  const labelMappingByTool = useMemo(() => {
    const mapping: Record<string, Record<string, Attribute>> = {};

    Object.keys(config ?? {}).forEach((key) => {
      const _attributes: Attribute[] = config?.[key as VideoSegmentName | VideoFrameName] ?? [];

      mapping[key] = {};
      _attributes.reduce((acc, cur) => {
        acc[cur.value] = cur;
        return acc;
      }, mapping[key]);
    });

    return mapping;
  }, [config]);

  const preLabelsMappingByTool = useMemo(() => {
    const mapping: Record<string, Record<string, Attribute>> = {};

    (['segment', 'frame', 'tag', 'text'] as const).forEach((key) => {
      const _labels: Attribute[] = (preAnnotationLabels?.[key] as unknown as Attribute[]) ?? [];
      mapping[key] = {};
      _labels.reduce((acc, cur) => {
        acc[cur.value] = cur;
        return acc;
      }, mapping[key]);
    });

    return mapping;
  }, [preAnnotationLabels]);

  // ================== tool ==================
  const [orderVisible, setOrderVisible] = useState<boolean>(true);

  const onOrderVisibleChange = useCallback((value: boolean) => {
    setOrderVisible(value);
  }, []);

  const onToolChange = useCallback(
    (tool?: VideoAnnotationType) => {
      setCurrentTool(tool);
      setSelectedAnnotation(undefined);

      // 默认选中第一个标签
      if (tool) {
        const _labels = config?.[tool] ?? [];
        setSelectedLabel(_labels[0]);
      }
    },
    [config],
  );

  // ================== sample state ==================
  const [annotationsWithGlobal, updateAnnotationsWithGlobal, redo, undo, pastRef, futureRef, reset] =
    useRedoUndo<AnnotationsWithGlobal>(convertAnnotationDataToUI(annotationsFromSample), {
      maxHistory: maxHistoryCount,
    });

  // 重置历史记录
  useEffect(() => {
    reset();
  }, [reset, editingSample]);

  // ================== sample ==================

  const onSampleSelect = useCallback(
    (sample: MediaSample) => {
      setCurrentSample(sample);
      setSelectedAnnotation(undefined);
      reset();
    },
    [reset, setCurrentSample],
  );

  useEffect(() => {
    setCurrentSample(editingSample || samples?.[0]);
  }, [editingSample, samples, setCurrentSample]);

  // ================== annotation ==================
  const annotationsMapping = useMemo(() => {
    const mapping: Record<string, MediaAnnotationInUI | TextAnnotationEntity | TagAnnotationEntity> = {};

    if (annotationsFromSample) {
      Object.keys(annotationsFromSample).forEach((toolName) => {
        const _annotations = annotationsFromSample[toolName as MediaAnnotationTypeWithGlobal] ?? [];

        _annotations.forEach((item) => {
          mapping[item.id] = item;
        });
      });
    }

    return mapping;
  }, [annotationsFromSample]);

  const sortedMediaAnnotations = useMemo(() => {
    const _mediaAnnotations = [
      ...(annotationsWithGlobal.segment ?? []),
      ...(annotationsWithGlobal.frame ?? []),
    ] as MediaAnnotationInUI[];

    _mediaAnnotations.sort((a, b) => a.order - b.order);

    return _mediaAnnotations;
  }, [annotationsWithGlobal.frame, annotationsWithGlobal.segment]);

  const onAnnotationsChange = useCallback(
    (_annotations: MediaAnnotationWithTextAndTag[]) => {
      const annotationGroupByTool = {} as Record<string, MediaAnnotationWithTextAndTag[]>;

      _annotations.forEach((item) => {
        if (!annotationGroupByTool[item.type]) {
          annotationGroupByTool[item.type] = [];
        }

        annotationGroupByTool[item.type].push(item);
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

  const onAnnotationChange = useCallback(
    (_annotation: MediaAnnotationInUI) => {
      updateAnnotationsWithGlobal((pre) => {
        return {
          ...pre!,
          [_annotation.type]: pre![_annotation.type]!.map((item) => {
            if (item.id === _annotation.id) {
              return _annotation;
            }
            return item;
          }),
        };
      });
    },
    [updateAnnotationsWithGlobal],
  );

  const onAnnotationAdd = useCallback(
    (_annotation: MediaAnnotationInUI) => {
      updateAnnotationsWithGlobal((pre) => {
        return {
          ...pre!,
          [_annotation.type]: [...(pre![_annotation.type] ?? []), _annotation],
        };
      });

      setSelectedAnnotation(_annotation);
    },
    [updateAnnotationsWithGlobal],
  );

  const onAnnotationRemove = useCallback(
    (_annotation: MediaAnnotationInUI) => {
      if (!_annotation?.type) {
        return;
      }

      updateAnnotationsWithGlobal((pre) => {
        return {
          ...pre!,
          [_annotation.type]: pre![_annotation.type]?.filter((i) => i.id !== _annotation.id) ?? [],
        };
      });
      setSelectedAnnotation(undefined);
    },
    [updateAnnotationsWithGlobal],
  );

  const onAnnotationsRemove = useCallback(
    (_annotations: MediaAnnotationWithTextAndTag[]) => {
      const removedMapping: Record<string, MediaAnnotationWithTextAndTag> = _annotations.reduce((acc, cur) => {
        acc[cur.id] = cur;
        return acc;
      }, {} as Record<string, MediaAnnotationWithTextAndTag>);

      updateAnnotationsWithGlobal((pre) => {
        return {
          ...pre!,
          segment: pre!.segment!.filter((i) => !removedMapping[i.id]),
          frame: pre!.frame!.filter((i) => !removedMapping[i.id]),
        };
      });

      setSelectedAnnotation(undefined);
    },
    [updateAnnotationsWithGlobal],
  );

  const onGlobalAnnotationClear = useCallback(() => {
    updateAnnotationsWithGlobal((pre) => {
      return {
        ...pre!,
        text: [],
        tag: [],
      };
    });
  }, [updateAnnotationsWithGlobal]);

  const onMediaAnnotationClear = useCallback(() => {
    updateAnnotationsWithGlobal((pre) => {
      return {
        ...pre!,
        segment: [],
        frame: [],
      };
    });
  }, [updateAnnotationsWithGlobal]);

  const onAnnotationSelect = useCallback(
    (annotation: MediaAnnotationInUI) => {
      setSelectedAnnotation(annotation);
      setSelectedLabel(labelMappingByTool[annotation.type][annotation.label!]);
      setCurrentTool(annotation.type);
      selectedIndexRef.current = sortedMediaAnnotations.findIndex((item) => item.id === annotation.id);
    },
    [labelMappingByTool, sortedMediaAnnotations],
  );

  const handleAnnotateEnd: AudioAnnotatorProps['onAnnotateEnd'] = useCallback(
    (_annotation: MediaAnnotationInUI, e?: MouseEvent) => {
      // 生成attributes默认值
      const _attributes = labelMappingByTool[_annotation.type][_annotation.label!]?.attributes ?? [];

      const defaultAttributes = generateDefaultValues(_attributes);

      setSelectedAnnotation({
        ..._annotation,
        attributes: defaultAttributes,
      });
      document.dispatchEvent(
        new CustomEvent('annotate-end', {
          detail: {
            annotation: _annotation,
            mouseEvent: e,
          },
        }),
      );
    },
    [labelMappingByTool],
  );

  // ================== label ==================
  const onLabelChange = useCallback(
    (label: Attribute) => {
      if (!selectedAnnotation) {
        return;
      }

      setSelectedLabel(label);

      let newAnnotation = cloneDeep(selectedAnnotation);

      // 正在标注时，应该更新正在标注的片断，而不是当前选中的片断
      const annotatingSegment = annotatorRef.current?.getAnnotatingSegment();

      if (annotatingSegment) {
        annotatorRef.current!.updateAnnotatingSegment({
          ...annotatingSegment,
          label: label.value,
        });

        return;
      }

      // 改变标签时，删除旧的attributes属性
      delete newAnnotation.attributes;

      newAnnotation = {
        ...newAnnotation,
        label: label.value,
      };

      updateAnnotationsWithGlobal((pre) => {
        const annotationGroup = pre?.[newAnnotation.type] ?? [];

        return {
          ...pre!,
          [newAnnotation.type]: annotationGroup.map((item) => {
            if (item.id === selectedAnnotation?.id) {
              return newAnnotation as MediaAnnotationInUI;
            }
            return item;
          }),
        };
      });

      setSelectedAnnotation((pre) => {
        if (!pre) {
          return;
        }

        return {
          ...pre,
          label: label.value,
        };
      });
    },
    [selectedAnnotation, updateAnnotationsWithGlobal],
  );

  // ================== attribute ==================

  const onAttributeChange = useCallback(
    (label: Record<string, string | string[]>) => {
      if (!selectedAnnotation) {
        return;
      }

      let newAnnotation = cloneDeep(selectedAnnotation);

      // 改变标签时，删除旧的attributes属性
      delete newAnnotation.attributes;

      newAnnotation = {
        ...newAnnotation,
        ...label,
      };
      setSelectedAnnotation(() => newAnnotation);

      updateAnnotationsWithGlobal((pre) => {
        const annotationGroup = pre?.[newAnnotation.type] ?? [];
        // TODO: not in annotation mapping.
        return {
          ...pre!,
          [newAnnotation.type]: annotationGroup.map((item) => {
            if (item.id === selectedAnnotation?.id) {
              return newAnnotation as MediaAnnotationInUI;
            }
            return item;
          }),
        };
      });
    },
    [selectedAnnotation, updateAnnotationsWithGlobal],
  );

  // ================== 快捷键 ==================
  // 删除标记
  useHotkeys(
    'delete, backspace',
    () => {
      if (selectedAnnotation) {
        updateAnnotationsWithGlobal((pre) => {
          return {
            ...pre!,
            [selectedAnnotation.type]: pre![selectedAnnotation.type]!.filter((i) => i.id !== selectedAnnotation.id),
          };
        });
      }
    },
    {
      keyup: true,
      keydown: false,
    },
    [selectedAnnotation],
  );

  useHotkeys(
    'escape',
    () => {
      setSelectedAnnotation(undefined);
    },
    {
      preventDefault: true,
    },
    [setSelectedAnnotation],
  );

  // 上一个标记
  useHotkeys(
    'ArrowUp',
    () => {
      selectedIndexRef.current = Math.max(selectedIndexRef.current - 1, 0);
      setSelectedAnnotation((sortedMediaAnnotations as MediaAnnotationInUI[])[selectedIndexRef.current]);
    },
    {
      keyup: true,
      keydown: false,
    },
    [sortedMediaAnnotations],
  );

  // 下一个标记
  useHotkeys(
    'ArrowDown',
    () => {
      selectedIndexRef.current = Math.min(selectedIndexRef.current + 1, sortedMediaAnnotations.length - 1);
      setSelectedAnnotation((sortedMediaAnnotations as MediaAnnotationInUI[])[selectedIndexRef.current]);
    },
    {
      keyup: true,
      keydown: false,
    },
    [sortedMediaAnnotations],
  );

  // 1 ~ 9 设置标签
  useHotkeys(
    '1,2,3,4,5,6,7,8,9',
    (e) => {
      const index = Number(e.key) - 1;
      if (index < labels.length) {
        onLabelChange(labels[index]);

        // 这个newAnnotation不会更新到state中，只用于在标记结束后触发属性编辑框的显示
        const newAnnotation = {
          ...selectedAnnotation,
          label: labels[index].value,
        };

        // 正在标注时变更标签，应该更新正在标注的片断
        if (playerRef.current && newAnnotation && !annotatorRef.current?.getAnnotatingSegment()) {
          document.dispatchEvent(
            new CustomEvent('annotate-end', {
              detail: {
                annotation: newAnnotation,
              },
            }),
          );
        }
      }
    },
    [onLabelChange, labels, selectedAnnotation],
  );

  const playerInstance = useMemo(() => {
    return {
      getCurrentTime: () => playerRef.current?.getCurrentTime(),
      setCurrentTime: (time: number) => playerRef.current?.setTime(time),
      getDuration: () => playerRef.current?.getDuration(),
      play: () => playerRef.current?.play(),
      pause: () => playerRef.current?.pause(),
    };
  }, []);

  useImperativeHandle(ref, () => ({
    getAnnotations: () => {
      return Object.keys(annotationsWithGlobal).reduce((acc, cur) => {
        const toolName = cur as MediaAnnotationType;

        acc[toolName] = annotationsWithGlobal[toolName]?.map((item) => {
          // omit visible
          // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
          const { visible, ...rest } = item;

          return rest;
        });
        return acc;
      }, {} as AnnotationsWithGlobal);
    },
    getSample: () => currentSample,
  }));

  const attributeSide = useMemo(() => {
    return typeof renderAttributes === 'function' ? renderAttributes() : <AttributePanel />;
  }, [renderAttributes]);

  const toolConfig = useMemo(
    () => ({
      segment: config?.segment ?? ([] as Attribute[]),
      frame: config?.frame ?? ([] as Attribute[]),
    }),
    [config?.frame, config?.segment],
  );

  const onMediaLoad = useCallback(() => {
    annotatorRef.current?.updateTime(0);
    playerRef.current?.setTime(0);
  }, []);

  const annotationContextValue = useMemo(
    () => ({
      annotationsWithGlobal,
      sortedMediaAnnotations,
      selectedAnnotation,
      allAnnotationsMapping: annotationsMapping,
      onAnnotationsChange,
      onAnnotationChange,
      onGlobalAnnotationClear,
      onMediaAnnotationClear,
      orderVisible,
      onAnnotationSelect,
      onAnnotationRemove,
      onAnnotationAdd,
      onAnnotationsRemove,
      preAnnotationsWithGlobal: preAnnotations,
      onOrderVisibleChange,
    }),
    [
      annotationsWithGlobal,
      sortedMediaAnnotations,
      selectedAnnotation,
      annotationsMapping,
      onAnnotationsChange,
      onAnnotationSelect,
      onAnnotationChange,
      onGlobalAnnotationClear,
      onMediaAnnotationClear,
      orderVisible,
      onAnnotationRemove,
      onAnnotationAdd,
      onAnnotationsRemove,
      preAnnotations,
      onOrderVisibleChange,
    ],
  );

  const toolContextValue = useMemo(() => {
    return {
      player: playerInstance,
      currentTool,
      selectedLabel,
      onLabelChange,
      onToolChange,
      onAttributeChange,
      labelMapping: labelMappingByTool,
      containerRef,
      globalToolConfig,
      config,
      tools,
      labels,
      preLabelMapping: preLabelsMappingByTool,
    };
  }, [
    playerInstance,
    currentTool,
    selectedLabel,
    onLabelChange,
    onToolChange,
    onAttributeChange,
    labelMappingByTool,
    globalToolConfig,
    config,
    tools,
    labels,
    preLabelsMappingByTool,
  ]);

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
                {currentSample ? (
                  children({
                    playerRef,
                    annotatorRef,
                    containerRef,
                    editingLabel: selectedLabel?.value ?? 'noneAttribute',
                    src: currentSample.url,
                    editingType: currentTool,
                    selectedAnnotation,
                    annotations: sortedMediaAnnotations as unknown as MediaAnnotationInUI[],
                    toolConfig,
                    onChange: onAnnotationChange,
                    onAdd: onAnnotationAdd,
                    showOrder: orderVisible,
                    onLoad: onMediaLoad,
                    onAnnotateEnd: handleAnnotateEnd,
                    onAnnotationSelect: onAnnotationSelect,
                  })
                ) : (
                  // TODO: empty
                  <div>empty</div>
                )}
                {attributeSide}
              </Content>
            </Wrapper>
          </HistoryContext.Provider>
        </ToolContext.Provider>
      </AnnotationContext.Provider>
    </SampleContext.Provider>
  );
}

export const MediaAnnotatorWrapper = forwardRef<AudioAndVideoAnnotatorRef, AnnotatorWrapperProps>(ForwardAnnotator);