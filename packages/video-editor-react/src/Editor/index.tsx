import styled from 'styled-components';
import Video from '@label-u/video-react';
import type { VideoProps } from '@label-u/video-react';
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
import GlobalStyle from './GlobalStyle';
import Header from './Header';
import Toolbar from './Toolbar';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex-grow: 1;

  --color-primary: #007aff;

  .labelu-video-wrapper {
    flex: 1;
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
`;

export interface EditorRef {
  getAnnotations: () => VideoAnnotationInEditor[];
  nextSample: () => void;
  prevSample: () => void;
}

export interface EditorProps {
  samples: VideoSample[];
  autoPlay?: boolean;
  config?: VideoEditorConfig;
  renderSidebar?: (selectSample: (sample: VideoSample) => void) => React.ReactNode;
  renderAttributes?: () => React.ReactNode;
  editingSample?: VideoSample;
}

function Editor(
  { samples = [], renderSidebar, config, renderAttributes, editingSample }: EditorProps,
  ref: React.Ref<EditorRef>,
) {
  const [currentTool, setCurrentTool] = useState<VideoAnnotationType | undefined>('segment');
  const attributes = useMemo(() => {
    if (!currentTool) {
      return [];
    }

    return config?.[currentTool].attributes ?? [];
  }, [config, currentTool]);
  const videoWrapperRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<VideoAnnotationInEditor | undefined>();
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | undefined>();

  const attributeMappingByTool = useMemo(() => {
    const mapping: Record<string, Record<string, Attribute>> = {};

    Object.keys(config ?? {}).forEach((key) => {
      const _attributes: Attribute[] = config?.[key as VideoSegmentName | VideoFrameName].attributes ?? [];
      mapping[key] = {};
      _attributes.reduce((acc, cur) => {
        acc[cur.value] = cur;
        return acc;
      }, mapping[key]);
    });

    return mapping;
  }, [config]);

  useImperativeHandle(ref, () => ({
    getAnnotations: () => {
      return [];
    },
    nextSample: () => {},
    prevSample: () => {},
  }));

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

  // ================== sample ==================
  const [currentSample, setCurrentSample] = useState<VideoSample | undefined>(editingSample);

  const handleSelectSample = useCallback((sample: VideoSample) => {
    setCurrentSample(sample);
    setSelectedAnnotation(undefined);
  }, []);

  useEffect(() => {
    setCurrentSample(editingSample || samples?.[0]);
  }, [editingSample, samples]);

  useEffect(() => {
    const handleKeyup = (e: KeyboardEvent) => {
      if (!['Delete', 'Backspace'].includes(e.key)) {
        return;
      }

      e.preventDefault();

      if (selectedAnnotation) {
        setCurrentSample((pre) => {
          return {
            ...pre!,
            annotations: pre!.annotations!.filter((i) => i.id !== selectedAnnotation.id),
          };
        });
      }
    };

    document.addEventListener('keyup', handleKeyup);

    return () => {
      document.removeEventListener('keyup', handleKeyup);
    };
  }, [selectedAnnotation]);

  // ================== annotation ==================
  const videoAnnotations = useMemo(() => {
    return (
      currentSample?.annotations?.filter((item) => ['segment', 'frame'].includes(item.type)) ??
      ([] as VideoAnnotationInEditor[])
    );
  }, [currentSample?.annotations]);

  const handleAnnotationsChange = useCallback((_annotations: VideoWithGlobalAnnotation[]) => {
    console.info(JSON.stringify(_annotations, null, 2));
    setCurrentSample((pre) => {
      return {
        ...pre!,
        annotations: _annotations,
      };
    });
  }, []);

  const handleAnnotationChange = useCallback((_annotation: VideoAnnotationInEditor) => {
    setCurrentSample((pre) => {
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
  }, []);

  const handleVideoAnnotationAdd = useCallback((_annotation: VideoAnnotationInEditor) => {
    setCurrentSample((pre) => {
      return {
        ...pre!,
        annotations: [...(pre?.annotations ?? []), _annotation],
      };
    });
    setSelectedAnnotation(_annotation);
  }, []);

  const handleRemoveAnnotation = useCallback((_annotation: VideoAnnotationInEditor) => {
    setCurrentSample((pre) => {
      return {
        ...pre!,
        annotations: pre!.annotations!.filter((i) => i.id !== _annotation.id),
      };
    });
    setSelectedAnnotation(undefined);
  }, []);

  const handleRemoveAnnotations = useCallback((_annotations: VideoWithGlobalAnnotation[]) => {
    setCurrentSample((pre) => {
      return {
        ...pre!,
        annotations: pre!.annotations!.filter((i) => !_annotations.some((j) => j.id === i.id)),
      };
    });
    setSelectedAnnotation(undefined);
  }, []);

  const handleSelectAnnotation = useCallback(
    (annotation: VideoAnnotationInEditor) => {
      setSelectedAnnotation(annotation);
      setSelectedAttribute(attributeMappingByTool[annotation.type][annotation.label!]);
      setCurrentTool(annotation.type);
    },
    [attributeMappingByTool],
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

      setCurrentSample((pre) => {
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
    [selectedAnnotation],
  );

  // ================== attribute ==================
  const handleAttributeChange = useCallback(
    (_attribute: any) => {
      const newAnnotation = {
        ...selectedAnnotation,
        ..._attribute,
      };
      setSelectedAnnotation(() => newAnnotation);
      setCurrentSample((pre) => {
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
    [selectedAnnotation],
  );

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

  const contextValue = useMemo(() => {
    return {
      currentTool,
      samples,
      config,
      currentSample,
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
    };
  }, [
    currentTool,
    samples,
    config,
    currentSample,
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
  ]);

  const sidebar = useMemo(() => {
    return typeof renderSidebar === 'function' ? renderSidebar(handleSelectSample) : <Sidebar />;
  }, [handleSelectSample, renderSidebar]);

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
      <GlobalStyle />
      <Wrapper>
        <Toolbar />
        <Header />
        <Content>
          {sidebar}
          {currentSample ? (
            <Video
              playerRef={playerRef}
              className="labelu-video-wrapper"
              editingLabel={selectedAttribute?.value}
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

const ForwardEditor = forwardRef<EditorRef, EditorProps>(Editor);

export default ForwardEditor;
