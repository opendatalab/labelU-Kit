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
import type { EditType, MediaAnnotatorRef } from '@labelu/components-react';
import { useRedoUndo } from '@labelu/components-react';
import '@labelu/components-react/dist/style.css';
import cloneDeep from 'lodash.clonedeep';

import Sidebar from './Sidebar';
import { AttributePanel } from './AttributePanel';
import { LabelSection, openAttributeModal } from './LabelSection';
import { AnnotatorToolbar } from './Toolbar';
import { HistoryContext } from './context/history.context';
import { ToolContext } from './context/tool.context';
import type {
  AllAnnotationMapping,
  AnnotationsWithGlobal,
  MediaAnnotationTypeWithGlobal,
} from './context/annotation.context';
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
  const result: AllAnnotationMapping = {};

  Object.keys(datas).forEach((key) => {
    const type = key as MediaAnnotationTypeWithGlobal;
    const _annotations = datas[type] ?? [];

    _annotations.forEach((item) => {
      // @ts-ignore
      result[item.id] = {
        ...item,
        type: (item.type as MediaAnnotationTypeWithGlobal) || type,
      };
    });
  });

  return result;
}

function omit<T, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
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

  preAnnotationLabels?: MediaAnnotatorConfig;

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
  /**
   * 编辑前的确认
   */
  requestEdit?: (
    type: EditType,
    payload: {
      toolName: 'segment' | 'frame' | undefined;
      label?: string;
    },
  ) => boolean;
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

  onLabelChange?: (toolName: VideoAnnotationType | undefined, label: Attribute) => void;

  onToolChange?: (tool?: VideoAnnotationType) => void;

  selectedTool?: VideoAnnotationType;

  selectedLabel?: string;

  requestEdit?: (
    type: EditType,
    payload: {
      toolName: 'segment' | 'frame' | undefined;
      label?: string;
    },
  ) => boolean;
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
    onLabelChange: propsOnLabelChange,
    selectedLabel: propsSelectedLabel,
    onToolChange: propsOnToolChange,
    selectedTool: propsSelectedTool,
    preAnnotations,
    requestEdit,
    children,
  }: AnnotatorWrapperProps,
  ref: React.Ref<AudioAndVideoAnnotatorRef>,
) {
  const [currentSample, setCurrentSample] = useState<MediaSample | undefined>(editingSample);
  const [currentTool, setCurrentTool] = useState<VideoAnnotationType | undefined>(propsSelectedTool);

  useEffect(() => {
    setCurrentTool(propsSelectedTool);
  }, [propsSelectedTool]);

  const containerRef = useRef<HTMLDivElement>(null);
  const annotatorRef = useRef<MediaAnnotatorRef | null>(null);
  const samples = useMemo(() => propsSamples ?? [], [propsSamples]);
  const selectedIndexRef = useRef<number>(-1);
  const isSampleDataEmpty = useMemo(() => {
    return Object.values(currentSample?.data ?? {}).every((item) => item.length === 0);
  }, [currentSample]);
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

  const selectedLabelFromProps = useMemo(() => {
    return labels.find((item) => item.value === propsSelectedLabel);
  }, [labels, propsSelectedLabel]);

  const playerRef = useRef<any | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<MediaAnnotationInUI | undefined>();
  const [selectedLabel, setSelectedLabel] = useState<Attribute | undefined>(selectedLabelFromProps ?? labels[0]);

  useEffect(() => {
    setSelectedLabel(selectedLabelFromProps);
  }, [selectedLabelFromProps]);

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
      propsOnToolChange?.(tool);

      // 默认选中第一个标签
      if (tool) {
        const _labels = config?.[tool] ?? [];
        setSelectedLabel(selectedLabelFromProps ?? _labels[0]);
      }
    },
    [config, propsOnToolChange, selectedLabelFromProps],
  );

  const convertedAnnotations = useMemo(() => {
    return convertAnnotationDataToUI(isSampleDataEmpty && preAnnotations ? preAnnotations : annotationsFromSample);
  }, [annotationsFromSample, isSampleDataEmpty, preAnnotations]);

  // ================== sample state ==================
  const [annotationsWithGlobal, updateAnnotationsWithGlobal, redo, undo, pastRef, futureRef, reset] =
    useRedoUndo<AllAnnotationMapping>(convertedAnnotations, {
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

  // sample 切换
  useEffect(() => {
    setCurrentSample(editingSample || samples?.[0]);
    setSelectedAnnotation(undefined);
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
    const _mediaAnnotations = Object.values(annotationsWithGlobal).filter((item) => {
      return item.type === 'segment' || item.type === 'frame';
    }) as MediaAnnotationInUI[];

    _mediaAnnotations.sort((a, b) => a.order - b.order);

    return _mediaAnnotations;
  }, [annotationsWithGlobal]);

  const onAnnotationsChange = useCallback(
    (_annotations: MediaAnnotationWithTextAndTag[]) => {
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

  const onAnnotationChange = useCallback(
    (_annotation: MediaAnnotationInUI) => {
      updateAnnotationsWithGlobal((pre) => {
        return {
          ...pre!,
          [_annotation.id]: _annotation,
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
          [_annotation.id]: _annotation,
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

      updateAnnotationsWithGlobal((pre) => (pre ? omit(pre, _annotation.id) : pre));
      setSelectedAnnotation(undefined);
    },
    [updateAnnotationsWithGlobal],
  );

  const onAnnotationsRemove = useCallback(
    (_annotations: MediaAnnotationWithTextAndTag[]) => {
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

  const onAnnotationClear = useCallback(() => {
    updateAnnotationsWithGlobal(() => {
      return {};
    });
  }, [updateAnnotationsWithGlobal]);

  const onAnnotationSelect = useCallback(
    (annotation: MediaAnnotationInUI) => {
      setSelectedAnnotation(annotation);
      const _label = labelMappingByTool?.[annotation.type]?.[annotation.label!];
      setSelectedLabel(_label);
      propsOnLabelChange?.(currentTool, _label);
      setCurrentTool(annotation.type);
      selectedIndexRef.current = sortedMediaAnnotations.findIndex((item) => item.id === annotation.id);
    },
    [currentTool, labelMappingByTool, propsOnLabelChange, sortedMediaAnnotations],
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

      openAttributeModal({
        labelValue: _annotation.label,
        e,
        labelConfig: labelMappingByTool[_annotation.type][_annotation.label],
      });
    },
    [labelMappingByTool],
  );

  // ================== label ==================
  const onLabelChange = useCallback(
    (label: Attribute) => {
      setSelectedLabel(label);
      propsOnLabelChange?.(currentTool, label);

      if (!selectedAnnotation) {
        return;
      }

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
        return {
          ...pre!,
          [newAnnotation.id]: newAnnotation,
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
    [currentTool, propsOnLabelChange, selectedAnnotation, updateAnnotationsWithGlobal],
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
        return {
          ...pre!,
          [newAnnotation.id]: newAnnotation,
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
          if (pre) {
            return omit(pre, selectedAnnotation.id);
          }

          return pre;
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
          playerRef.current.pause();
          openAttributeModal({
            labelValue: labels[index].value,
            labelConfig: labels[index],
          });
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
      const result: AnnotationsWithGlobal = {};

      // @ts-ignore
      // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
      Object.values(annotationsWithGlobal).forEach(({ type, visible, ...rest }) => {
        if (!result[type]) {
          result[type] = [];
        }

        // @ts-ignore
        result[type]!.push(rest);
      });

      return result;
    },
    getSample: () => currentSample,
  }));

  const attributeSide = useMemo(() => {
    return typeof renderAttributes === 'function' ? renderAttributes() : <AttributePanel />;
  }, [renderAttributes]);

  const toolConfig = useMemo(() => {
    const segmentLabels: Attribute[] = [];
    const frameLabels: Attribute[] = [];

    if (config?.segment) {
      segmentLabels.push(...config.segment);
    }

    if (config?.frame) {
      frameLabels.push(...config.frame);
    }

    if (preAnnotationLabels?.segment) {
      preAnnotationLabels?.segment.forEach((item) => {
        if (!segmentLabels.find((i) => i.value === item.value)) {
          segmentLabels.push(item);
        }
      });
    }

    if (preAnnotationLabels?.frame) {
      preAnnotationLabels?.frame.forEach((item) => {
        if (!frameLabels.find((i) => i.value === item.value)) {
          frameLabels.push(item);
        }
      });
    }

    return {
      segment: segmentLabels,
      frame: frameLabels,
    };
  }, [config?.frame, config?.segment, preAnnotationLabels?.frame, preAnnotationLabels?.segment]);

  const onMediaLoad = useCallback(() => {
    annotatorRef.current.reset();
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
      onAnnotationClear,
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
      onAnnotationChange,
      onAnnotationClear,
      orderVisible,
      onAnnotationSelect,
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
      requestEdit,
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
    requestEdit,
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
                    annotations: sortedMediaAnnotations,
                    requestEdit,
                    preAnnotationLabels,
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
