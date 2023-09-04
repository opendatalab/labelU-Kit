import styled from 'styled-components';
import Video from '@label-u/video-react';
import type { VideoProps } from '@label-u/video-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type {
  TagAnnotationEntity,
  TextAnnotationEntity,
  VideoAnnotationType,
  Attribute,
  VideoSegmentName,
  VideoFrameName,
  VideoSegmentToolConfig,
  VideoFrameToolConfig,
} from '@label-u/interface';

import type { VideoAnnotationInEditor, VideoEditorConfig, VideoSample, VideoWithGlobalAnnotation } from './context';
import EditorContext from './context';
import Sidebar from './Sidebar';
import AttributeBar from './Attribute';
import Header from './Header';
import Toolbar from './Toolbar';

const Wrapper = styled.div.attrs((props) => {
  return {
    ...props,
    className: 'labelu-video-editor',
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

export interface EditorRef {
  getAnnotations: () => VideoWithGlobalAnnotation[];
  getSample: () => VideoSample | undefined;
}

export interface EditorProps {
  samples: VideoSample[];
  autoPlay?: boolean;
  config?: VideoEditorConfig;
  renderSidebar?: () => React.ReactNode;
  renderAttributes?: () => React.ReactNode;
  editingSample?: VideoSample;
  maxHistoryCount?: number;
  primaryColor?: string;
  toolbarExtra?: React.ReactNode;
  toolbarRight?: React.ReactNode;
}

function ForwardEditor(
  {
    samples,
    renderSidebar,
    config,
    renderAttributes,
    editingSample,
    maxHistoryCount = 20,
    primaryColor = '#007aff',
    toolbarExtra,
    toolbarRight,
  }: EditorProps,
  ref: React.Ref<EditorRef>,
) {
  const [currentTool, setCurrentTool] = useState<VideoAnnotationType | undefined>('segment');
  const selectedIndexRef = useRef<number>(-1);
  const attributes = useMemo(() => {
    if (!currentTool) {
      return [];
    }

    return config?.[currentTool]?.attributes ?? [];
  }, [config, currentTool]);
  const videoWrapperRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<VideoAnnotationInEditor | undefined>();
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | undefined>();

  const attributeMappingByTool = useMemo(() => {
    const mapping: Record<string, Record<string, Attribute>> = {};

    Object.keys(config ?? {}).forEach((key) => {
      const _attributes: Attribute[] = config?.[key as VideoSegmentName | VideoFrameName]?.attributes ?? [];
      mapping[key] = {};
      _attributes.reduce((acc, cur) => {
        acc[cur.value] = cur;
        return acc;
      }, mapping[key]);
    });

    return mapping;
  }, [config]);

  // ================== tool ==================
  const [orderVisible, setOrderVisible] = useState<boolean>(true);

  const onOrderVisibleChange = useCallback((value: boolean) => {
    setOrderVisible(value);
  }, []);

  const onToolChange = useCallback((tool?: VideoAnnotationType) => {
    setCurrentTool(tool);
    setSelectedAnnotation(undefined);
    setSelectedAttribute(undefined);
  }, []);

  // ================== sample state ==================
  const [currentSample, setCurrentSample] = useState<VideoSample | undefined>(editingSample);
  // ================== redo undo ==================
  const pastRef = useRef<VideoSample[]>([]);
  const futureRef = useRef<VideoSample[]>([]);

  // 重置历史记录
  useEffect(() => {
    pastRef.current = [];
    futureRef.current = [];
  }, [editingSample]);

  const updateCurrentSample = useCallback(
    (_newSample: React.SetStateAction<VideoSample | undefined>) => {
      setCurrentSample((pre) => {
        const newSample = typeof _newSample === 'function' ? _newSample(pre) : _newSample;

        if (pre) {
          pastRef.current = [...pastRef.current, pre].slice(-maxHistoryCount);
        }

        return newSample;
      });

      futureRef.current = [];
    },
    [maxHistoryCount],
  );

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) {
      return;
    }

    const newPresent = pastRef.current[pastRef.current.length - 1];
    const newPast = pastRef.current.slice(0, pastRef.current.length - 1);

    pastRef.current = newPast;
    setCurrentSample(newPresent);
    setSelectedAnnotation(undefined);
    setSelectedAttribute(undefined);
    if (currentSample) {
      futureRef.current = [currentSample, ...futureRef.current];
    }
  }, [currentSample]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) {
      return;
    }

    const newPresent = futureRef.current[0];
    const newFuture = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current!, currentSample!];

    setCurrentSample(newPresent);
    futureRef.current = newFuture;
  }, [currentSample]);

  // ================== sample ==================

  const handleSelectSample = useCallback((sample: VideoSample) => {
    setCurrentSample(sample);
    setSelectedAnnotation(undefined);
    pastRef.current = [];
    futureRef.current = [];
  }, []);

  useEffect(() => {
    updateCurrentSample(editingSample || samples?.[0]);
  }, [editingSample, samples, updateCurrentSample]);

  // ================== annotation ==================
  const videoAnnotations = useMemo(() => {
    const _videoAnnotations = (currentSample?.annotations?.filter((item) => ['segment', 'frame'].includes(item.type)) ??
      []) as VideoAnnotationInEditor[];

    _videoAnnotations.sort((a, b) => a.order - b.order);

    return _videoAnnotations;
  }, [currentSample?.annotations]);

  const handleAnnotationsChange = useCallback(
    (_annotations: VideoWithGlobalAnnotation[]) => {
      console.info(JSON.stringify(_annotations, null, 2));
      updateCurrentSample((pre) => {
        return {
          ...pre!,
          annotations: _annotations,
        };
      });
    },
    [updateCurrentSample],
  );

  const handleAnnotationChange = useCallback(
    (_annotation: VideoAnnotationInEditor) => {
      updateCurrentSample((pre) => {
        const newAnnotations = pre!.annotations!.map((item) => {
          if (item.id === _annotation?.id) {
            return _annotation;
          }
          return item;
        });

        return {
          ...pre!,
          annotations: newAnnotations,
        };
      });
    },
    [updateCurrentSample],
  );

  const handleVideoAnnotationAdd = useCallback(
    (_annotation: VideoAnnotationInEditor) => {
      updateCurrentSample((pre) => {
        return {
          ...pre!,
          annotations: [...(pre?.annotations ?? []), _annotation],
        };
      });
      setSelectedAnnotation(_annotation);
    },
    [updateCurrentSample],
  );

  const handleRemoveAnnotation = useCallback(
    (_annotation: VideoAnnotationInEditor) => {
      updateCurrentSample((pre) => {
        return {
          ...pre!,
          annotations: pre!.annotations!.filter((i) => i.id !== _annotation.id),
        };
      });
      setSelectedAnnotation(undefined);
    },
    [updateCurrentSample],
  );

  const handleRemoveAnnotations = useCallback(
    (_annotations: VideoWithGlobalAnnotation[]) => {
      updateCurrentSample((pre) => {
        return {
          ...pre!,
          annotations: pre!.annotations!.filter((i) => !_annotations.some((j) => j.id === i.id)),
        };
      });
      setSelectedAnnotation(undefined);
    },
    [updateCurrentSample],
  );

  const handleSelectAnnotation = useCallback(
    (annotation: VideoAnnotationInEditor) => {
      setSelectedAnnotation(annotation);
      setSelectedAttribute(attributeMappingByTool[annotation.type][annotation.label!]);
      setCurrentTool(annotation.type);
      selectedIndexRef.current = videoAnnotations.findIndex((item) => item.id === annotation.id);
    },
    [attributeMappingByTool, videoAnnotations],
  );

  const handleAnnotateEnd: VideoProps['onAnnotateEnd'] = useCallback(
    (_annotation: VideoAnnotationInEditor, e?: MouseEvent) => {
      setSelectedAnnotation(_annotation);
      document.dispatchEvent(
        new CustomEvent('annotate-end', {
          detail: {
            annotation: _annotation,
            mouseEvent: e,
          },
        }),
      );

      // 标记结束后暂停播放，填完属性后再播放
      if (playerRef.current && _annotation.label) {
        playerRef.current.pause();
      }
    },
    [],
  );

  // ================== label ==================
  const onLabelChange = useCallback(
    (attribute: Attribute) => {
      setSelectedAttribute(attribute);
      const newAnnotation = {
        ...selectedAnnotation,
        label: attribute.value,
      };

      updateCurrentSample((pre) => {
        const newAnnotations = pre!.annotations!.map((item) => {
          if (item.id === selectedAnnotation?.id) {
            return newAnnotation as VideoAnnotationInEditor;
          }
          return item;
        });

        return {
          ...pre!,
          annotations: newAnnotations,
        };
      });
      setSelectedAnnotation((pre) => {
        if (!pre) {
          return;
        }

        return {
          ...pre,
          label: attribute.value,
        };
      });
    },
    [selectedAnnotation, updateCurrentSample],
  );

  // ================== attribute ==================
  const annotationsMapping = useMemo(() => {
    const mapping: Record<string, VideoAnnotationInEditor | TextAnnotationEntity | TagAnnotationEntity> = {};

    if (currentSample?.annotations) {
      currentSample?.annotations.reduce((acc, cur) => {
        acc[cur.id] = cur;
        return acc;
      }, mapping);
    }

    return mapping;
  }, [currentSample?.annotations]);

  const handleAttributeChange = useCallback(
    (_attribute: any) => {
      const newAnnotation = {
        ...selectedAnnotation,
        ..._attribute,
      };
      setSelectedAnnotation(() => newAnnotation);
      updateCurrentSample((pre) => {
        if (!(newAnnotation.id in annotationsMapping)) {
          return {
            ...pre!,
            annotations: [...(pre?.annotations ?? []), newAnnotation],
          };
        }

        const newAnnotations = pre!.annotations!.map((item) => {
          if (item.id === selectedAnnotation?.id) {
            return newAnnotation as VideoAnnotationInEditor;
          }
          return item;
        });

        return {
          ...pre!,
          annotations: newAnnotations,
        };
      });
    },
    [annotationsMapping, selectedAnnotation, updateCurrentSample],
  );

  // ================== 快捷键 ==================
  // 删除标记
  useHotkeys(
    'delete, backspace',
    () => {
      if (selectedAnnotation) {
        updateCurrentSample((pre) => {
          return {
            ...pre!,
            annotations: pre!.annotations!.filter((i) => i.id !== selectedAnnotation.id),
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
      setSelectedAnnotation((videoAnnotations as VideoAnnotationInEditor[])[selectedIndexRef.current]);
    },
    {
      keyup: true,
      keydown: false,
    },
    [videoAnnotations],
  );

  // 下一个标记
  useHotkeys(
    'ArrowDown',
    () => {
      selectedIndexRef.current = Math.min(selectedIndexRef.current + 1, videoAnnotations.length - 1);
      setSelectedAnnotation((videoAnnotations as VideoAnnotationInEditor[])[selectedIndexRef.current]);
    },
    {
      keyup: true,
      keydown: false,
    },
    [videoAnnotations],
  );

  // 1 ~ 9 设置标签
  useHotkeys(
    '1,2,3,4,5,6,7,8,9',
    (e) => {
      const index = Number(e.key) - 1;
      if (index < attributes.length) {
        onLabelChange(attributes[index]);

        // 这个newAnnotation不会更新到state中，只用于在标记结束后触发属性编辑框的显示
        const newAnnotation = {
          ...selectedAnnotation,
          label: attributes[index].value,
        };

        if (playerRef.current) {
          playerRef.current.pause();

          if (newAnnotation) {
            document.dispatchEvent(
              new CustomEvent('annotate-end', {
                detail: {
                  annotation: newAnnotation,
                },
              }),
            );
          }
        }
      }
    },
    [onLabelChange, attributes, selectedAnnotation],
  );

  useImperativeHandle(ref, () => ({
    getAnnotations: () => {
      return currentSample?.annotations ?? [];
    },
    getSample: () => currentSample,
  }));

  const contextValue = useMemo(() => {
    return {
      currentTool,
      samples,
      config,
      currentSample,
      videoAnnotations,
      orderVisible,
      videoWrapperRef,
      handleSelectSample,
      selectedAttribute,
      onToolChange,
      attributes,
      selectedAnnotation,
      onAnnotationsRemove: handleRemoveAnnotations,
      onAnnotationRemove: handleRemoveAnnotation,
      onAnnotationsChange: handleAnnotationsChange,
      onAnnotationChange: handleAnnotationChange,
      onAttributeChange: handleAttributeChange,
      onAnnotationSelect: handleSelectAnnotation,
      onOrderVisibleChange,
      attributeMapping: attributeMappingByTool,
      annotationsMapping,
      onLabelChange,
      playerRef,
      undo,
      redo,
      pastRef,
      futureRef,
    };
  }, [
    currentTool,
    samples,
    config,
    currentSample,
    videoAnnotations,
    orderVisible,
    handleSelectSample,
    selectedAttribute,
    onToolChange,
    attributes,
    selectedAnnotation,
    handleRemoveAnnotations,
    handleRemoveAnnotation,
    handleAnnotationsChange,
    handleAnnotationChange,
    handleAttributeChange,
    handleSelectAnnotation,
    onOrderVisibleChange,
    attributeMappingByTool,
    annotationsMapping,
    onLabelChange,
    undo,
    redo,
  ]);

  const attributeSide = useMemo(() => {
    return typeof renderAttributes === 'function' ? renderAttributes() : <AttributeBar />;
  }, [renderAttributes]);

  const videoToolConfig = useMemo(
    () => ({
      segment: config?.segment ?? ({} as VideoSegmentToolConfig),
      frame: config?.frame ?? ({} as VideoFrameToolConfig),
    }),
    [config?.frame, config?.segment],
  );

  return (
    <EditorContext.Provider value={contextValue}>
      {/* @ts-ignore */}
      <Wrapper style={{ '--color-primary': primaryColor }}>
        <Toolbar extra={toolbarExtra} right={toolbarRight} />
        <Header />
        <Content>
          <Sidebar renderSidebar={renderSidebar} />
          {currentSample ? (
            <Video
              playerRef={playerRef}
              className="labelu-video-wrapper"
              editingLabel={selectedAttribute?.value ?? 'noneAttribute'}
              src={currentSample.url}
              editingType={currentTool}
              selectedAnnotation={selectedAnnotation}
              annotations={videoAnnotations as unknown as VideoAnnotationInEditor[]}
              toolConfig={videoToolConfig}
              onChange={handleAnnotationChange}
              onAdd={handleVideoAnnotationAdd}
              showOrder={orderVisible}
              onAnnotationSelect={handleSelectAnnotation}
              onAnnotateEnd={handleAnnotateEnd}
              ref={videoWrapperRef}
            />
          ) : (
            <div>empty</div>
          )}
          {attributeSide}
        </Content>
      </Wrapper>
    </EditorContext.Provider>
  );
}

export const Editor = forwardRef<EditorRef, EditorProps>(ForwardEditor);
