import styled, { css } from 'styled-components';
import { rgba } from 'polished';
import type { Attribute, EnumerableAttribute } from '@label-u/annotation';
import { forwardRef, useContext, useImperativeHandle, useMemo, useRef } from 'react';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';

import { parseTime, secondsToMinute } from '@/utils';
import VideoAnnotationContext from '@/context';

import { ReactComponent as VideoFramePin } from '../assets/icons/pin.svg';

export type VideoAnnotationType = 'frame' | 'segment';

export interface VideoAnnotation {
  id: string;
  start?: number;
  end?: number;
  time?: number;
  label: string;
  attributes?: Record<string, string>;
  visible?: boolean;
  type: VideoAnnotationType;
}

const Wrapper = styled.div`
  position: relative;
  height: 3rem;
  background-color: #333333;
  border-top: 1px solid #e6e6e633;
  display: flex;
  align-items: center;
`;

export interface AttributeItemProps {
  annotation: VideoAnnotation;
  attributeConfig: Attribute;
  active?: boolean;
  barWrapperRef: React.RefObject<HTMLDivElement>;
  onClick?: () => void;
}

const AttributeItemWrapper = styled.div<{
  color: string;
  type: VideoAnnotationType;
  position: { start: number; end: number };
  active?: boolean;
}>`
  height: 100%;
  position: absolute;
  font-size: 12px;
  color: #fff;
  z-index: ${({ active }) => (active ? 999 : 2)};
  left: ${({ position }) => `${position.start * 100}%`};
  overflow: hidden;

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
    background-color: ${({ color }) => rgba(color, 0.6)};
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

    ${({ active, color }) =>
      active &&
      css`
        background-color: ${color};
      `}

    &:hover {
      background-color: ${({ color }) => color};
    }

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

export const AttributeItem = forwardRef<HTMLDivElement | null, AttributeItemProps>(
  ({ attributeConfig, active, onClick, barWrapperRef, annotation }, ref) => {
    const { start, end, type, attributes = {}, time } = annotation;
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const { duration, playerRef, onAnnotationChange, selectAnnotation } = useContext(VideoAnnotationContext);

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
      return (
        attributeConfig.attributes?.reduce((acc, cur) => {
          acc[cur.value] = cur;

          const attributeWithOptions = cur as EnumerableAttribute;

          if (cur.type !== 'string') {
            acc[attributeWithOptions.value].optionMapping =
              attributeWithOptions.options?.reduce((acc1, cur2) => {
                acc1[cur2.value] = cur2;
                return acc1;
              }, {} as Record<string, any>) ?? {};
          }
          return acc;
        }, {} as Record<string, any>) ?? {}
      );
    }, [attributeConfig]);

    if (!duration) {
      return null;
    }

    const attributeNodes = Object.keys(attributes).length > 0 && (
      <div className="attribute-list">
        属性：
        {Object.entries(attributes).map(([key, value]) => {
          return (
            <span className="attribute-item" key={key}>
              {currentAttributeMapping[key]?.key ?? 'unknown'}:{' '}
              {currentAttributeMapping[key]?.optionMapping?.[value]?.key ?? value}
            </span>
          );
        })}
      </div>
    );

    if (type === 'frame') {
      const positionPercentage = time! / duration;
      return (
        <AttributeItemWrapper
          color={color}
          onClick={onClick}
          type="frame"
          active={active}
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

    const diff = parseTime(end! - start!);
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
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

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
        onClick={onClick}
        color={color}
        active={active}
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
            <div className="duration">{diff}s</div>
            <div className="attribute-wrap">
              <div className="attribute-text">{attributeConfig.key}</div>
              {attributeNodes}
            </div>
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
  annotations: VideoAnnotation[];
}

export default function AnnotationBar({ annotations }: AnnotationBarProps) {
  const { selectAnnotation, attributeConfigMapping, selectedAnnotation } = useContext(VideoAnnotationContext);
  const barWrapperRef = useRef<HTMLDivElement | null>(null);

  const handleAnnotationClick = (_annotation: VideoAnnotation) => () => {
    selectAnnotation(_annotation);
  };

  return (
    <Wrapper ref={barWrapperRef}>
      {annotations?.map((item) => {
        return (
          <AttributeItem
            onClick={handleAnnotationClick(item)}
            key={item.id}
            barWrapperRef={barWrapperRef}
            active={selectedAnnotation?.id === item.id}
            annotation={item}
            attributeConfig={attributeConfigMapping?.[item.label] ?? {}}
          />
        );
      })}
    </Wrapper>
  );
}
