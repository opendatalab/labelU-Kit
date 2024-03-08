import type { MediaAnnotationData, MediaAnnotationInUI, MediaAnnotationType, MediaSegment } from '@labelu/interface';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { scheduleAnnotationTrack, throttle, uid } from '../utils';
import { useMediaAnnotator } from './context';
import { AnnotationTrack } from './AnnotationTrack';
import { AnnotationItem } from './AnnotationBar';
import { ActivityBar, BarWrapper, ExpandIconElem, ExpandTrigger, PlayerFrame, TrackWrapper } from './style';

export interface MediaAnnotatorProps {
  annotations: MediaAnnotationInUI[];
  disabled?: boolean;
  type?: MediaAnnotationType;
  onEnd?: (annotation: MediaAnnotationData, e?: MouseEvent) => void;
  duration: number;
  label?: string;
  updateCurrentTime: (time: number) => void;
  getCurrentTime: () => number;
}

export type EditType = 'create' | 'update' | 'delete';

export interface MediaAnnotatorRef {
  reset: () => void;
  updateTime: (time: number) => void;
  playing: (time: number) => void;
  scrollToAnnotation: (annotation: MediaAnnotationData) => void;
  getAnnotatingSegment: () => MediaSegment | null;
  updateAnnotatingSegment: (segment: MediaSegment) => void;
}

export const MediaAnnotator = forwardRef<MediaAnnotatorRef, MediaAnnotatorProps>(function ForwardRefAnnotator(
  { disabled, type, duration, onEnd, label = '', updateCurrentTime, getCurrentTime, ...rest },
  ref,
) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [annotatingSegment, setAnnotatingSegment] = useState<MediaSegment | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const currentTimeRef = useRef<number>(0);
  const activityBarRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  // 记录是否正在设置当前时间
  const isSettingCurrentTimeRef = useRef<boolean>(false);
  const editingElementRef = useRef<HTMLDivElement | null>(null);
  const annotations = useMemo(() => rest.annotations || [], [rest.annotations]);
  const { attributeConfigMapping } = useMediaAnnotator();
  const editingSegmentAnnotationRef = useRef<MediaSegment | null>(null);
  const throttledUpdater = useRef<React.Dispatch<React.SetStateAction<MediaSegment | null>>>(
    throttle(setAnnotatingSegment, 100),
  );

  const tracks = useMemo(() => scheduleAnnotationTrack(annotations), [annotations]);
  const maxOrder = useMemo(() => {
    let order = 0;

    if (!annotations.length) {
      return 0;
    }

    annotations.forEach((item) => {
      order = Math.max(order, item.order);
    });

    return order;
  }, [annotations]);

  const resetAnnotatingSegment = useCallback(() => {
    setAnnotatingSegment(null);
    editingSegmentAnnotationRef.current = null;
  }, []);

  const handleExpandTriggerClick = () => {
    setExpanded((prev) => !prev);
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
    const currentTime = (offsetX / rect.width) * duration;

    if (disabled) {
      return;
    }

    if (typeof updateCurrentTime === 'function') {
      updateCurrentTime(currentTime);
    }

    if (frame) {
      frame.style.left = `${(offsetX / rect.width) * 100}%`;
    }

    if (isSettingCurrentTimeRef.current && editingSegmentAnnotationRef.current && editingElementRef.current) {
      editingElementRef.current.style.width = `${
        ((currentTime - editingSegmentAnnotationRef.current.start!) / duration) * 100
      }%`;
      throttledUpdater.current((pre) =>
        pre
          ? {
              ...pre!,
              end: currentTime,
            }
          : pre,
      );
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mousemove', handleMouseMove);

    if (!activityBarRef.current) {
      return;
    }

    const rect = activityBarRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;

    isSettingCurrentTimeRef.current = false;

    if (disabled) {
      return;
    }

    // 一次拖动结束，如果是标记片断，且拖动距离大于0.2s，则认为是结束标注
    if (
      editingSegmentAnnotationRef.current &&
      (offsetX * duration) / rect.width - editingSegmentAnnotationRef.current.start! > 0.2
    ) {
      onEnd?.(
        {
          ...editingSegmentAnnotationRef.current,
          end: offsetX > rect.width ? duration : getCurrentTime(),
        },
        e,
      );
      resetAnnotatingSegment();
    }

    if (type === 'frame') {
      onEnd?.({
        id: uid(),
        type: 'frame',
        time: (offsetX / rect.width) * duration,
        label,
        order: maxOrder + 1,
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const frame = frameRef.current;
    const currentTime = (offsetX / rect.width) * duration;

    if (typeof updateCurrentTime === 'function') {
      updateCurrentTime(currentTime);
    }

    if (frame) {
      frame.style.left = `${(offsetX / rect.width) * 100}%`;
      isSettingCurrentTimeRef.current = true;

      if (disabled) {
        return;
      }

      if (type === 'segment') {
        if (
          editingSegmentAnnotationRef.current &&
          (offsetX * duration) / rect.width > editingSegmentAnnotationRef.current.start!
        ) {
          // 两次点击时，第二次点击的时间点大于第一次点击的时间点，此时认为是结束标注
          onEnd?.(
            {
              ...editingSegmentAnnotationRef.current,
              end: currentTime,
            },
            e.nativeEvent,
          );
          resetAnnotatingSegment();
        } else {
          const newAnnotation = {
            id: uid(),
            type: 'segment',
            start: currentTime,
            end: currentTime,
            order: maxOrder + 1,
            label,
          } as MediaSegment;
          editingSegmentAnnotationRef.current = newAnnotation;
          setAnnotatingSegment(newAnnotation);
        }
      }
    }

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
  };

  // 标记片断
  useHotkeys(
    'x',
    () => {
      const currentTime = currentTimeRef.current;

      if (editingSegmentAnnotationRef.current) {
        if (currentTime > editingSegmentAnnotationRef.current.start!) {
          onEnd?.({
            ...editingSegmentAnnotationRef.current,
            end: currentTime,
          });
          resetAnnotatingSegment();
        }
      } else if (currentTime < duration) {
        const newAnnotation = {
          id: uid(),
          type: 'segment',
          start: currentTime,
          end: currentTime,
          order: maxOrder + 1,
          label,
        } as MediaSegment;
        editingSegmentAnnotationRef.current = newAnnotation;
        setAnnotatingSegment(newAnnotation);
      }
    },
    {
      preventDefault: true,
      enabled: type === 'segment' && duration > 0,
    },
    [setAnnotatingSegment, onEnd, label, maxOrder, type, resetAnnotatingSegment, duration],
  );

  // 标记时间戳
  useHotkeys(
    'e',
    () => {
      onEnd?.({
        id: uid(),
        type: 'frame',
        time: currentTimeRef.current,
        label,
        order: maxOrder + 1,
      });
      resetAnnotatingSegment();
    },
    {
      preventDefault: true,
      enabled: type === 'frame',
    },
    [onEnd, label, maxOrder, type, resetAnnotatingSegment],
  );

  useHotkeys('escape', resetAnnotatingSegment, [resetAnnotatingSegment]);

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        resetAnnotatingSegment();
      },
      updateTime: (time) => {
        if (frameRef.current) {
          frameRef.current.style.left = `${(time / duration) * 100}%`;
        }
      },
      scrollToAnnotation: (annotation: MediaAnnotationData) => {
        // 滚动到当前轨道
        setTimeout(() => {
          if (!trackRef.current || !activityBarRef.current) {
            return;
          }

          const newAnnotations = [];
          let isExist = false;

          annotations.forEach((item) => {
            if (item.id === annotation.id) {
              isExist = true;
              newAnnotations.push({
                ...item,
                ...annotation,
              });
            } else {
              newAnnotations.push(item);
            }
          });

          if (!isExist) {
            newAnnotations.push(annotation);
          }

          const newTracks = scheduleAnnotationTrack(newAnnotations);
          const trackIndex = newTracks.findIndex((track) =>
            (track as MediaAnnotationInUI[]).find((item: MediaAnnotationInUI) => item.id === annotation.id),
          );

          trackRef.current.scrollTop = trackIndex * activityBarRef.current.clientHeight;
        });
      },
      playing: (time) => {
        currentTimeRef.current = time;

        if (frameRef.current) {
          frameRef.current.style.left = `${(time / duration) * 100}%`;
        }

        if (annotatingSegment && editingElementRef.current) {
          editingElementRef.current.style.width = `${((time - annotatingSegment.start!) / duration) * 100}%`;

          if (type === 'segment') {
            throttledUpdater.current((pre) =>
              pre
                ? {
                    ...pre!,
                    end: time,
                  }
                : pre,
            );

            // 播放结束时但没有标注结束时间点
            if (time === duration && !annotations.find((item) => item.id === annotatingSegment.id)) {
              isSettingCurrentTimeRef.current = false;
              onEnd?.({
                ...annotatingSegment,
                end: duration,
              });
            }
          }
        }
      },
      // 上层组件可以通过该方法判断是否正在标注
      getAnnotatingSegment: () => editingSegmentAnnotationRef.current,
      // 上层组件可以通过该方法更新正在标注的片断，比如：上层修改了标签，需要更新正在标注的片断
      updateAnnotatingSegment: (segment: MediaSegment) => {
        if (!segment) {
          return;
        }

        setAnnotatingSegment(() => {
          editingSegmentAnnotationRef.current = {
            ...editingSegmentAnnotationRef.current,
            ...segment,
          };

          return editingSegmentAnnotationRef.current;
        });
      },
    }),
    [resetAnnotatingSegment, annotations, annotatingSegment, duration, type, onEnd],
  );

  return (
    <BarWrapper expanded={expanded}>
      <TrackWrapper ref={trackRef} expanded={expanded}>
        {tracks.map((track, index) => (
          <AnnotationTrack key={index} annotations={track} />
        ))}
      </TrackWrapper>
      {tracks.length > 1 && (
        <ExpandTrigger expanded={expanded} onClick={handleExpandTriggerClick}>
          <ExpandIconElem />
        </ExpandTrigger>
      )}
      <div>
        <ActivityBar editingType={disabled ? undefined : type} onMouseDown={handleMouseDown} ref={activityBarRef}>
          {annotatingSegment && (
            <AnnotationItem
              isNew
              ref={editingElementRef}
              barWrapperRef={activityBarRef}
              key={annotatingSegment.id}
              annotation={annotatingSegment}
              attributeConfig={attributeConfigMapping?.[annotatingSegment.type]?.[annotatingSegment.label] ?? {}}
            />
          )}
        </ActivityBar>
        <PlayerFrame ref={frameRef} />
      </div>
    </BarWrapper>
  );
});
