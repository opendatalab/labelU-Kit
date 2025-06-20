import type { Attribute, MediaAnnotationData, MediaFrame, MediaSegment } from '@labelu/interface';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@labelu/i18n';

import { parseTime, secondsToMinute } from '../../utils';
import { Tooltip } from '../../Tooltip';
import { ReactComponent as VideoFramePin } from '../pin.svg';
import { useMediaAnnotator } from '../context';
import {
  AnnotationAttribute,
  AnnotationContent,
  AttributeItemWrapper,
  AttributeList,
  AttributeListItem,
  AttributeText,
  AttributeWrap,
  AttributesInner,
  InnerFrame,
  InnerSegmentBar,
  LabelTextWrapper,
  Order,
  OrderWrapper,
  ResizeBar,
  TooltipFrameContent,
  TooltipSegmentContent,
} from './style';

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

export const AnnotationItem = forwardRef<HTMLDivElement | null, AttributeItemProps>(
  ({ attributeConfig, active, onContextMenu, barWrapperRef, annotation, visible, isNew }, ref) => {
    const { type, attributes = {}, order } = annotation;
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const {
      duration,
      getCurrentTime,
      setCurrentTime,
      onAnnotationChange,
      showOrder,
      attributeConfigMapping,
      requestEdit,
      disabled,
    } = useMediaAnnotator();
    const [currentAnnotation, setCurrentAnnotation] = useState<MediaSegment>(annotation as MediaSegment);
    // @ts-ignore
    const { t } = useTranslation();

    useEffect(() => {
      setCurrentAnnotation(annotation as MediaSegment);
    }, [annotation]);

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
                  <div>
                    {t('label')}: {attributeConfig.key}
                  </div>
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

      if (
        disabled &&
        !requestEdit?.('update', {
          toolName: 'segment',
          label: annotation.label,
        })
      ) {
        return;
      }

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
          setCurrentAnnotation((pre) => ({
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
          setCurrentAnnotation((pre) => ({
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

      if (
        disabled ||
        !requestEdit?.('update', {
          toolName: 'segment',
          label: annotation.label,
        })
      ) {
        return;
      }

      // const diffX = e.clientX - startPositionRef.current.x;

      if (startPositionRef.current.direction === 'left') {
        onAnnotationChange?.({
          ...currentAnnotation,
          start: getCurrentTime() ?? 0,
        });
      } else {
        onAnnotationChange?.({
          ...currentAnnotation,
          end: getCurrentTime() ?? 0,
        });
      }
    };

    const handleMouseDown = (_direction: 'left' | 'right') => (e: React.MouseEvent) => {
      if (
        !wrapperRef.current ||
        disabled ||
        !requestEdit?.('update', {
          toolName: 'segment',
          label: annotation.label,
        })
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const wrapperStyle = getComputedStyle(wrapperRef.current);
      const time = _direction === 'left' ? currentAnnotation.start : currentAnnotation.end;
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
                {secondsToMinute(start!)} ~ {secondsToMinute(end!)}, {diff}s
                <div>
                  {t('label')}: {attributeConfig.key}
                </div>
              </LabelTextWrapper>
              <AttributesInner>{attributeNodes}</AttributesInner>
            </TooltipSegmentContent>
          }
        >
          <InnerSegmentBar>
            {!isNew && <ResizeBar position="left" ref={resizeHandlerLeftRef} onMouseDown={handleMouseDown('left')} />}
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
            {!isNew && (
              <ResizeBar
                position="right"
                ref={resizeHandlerRightRef}
                onMouseDown={isNew ? undefined : handleMouseDown('right')}
              />
            )}
          </InnerSegmentBar>
        </Tooltip>
      </AttributeItemWrapper>
    );
  },
);
