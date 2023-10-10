import styled, { css } from 'styled-components';
import { darken, rgba } from 'polished';
import type {
  VideoAnnotationData,
  VideoAnnotationType,
  VideoFrameAnnotation,
  Attribute,
  VideoSegmentAnnotation,
  AudioAnnotationData,
  AudioAnnotationType,
  AudioSegmentAnnotation,
  AudioFrameAnnotation,
} from '@label-u/interface';
import { forwardRef, useCallback, useContext, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { parseTime, scheduleAnnotationTrack, secondsToMinute, throttle, uid } from '../utils';
import type { MediaAnnotationInUI } from './context';
import { MediaAnnotationContext, useMediaAnnotator } from './context';
import { Tooltip } from '../Tooltip';
import sliceIcon from './cursor-segment.svg';
import frameIcon from './cursor-frame.svg';
import { ReactComponent as ExpandIcon } from './arrow.svg';
import { ReactComponent as VideoFramePin } from './pin.svg';

const Wrapper = styled.div`
  position: relative;
  box-sizing: border-box;
  height: var(--bar-height);
  background-color: #333333;
  border-top: 1px solid #e6e6e633;
  display: flex;
  align-items: center;
`;

const Order = styled.div``;

const LabelTextWrapper = styled.div`
  max-width: 20em;
  max-height: 12em;
  overflow: auto;
`;

const AttributesInner = styled.div`
  display: flex;
  flex-direction: column;
`;

const AttributeList = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AttributeListItem = styled.span``;

type MediaAnnotationData = VideoAnnotationData | AudioAnnotationData;
type MediaAnnotationType = VideoAnnotationType | AudioAnnotationType;
type MediaSegment = VideoSegmentAnnotation | AudioSegmentAnnotation;
type MediaFrame = VideoFrameAnnotation | AudioFrameAnnotation;

export interface AttributeItemProps {
  /**
   * 是否是正在新建的标注
   */
  isNew?: boolean;
  annotation: MediaAnnotationData;
  attributeConfig: Attribute;
  active?: boolean;
  visible?: boolean;
  barWrapperRef: React.RefObject<HTMLDivElement>;
  onContextMenu?: (e: React.MouseEvent) => void;
}

const InnerSegmentBar = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
  border-radius: 2px;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  height: 100%;
  transition: all 0.2s;
  cursor: pointer;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    height: 60%;
    width: 0.2rem;
    background-color: var(--color);
    display: block;
    transform: translateY(-50%);
    top: 50%;
  }
`;

const InnerFrame = styled.div`
  font-size: 1.25rem;
  transition: all 0.2s;
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;

  &:hover {
    color: var(--color);
  }
`;

const AttributeItemWrapper = styled.div<{
  color: string;
  type: MediaAnnotationType;
  position: { start: number; end: number };
  active?: boolean;
  visible?: boolean;
}>`
  --color: ${({ color }) => color};
  height: 100%;
  position: absolute;
  font-size: 12px;
  color: #fff;
  z-index: ${({ active }) => (active ? 999 : 2)};
  left: ${({ position }) => `${position.start * 100}%`};
  overflow: hidden;
  ${({ visible }) =>
    typeof visible !== 'undefined' &&
    !visible &&
    css`
      display: none;
    `}

  ${({ type, position }) =>
    type === 'segment'
      ? css`
          width: ${() => `${(position.end - position.start) * 100}%`};
        `
      : css`
          transform: translateX(-50%);
        `}

  ${InnerFrame} {
    color: ${({ color }) => rgba(color, 0.6)};

    ${({ active, color }) =>
      active &&
      css`
        color: ${color};
      `}
  }

  ${InnerSegmentBar} {
    &:active {
      background-color: ${({ color }) => darken(0.2, color)};
    }

    &::before {
      background-color: ${({ color }) => color};
    }

    ${({ active, color }) =>
      active
        ? css`
            background-color: ${color};
            &:hover {
              background-color: ${color};
            }
          `
        : css`
            background-color: ${rgba(color, 0.5)};

            &:hover {
              background-color: ${rgba(color, 0.3)};
            }
          `}
  }

  .attribute-wrap {
    display: flex;
    width: 100%;
    gap: 0.5rem;
  }

  .attribute-text {
    flex-shrink: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
`;

const AttributeWrap = styled.div`
  display: flex;
  width: 100%;
  gap: 0.5rem;
`;

const AttributeText = styled.div`
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const ResizeBar = styled.span<{ position: 'left' | 'right' }>`
  position: absolute;
  height: 100%;
  width: 0.2rem;
  cursor: col-resize;

  ${({ position }) =>
    position === 'left'
      ? css`
          left: 0;
        `
      : css`
          right: 0;
        `}
`;

const TooltipSegmentContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  ${AttributeListItem} {
    white-space: normal;
  }

  ${AttributeList} {
    max-width: 20em;
    max-height: 12em;
    overflow: auto;
  }
`;

const TooltipFrameContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${AttributeListItem} {
    white-space: normal;
  }

  ${AttributeList} {
    max-width: 20em;
    max-height: 12em;
    overflow: auto;
  }
`;

const AnnotationContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
`;

const OrderWrapper = styled.span`
  align-items: center;
  justify-content: center;
`;

const AnnotationAttribute = styled.div`
  text-align: left;
  min-width: 0;
`;

export const AttributeItem = forwardRef<HTMLDivElement | null, AttributeItemProps>(
  ({ attributeConfig, active, onContextMenu, barWrapperRef, annotation, visible, isNew }, ref) => {
    const { type, attributes = {}, order } = annotation;
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const { duration, getCurrentTime, setCurrentTime, onAnnotationChange, showOrder, attributeConfigMapping } =
      useMediaAnnotator();
    const [currentAnnotation, setCurrentAnnotation] = useState<MediaSegment>(annotation as MediaSegment);
    const throttledUpdater = useRef<React.Dispatch<React.SetStateAction<MediaAnnotationData | null>>>(
      throttle(setCurrentAnnotation, 100),
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useImperativeHandle(ref, () => wrapperRef.current as HTMLDivElement, [duration]);

    // resize handlers
    const resizeHandlerLeftRef = useRef<HTMLSpanElement | null>(null);
    const resizeHandlerRightRef = useRef<HTMLSpanElement | null>(null);
    const startPositionRef = useRef<{
      x: number;
      left: number;
      width: number;
      direction: 'left' | 'right';
    }>({
      x: 0,
      left: 0,
      width: 0,
      direction: 'left',
    });

    const color = attributeConfig.color;
    const currentAttributeMapping = useMemo(() => {
      // @ts-ignore
      return attributeConfigMapping?.[type]?.[annotation.label]?.attributesMapping ?? {};
    }, [annotation.label, attributeConfigMapping, type]);

    if (!duration) {
      console.warn('duration is not set');
      return null;
    }

    const attributeNodes = Object.keys(attributes).length > 0 && (
      <AttributeList>
        属性：
        {Object.entries(attributes).map(([key, value]) => {
          return (
            <AttributeListItem key={key}>
              {currentAttributeMapping[key]?.key ?? key}:{' '}
              {(Array.isArray(value)
                ? value
                    .map((item) => currentAttributeMapping[key]?.optionMapping?.[item]?.key)
                    .filter((item) => item)
                    .join(', ')
                : currentAttributeMapping[key]?.optionMapping?.[value]?.key) || value}
            </AttributeListItem>
          );
        })}
      </AttributeList>
    );

    if (type === 'frame') {
      const { time } = annotation as MediaFrame;
      const positionPercentage = time! / duration;
      return (
        <AttributeItemWrapper
          color={color || '#666'}
          onContextMenu={onContextMenu}
          type="frame"
          active={active}
          visible={visible}
          position={{ start: positionPercentage, end: positionPercentage }}
        >
          <Tooltip
            placement="top"
            overlay={
              <TooltipFrameContent>
                <Order>{annotation.order}.</Order>
                <AttributesInner>
                  {secondsToMinute(time!)}
                  <div>标签：{attributeConfig.key}</div>
                  {attributeNodes}
                </AttributesInner>
              </TooltipFrameContent>
            }
          >
            <InnerFrame>
              <VideoFramePin />
            </InnerFrame>
          </Tooltip>
        </AttributeItemWrapper>
      );
    }

    const { start, end } = annotation as MediaSegment;
    // 仅编辑中或者新建的标注才实时更新diff时间差
    const diff = isNew
      ? parseTime(annotation.end - annotation.start)
      : parseTime(currentAnnotation.end - currentAnnotation.start);
    const startPositionPercentage = start! / duration;
    const endPositionPercentage = end! / duration;

    const handleMouseMove = (e: MouseEvent) => {
      if (!wrapperRef.current) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const diffX = e.clientX - startPositionRef.current.x;

      if (startPositionRef.current.direction === 'left') {
        const newLeft = startPositionRef.current.left + diffX;

        if (newLeft < 0 || newLeft > startPositionRef.current.left + startPositionRef.current.width) {
          return;
        }

        wrapperRef.current.style.left = `${newLeft}px`;
        wrapperRef.current.style.width = `${startPositionRef.current.width - diffX}px`;

        if (barWrapperRef.current) {
          const currentTime = duration * (newLeft / barWrapperRef.current.clientWidth);
          setCurrentTime(currentTime);
          throttledUpdater.current((pre) => ({
            ...pre!,
            start: currentTime,
          }));
        }
      } else {
        const newRight = startPositionRef.current.left + startPositionRef.current.width + diffX;

        if (newRight < startPositionRef.current.left || newRight > wrapperRef.current.parentElement!.clientWidth) {
          return;
        }

        wrapperRef.current.style.width = `${startPositionRef.current.width + diffX}px`;
        wrapperRef.current.style.right = `${newRight}px`;

        if (barWrapperRef.current) {
          const currentTime = duration * (newRight / barWrapperRef.current.clientWidth);
          setCurrentTime(currentTime);
          throttledUpdater.current((pre) => ({
            ...pre!,
            end: currentTime,
          }));
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      const diffX = e.clientX - startPositionRef.current.x;

      if (diffX === 0) {
        return;
      }

      if (startPositionRef.current.direction === 'left') {
        onAnnotationChange?.({
          ...annotation,
          start: getCurrentTime() ?? 0,
        });
      } else {
        onAnnotationChange?.({
          ...annotation,
          end: getCurrentTime() ?? 0,
        });
      }
    };

    const handleMouseDown = (_direction: 'left' | 'right') => (e: React.MouseEvent) => {
      if (!wrapperRef.current) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const wrapperStyle = getComputedStyle(wrapperRef.current);
      const time = duration * (parseFloat(wrapperStyle.left) / parseFloat(wrapperStyle.width));
      setCurrentTime(time);
      setCurrentAnnotation(annotation);

      startPositionRef.current = {
        x: e.clientX,
        left: parseFloat(wrapperStyle.left),
        width: parseFloat(wrapperStyle.width),
        direction: _direction,
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    return (
      <AttributeItemWrapper
        onContextMenu={onContextMenu}
        color={color || '#666'}
        active={active}
        visible={visible}
        type="segment"
        position={{ start: startPositionPercentage, end: endPositionPercentage }}
        ref={wrapperRef}
      >
        <Tooltip
          placement="top"
          overlay={
            <TooltipSegmentContent>
              <LabelTextWrapper>
                {secondsToMinute(start!)} ~ {secondsToMinute(end!)}，{diff}s<div>标签：{attributeConfig.key}</div>
              </LabelTextWrapper>
              <AttributesInner>{attributeNodes}</AttributesInner>
            </TooltipSegmentContent>
          }
        >
          <InnerSegmentBar>
            <ResizeBar position="left" ref={resizeHandlerLeftRef} onMouseDown={handleMouseDown('left')} />
            <AnnotationContent>
              {showOrder && <OrderWrapper>{order}.</OrderWrapper>}
              <AnnotationAttribute>
                <div className="duration">{diff}s</div>
                <AttributeWrap>
                  <AttributeText>{attributeConfig.key}</AttributeText>
                  {attributeNodes}
                </AttributeWrap>
              </AnnotationAttribute>
            </AnnotationContent>
            <ResizeBar position="right" ref={resizeHandlerRightRef} onMouseDown={handleMouseDown('right')} />
          </InnerSegmentBar>
        </Tooltip>
      </AttributeItemWrapper>
    );
  },
);

export interface AnnotationTrackProps {
  annotations: MediaAnnotationInUI[];
}

export function AnnotationTrack({ annotations }: AnnotationTrackProps) {
  const { selectAnnotation, attributeConfigMapping, selectedAnnotation, playingAnnotationIds } =
    useContext(MediaAnnotationContext);
  const barWrapperRef = useRef<HTMLDivElement | null>(null);

  const handleAnnotationClick = (_annotation: MediaAnnotationData) => (e: React.MouseEvent) => {
    e.preventDefault();
    selectAnnotation(_annotation);
  };

  return (
    <Wrapper ref={barWrapperRef}>
      {annotations?.map((item) => {
        return (
          <AttributeItem
            onContextMenu={handleAnnotationClick(item)}
            key={item.id}
            barWrapperRef={barWrapperRef}
            visible={item.visible}
            active={selectedAnnotation?.id === item.id || playingAnnotationIds?.includes(item.id)}
            annotation={item}
            attributeConfig={attributeConfigMapping[item.type][item.label] ?? {}}
          />
        );
      })}
    </Wrapper>
  );
}

const TrackWrapper = styled.div<{ expanded: boolean }>`
  max-height: var(--bar-height);
  ${({ expanded }) =>
    expanded &&
    css`
      max-height: calc(5 * var(--bar-height));
    `}
  overflow-y: auto;
  overflow-x: hidden;
`;

const PlayerFrame = styled.div`
  left: 0;
  position: absolute;
  height: 100%;
  width: 1px;
  top: 0;
  background-color: #fff;
  z-index: 999;
`;

const ActivityBar = styled.div<{ editingType?: MediaAnnotationType }>`
  position: relative;
  background-color: #333;
  height: var(--bar-height);
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

const BarWrapper = styled.div<{ expanded?: boolean }>`
  position: relative;
  user-select: none;
  --bar-height: 2.5rem;

  ${TrackWrapper} {
    max-height: var(--bar-height);
    ${({ expanded }) =>
      expanded &&
      css`
        max-height: calc(5 * var(--bar-height));
      `}
    overflow-y: auto;
    overflow-x: hidden;
  }
`;

const ExpandIconElem = styled(ExpandIcon)``;

const ExpandTrigger = styled.div<{ expanded: boolean }>`
  cursor: pointer;
  position: absolute;
  height: 1rem;
  width: 2rem;
  z-index: 2;
  font-size: 12px;
  top: -1rem;
  border-radius: 2px 2px 0 0;
  background-color: #333;
  color: #999;
  border: solid 1px rgb(86 86 86);
  left: 50%;
  border-bottom: 0;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;

  ${ExpandIconElem} {
    transform: rotate(${({ expanded }) => (expanded ? '0' : '180deg')});
  }
`;

export interface TrackAnnotationProps {
  annotations: MediaAnnotationInUI[];
  disabled?: boolean;
  type?: MediaAnnotationType;
  onEnd?: (annotation: MediaAnnotationData, e?: MouseEvent) => void;
  onAnnotationSelect?: (annotation: MediaAnnotationData) => void;
  duration: number;
  label?: string;
  updateCurrentTime: (time: number) => void;
  getCurrentTime: () => number;
}

export interface MediaAnnotatorRef {
  reset: () => void;
  updateTime: (time: number) => void;
  playing: (time: number) => void;
  scrollToAnnotation: (annotation: MediaAnnotationData) => void;
}

export const MediaAnnotator = forwardRef<MediaAnnotatorRef, TrackAnnotationProps>(function ForwardRefAnnotator(
  { disabled, type, duration, onEnd, label = '', updateCurrentTime, onAnnotationSelect, ...rest },
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
          console.log('b end');
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
          onAnnotationSelect?.(newAnnotation);
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
    },
    {
      preventDefault: true,
      enabled: type === 'segment',
    },
    [setAnnotatingSegment, onEnd, label, maxOrder, type, resetAnnotatingSegment],
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
            <AttributeItem
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
