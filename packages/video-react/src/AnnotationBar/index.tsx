import styled, { css } from 'styled-components';
import { darken, rgba } from 'polished';
import type {
  VideoAnnotationData,
  VideoAnnotationType,
  VideoFrameAnnotation,
  Attribute,
  VideoSegmentAnnotation,
} from '@label-u/interface';
import { forwardRef, useContext, useImperativeHandle, useMemo, useRef } from 'react';
import { Tooltip } from '@label-u/components-react';

import { parseTime, secondsToMinute, throttle } from '@/utils';
import type { VideoAnnotationInUI } from '@/context';
import VideoAnnotationContext from '@/context';

import { ReactComponent as VideoFramePin } from '../assets/icons/pin.svg';

const Wrapper = styled.div`
  position: relative;
  box-sizing: border-box;
  height: var(--bar-height);
  background-color: #333333;
  border-top: 1px solid #e6e6e633;
  display: flex;
  align-items: center;
`;

export interface AttributeItemProps {
  annotation: VideoAnnotationData;
  attributeConfig: Attribute;
  active?: boolean;
  visible?: boolean;
  barWrapperRef: React.RefObject<HTMLDivElement>;
  onContextMenu?: (e: React.MouseEvent) => void;
}

const AttributeItemWrapper = styled.div<{
  color: string;
  type: VideoAnnotationType;
  position: { start: number; end: number };
  active?: boolean;
  visible?: boolean;
}>`
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

  .inner-frame-item {
    font-size: 1.25rem;
    color: ${({ color }) => rgba(color, 0.6)};
    transition: all 0.2s;
    height: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;

    &:hover {
      color: ${({ color }) => color};
    }

    ${({ active, color }) =>
      active &&
      css`
        color: ${color};
      `}
  }

  .inner-segment-item {
    background-color: ${({ color }) => rgba(color, 0.5)};
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

    &:hover {
      background-color: ${({ color }) => rgba(color, 0.3)};
    }

    &:active {
      background-color: ${({ color }) => darken(0.2, color)};
    }

    ${({ active, color }) =>
      active &&
      css`
        background-color: ${color};
        &:hover {
          background-color: ${color};
        }
      `}

    &::before {
      content: '';
      position: absolute;
      left: 0;
      height: 60%;
      width: 0.2rem;
      background-color: ${({ color }) => color};
      display: block;
      transform: translateY(-50%);
      top: 50%;
    }

    .resize-bar {
      position: absolute;
      height: 100%;
      width: 0.2rem;
      cursor: col-resize;
    }

    .resize-bar_left {
      left: 0;
    }

    .resize-bar_right {
      right: 0;
    }
  }

  .attribute-wrap {
    display: flex;
    width: 100%;
  }

  .attribute-text {
    flex-shrink: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .attribute-list {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-left: 0.5rem;
  }

  .attribute-item {
    margin-left: 0.5rem;
  }
`;

const TooltipContent = styled.div`
  .attribute-item {
    margin-left: 0.5rem;
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
  ({ attributeConfig, active, onContextMenu, barWrapperRef, annotation, visible }, ref) => {
    const { type, attributes = {}, order } = annotation;
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const { duration, playerRef, onAnnotationChange, selectAnnotation, showOrder, attributeConfigMapping } =
      useContext(VideoAnnotationContext);

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
      return attributeConfigMapping[type]?.[annotation.label]?.attributesMapping ?? {};
    }, [annotation.label, attributeConfigMapping, type]);

    if (!duration) {
      return null;
    }

    const attributeNodes = Object.keys(attributes).length > 0 && (
      <div className="attribute-list">
        属性：
        {Object.entries(attributes).map(([key, value]) => {
          return (
            <span className="attribute-item" key={key}>
              {currentAttributeMapping[key]?.key ?? key}:{' '}
              {(Array.isArray(value)
                ? value.map((item) => currentAttributeMapping[key]?.optionMapping?.[item]?.key).join(', ')
                : currentAttributeMapping[key]?.optionMapping?.[value]?.key) || value}
            </span>
          );
        })}
      </div>
    );

    if (type === 'frame') {
      const { time } = annotation as VideoFrameAnnotation;
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
            prefixCls="video-annotation-tooltip"
            placement="top"
            overlay={
              <TooltipContent>
                {secondsToMinute(time!)}
                <div>标签：{attributeConfig.key}</div>
                {attributeNodes}
              </TooltipContent>
            }
          >
            <div className="inner-frame-item">
              <VideoFramePin />
            </div>
          </Tooltip>
        </AttributeItemWrapper>
      );
    }

    const { start, end } = annotation as VideoSegmentAnnotation;
    const diff = parseTime(end! - start!);
    const startPositionPercentage = start! / duration;
    const endPositionPercentage = end! / duration;

    const handleMouseMove = throttle((e: MouseEvent) => {
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

        if (playerRef.current && barWrapperRef.current) {
          playerRef.current.currentTime(duration * (newLeft / barWrapperRef.current.clientWidth));
        }
      } else {
        const newRight = startPositionRef.current.left + startPositionRef.current.width + diffX;

        if (newRight < startPositionRef.current.left || newRight > wrapperRef.current.parentElement!.clientWidth) {
          return;
        }

        wrapperRef.current.style.width = `${startPositionRef.current.width + diffX}px`;
        wrapperRef.current.style.right = `${newRight}px`;

        if (playerRef.current && barWrapperRef.current) {
          playerRef.current.currentTime(duration * (newRight / barWrapperRef.current.clientWidth));
        }
      }
    }, 50);

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
          start: playerRef.current?.currentTime() ?? 0,
        });
      } else {
        onAnnotationChange?.({
          ...annotation,
          end: playerRef.current?.currentTime() ?? 0,
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
      playerRef.current.currentTime(duration * (parseFloat(wrapperStyle.left) / parseFloat(wrapperStyle.width)));

      selectAnnotation(annotation);

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
          prefixCls="video-annotation-tooltip"
          placement="top"
          overlay={
            <TooltipContent>
              {secondsToMinute(start!)} ~ {secondsToMinute(end!)}，{diff}s<div>标签：{attributeConfig.key}</div>
              {attributeNodes}
            </TooltipContent>
          }
        >
          <div className="inner-segment-item">
            <span
              className="resize-bar resize-bar_left"
              ref={resizeHandlerLeftRef}
              onMouseDown={handleMouseDown('left')}
            />
            <AnnotationContent>
              {showOrder && <OrderWrapper>{order}.</OrderWrapper>}
              <AnnotationAttribute>
                <div className="duration">{diff}s</div>
                <div className="attribute-wrap">
                  <div className="attribute-text">{attributeConfig.key}</div>
                  {attributeNodes}
                </div>
              </AnnotationAttribute>
            </AnnotationContent>
            <span
              className="resize-bar resize-bar_right"
              ref={resizeHandlerRightRef}
              onMouseDown={handleMouseDown('right')}
            />
          </div>
        </Tooltip>
      </AttributeItemWrapper>
    );
  },
);

export interface AnnotationBarProps {
  annotations: VideoAnnotationInUI[];
}

export default function AnnotationBar({ annotations }: AnnotationBarProps) {
  const { selectAnnotation, attributeConfigMapping, selectedAnnotation, playingAnnotationIds } =
    useContext(VideoAnnotationContext);
  const barWrapperRef = useRef<HTMLDivElement | null>(null);

  const handleAnnotationClick = (_annotation: VideoAnnotationData) => (e: React.MouseEvent) => {
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
