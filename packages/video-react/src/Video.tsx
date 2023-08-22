import type { Attribute } from '@label-u/annotation';
import { useCallback, useMemo, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import type { VideoAnnotation, VideoAnnotationType } from './AnnotationBar';
import VideoPlayer from './VideoPlayer';
import AnnotationBar, { AttributeItem } from './AnnotationBar';
import sliceIcon from './assets/icons/cursor-slice.svg';
import frameIcon from './assets/icons/cursor-frame.svg';
import { parseTime, scheduleVideoAnnotationLane, uid } from './utils';
import GlobalStyle from './GlobalStyle';
import VideoAnnotationContext from './context';

const BarWrapper = styled.div`
  position: relative;
  cursor: pointer;
  user-select: none;

  .player-frame {
    left: 0;
    position: absolute;
    height: 100%;
    width: 1px;
    top: 0;
    background-color: #fff;
    z-index: 999;
  }
`;

const ActivityBar = styled.div<{ editingType?: VideoAnnotationType }>`
  position: relative;
  background-color: #333;
  height: 3rem;
  border-top: 1px solid #e6e6e633;
  ${({ editingType }) =>
    editingType === 'segment' &&
    css`
      cursor: url(${sliceIcon}) 10 10, auto;
    `}
  ${({ editingType }) =>
    editingType === 'frame' &&
    css`
      cursor: url(${frameIcon}) 10 10, auto;
    `}
`;

export interface VideoProps {
  src: string;
  annotations: VideoAnnotation[];
  attributes?: Attribute[];
  editingType: VideoAnnotationType;
  editingLabel: string;
  disabled?: boolean;
  onChange?: (annotations: VideoAnnotation[]) => void;
  onAnnotationSelect?: (annotation: VideoAnnotation) => void;
  onAnnotateEnd?: (annotation: VideoAnnotation, e?: MouseEvent) => void;
}

export default function Video({
  src,
  annotations,
  attributes,
  editingType,
  editingLabel,
  onChange,
  onAnnotationSelect,
  onAnnotateEnd,
  disabled,
}: VideoProps) {
  const [duration, setDuration] = useState(0);
  const [selectedAnnotation, setSelectedAnnotation] = useState<VideoAnnotation | null>(null);
  const playerRef = useRef<any>(null);
  const editingElementRef = useRef<HTMLDivElement | null>(null);
  const editingAnnotationRef = useRef<VideoAnnotation | null>(null);
  const activityBarRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const isSettingCurrentTimeRef = useRef<boolean>(false);
  const [editingAnnotation, setEditingAnnotation] = useState<VideoAnnotation | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  const annotationLanes = useMemo(() => scheduleVideoAnnotationLane(annotations), [annotations]);

  const resetEditingAnnotation = useCallback(() => {
    setEditingAnnotation(null);
    editingAnnotationRef.current = null;
  }, []);

  const handlePlayStatusChange = (isPlaying: boolean) => {
    isPlayingRef.current = isPlaying;
  };

  const handlePlaying = () => {
    const frame = frameRef.current;

    if (frame && playerRef.current) {
      const currentTime = playerRef.current.currentTime();
      frame.style.left = `${(currentTime / duration) * 100}%`;

      if (editingAnnotation && editingElementRef.current) {
        editingElementRef.current.style.width = `${((currentTime - editingAnnotation.start!) / duration) * 100}%`;

        // 播放结束时但没有标注结束时间点
        if (
          currentTime === duration &&
          editingType === 'segment' &&
          !annotations.find((item) => item.id === editingAnnotation.id)
        ) {
          isSettingCurrentTimeRef.current = false;

          const newAnnotation = {
            ...editingAnnotation,
            end: duration,
          };

          onChange?.([...annotations, newAnnotation]);
          onAnnotateEnd?.(newAnnotation);
          resetEditingAnnotation();
        }
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSettingCurrentTimeRef.current || !activityBarRef.current) {
      return;
    }

    const rect = activityBarRef.current.getBoundingClientRect();
    const frame = frameRef.current;
    const offsetX = e.clientX - rect.left;

    if (frame && playerRef.current) {
      frame.style.left = `${(offsetX / rect.width) * 100}%`;
      playerRef.current.currentTime((offsetX / rect.width) * duration);
    }

    if (disabled) {
      return;
    }

    if (
      playerRef.current &&
      isSettingCurrentTimeRef.current &&
      editingAnnotationRef.current &&
      editingElementRef.current
    ) {
      if (editingAnnotationRef.current && editingElementRef.current) {
        editingElementRef.current.style.width = `${
          ((playerRef.current.currentTime() - editingAnnotationRef.current.start!) / duration) * 100
        }%`;
      }
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mousemove', handleMouseMove);

    if (!activityBarRef.current) {
      return;
    }

    if (isPlayingRef.current) {
      playerRef.current?.play();
    }

    const rect = activityBarRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;

    isSettingCurrentTimeRef.current = false;

    if (disabled) {
      return;
    }

    if (editingAnnotationRef.current && (offsetX * duration) / rect.width - editingAnnotationRef.current.start! > 0.2) {
      const newAnnotation = {
        ...editingAnnotationRef.current,
        end: parseTime((offsetX / rect.width) * duration),
      };

      onChange?.([...annotations, newAnnotation]);
      onAnnotateEnd?.(newAnnotation, e);
      setSelectedAnnotation(newAnnotation);
      resetEditingAnnotation();
    }

    if (editingType === 'frame') {
      const newAnnotation = {
        id: uid(),
        type: 'frame',
        time: parseTime((offsetX / rect.width) * duration),
        label: editingLabel,
      } as VideoAnnotation;

      onChange?.([...annotations, newAnnotation]);
      onAnnotateEnd?.(newAnnotation, e);
      setSelectedAnnotation(newAnnotation);
      resetEditingAnnotation();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const frame = frameRef.current;

    if (frame && playerRef.current) {
      frame.style.left = `${(offsetX / rect.width) * 100}%`;
      playerRef.current.currentTime((offsetX / rect.width) * duration);
      isSettingCurrentTimeRef.current = true;

      if (disabled) {
        return;
      }

      if (editingType === 'segment') {
        if (editingAnnotationRef.current && (offsetX * duration) / rect.width > editingAnnotationRef.current.start!) {
          const newAnnotation = {
            ...editingAnnotationRef.current,
            end: parseTime((offsetX / rect.width) * duration),
          };

          onChange?.([...annotations, newAnnotation]);
          onAnnotateEnd?.(newAnnotation, e.nativeEvent);
          resetEditingAnnotation();
        } else {
          const newAnnotation = {
            id: uid(),
            type: 'segment',
            start: parseTime((offsetX / rect.width) * duration),
            end: parseTime((offsetX / rect.width) * duration),
            label: editingLabel,
          } as VideoAnnotation;
          editingAnnotationRef.current = newAnnotation;
          setEditingAnnotation(newAnnotation);
        }
      }
    }

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
  };

  const handleAnnotationSelect = useCallback(
    (_annotation: VideoAnnotation) => {
      setSelectedAnnotation(_annotation);
      onAnnotationSelect?.(_annotation);
    },
    [onAnnotationSelect],
  );

  const handleAnnotationChange = useCallback(
    (annotation: VideoAnnotation) => {
      const newAnnotations = annotations.map((item) => {
        if (item.id === annotation.id) {
          return annotation;
        }

        return item;
      });

      onChange?.(newAnnotations);
    },
    [annotations, onChange],
  );

  const attributeConfigMapping = useMemo(
    () =>
      attributes?.reduce((acc, cur) => {
        acc[cur.value] = cur;
        return acc;
      }, {} as Record<string, any>) ?? {},
    [attributes],
  );

  const contextValue = useMemo(() => {
    return {
      editingAnnotation,
      duration,
      playerRef,
      onChange,
      selectedAnnotation,
      selectAnnotation: handleAnnotationSelect,
      onAnnotationChange: handleAnnotationChange,
      attributeConfigMapping,
    };
  }, [
    duration,
    editingAnnotation,
    handleAnnotationChange,
    handleAnnotationSelect,
    onChange,
    selectedAnnotation,
    attributeConfigMapping,
  ]);

  return (
    <VideoAnnotationContext.Provider value={contextValue}>
      <div style={{ width: 800, height: 600, marginLeft: 20 }}>
        <GlobalStyle />
        <VideoPlayer
          src={src}
          ref={playerRef}
          onStatusChange={handlePlayStatusChange}
          onMetaDataLoad={(videoElement) => setDuration(videoElement.duration)}
          onPlaying={handlePlaying}
        >
          <BarWrapper>
            {annotationLanes.map((lane, index) => (
              <AnnotationBar key={index} annotations={lane} />
            ))}
            <ActivityBar
              editingType={disabled ? undefined : editingType}
              onMouseDown={handleMouseDown}
              ref={activityBarRef}
            >
              {editingAnnotation && (
                <AttributeItem
                  ref={editingElementRef}
                  barWrapperRef={activityBarRef}
                  key={editingAnnotation.id}
                  annotation={editingAnnotation}
                  attributeConfig={attributeConfigMapping?.[editingAnnotation.label] ?? {}}
                />
              )}
            </ActivityBar>
            <div ref={frameRef} className="player-frame" />
          </BarWrapper>
        </VideoPlayer>
      </div>
    </VideoAnnotationContext.Provider>
  );
}
