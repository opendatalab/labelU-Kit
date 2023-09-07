import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import type { DraggableModalRef, ValidationContextType } from '@label-u/components-react';
import { DraggableModel, AttributeForm, EllipsisText } from '@label-u/components-react';
import type { VideoAnnotationData, VideoFrameAnnotation, VideoSegmentAnnotation, Attribute } from '@label-u/interface';
import { throttle } from '@label-u/video-react';

import { ReactComponent as MenuOpenIcon } from '@/assets/icons/menu-open.svg';
import { ReactComponent as MenuCloseIcon } from '@/assets/icons/menu-close.svg';

import EditorContext from '../context';

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  background-color: #f8f8f8;
  padding: 0 1rem;
  flex-shrink: 0;
`;

const LABEL_GAP = 8;

const MoreTrigger = styled.div`
  white-space: nowrap;
`;

const TriggerWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
`;

const MoreAttribute = styled.div`
  position: absolute;
  background-color: #fff;
  right: 0;
  display: flex;
  top: 100%;
  z-index: 999;
  padding: 0.5rem;
  box-shadow: 0px 3px 6px 0px rgb(0 0 0 / 21%);
  border-radius: 3px;
  gap: ${LABEL_GAP}px;
`;

const Labels = styled.div`
  position: relative;
  max-width: 70%;
  display: flex;
  align-items: center;
  gap: ${LABEL_GAP}px;
  height: 100%;
  font-size: 14px;
`;

const LabelWrapper = styled.div<{ color: string; active: boolean }>`
  --attribute-color: ${({ color }) => color};
  position: relative;
  white-space: nowrap;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  background-color: ${({ active }) => (active ? `var(--attribute-color)` : '#fff')};
  color: ${({ active }) => (active ? '#fff' : '#333')};
  border-radius: 2px;
  max-width: 8em;
  text-overflow: ellipsis;
  overflow: hidden;
  box-sizing: border-box;

  &:hover {
    color: ${({ active }) => (active ? '#fff' : 'var(--attribute-color)')};
  }

  &:before {
    position: absolute;
    content: '';
    display: block;
    width: 3px;
    height: 60%;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    background-color: ${({ color }) => color};
  }
`;

function LabelItem({
  children,
  attribute,
  active,
  onSelect,
}: React.PropsWithChildren<{
  attribute: Attribute;
  active: boolean;
  onSelect: (attribute: Attribute, e: React.MouseEvent) => void;
}>) {
  const handleClick = (e: React.MouseEvent) => {
    onSelect(attribute, e);
  };

  return (
    <EllipsisText maxWidth={112} title={children}>
      <LabelWrapper active={active} color={attribute.color ?? '#000'} onClick={handleClick}>
        {children as string}
      </LabelWrapper>
    </EllipsisText>
  );
}

export default function Header() {
  const {
    selectedAttribute,
    videoWrapperRef,
    playerRef,
    attributeMapping,
    selectedAnnotation,
    onAttributeChange,
    onLabelChange,
    attributes,
    onAnnotationSelect,
  } = useContext(EditorContext);
  const validationRef = useRef<ValidationContextType | null>(null);
  const dragModalRef = useRef<DraggableModalRef | null>(null);
  const labelsWrapperRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleSelect = (attribute: Attribute, e: React.MouseEvent) => {
    onLabelChange(attribute);

    if (
      !dragModalRef.current ||
      !selectedAnnotation ||
      !attributeMapping[selectedAnnotation.type][attribute.value]?.attributes?.length
    ) {
      return;
    }

    if (playerRef.current) {
      playerRef.current.pause();
    }

    const rect = e.currentTarget.getBoundingClientRect();

    dragModalRef.current.toggleVisibility(true);
    dragModalRef.current.setPosition({
      x: rect.left + 10 + 330,
      y: rect.top + 10 + rect.height,
    });
  };

  useEffect(() => {
    const handleAnnotateEnd = (
      e: CustomEvent<{
        annotation: VideoAnnotationData;
        mouseEvent?: MouseEvent;
      }>,
    ) => {
      const { annotation } = e.detail;

      if (
        !dragModalRef.current ||
        !annotation ||
        !attributeMapping[annotation.type][annotation.label]?.attributes?.length
      ) {
        return;
      }

      dragModalRef.current.toggleVisibility(true);

      if (playerRef.current && videoWrapperRef.current) {
        const duration = playerRef.current.duration();
        const timePercentage =
          ((annotation as VideoSegmentAnnotation).end || (annotation as VideoFrameAnnotation).time || 0) / duration;
        const offset = timePercentage * videoWrapperRef.current.clientWidth;
        dragModalRef.current.setPosition({
          x: offset + 230,
          y: videoWrapperRef.current.clientHeight - 136,
        });
      }

      // 标记结束后暂停播放，填完属性后再播放
      if (playerRef.current) {
        playerRef.current.pause();
      }
      // 打开属性编辑框
    };

    document.addEventListener('annotate-end', handleAnnotateEnd as EventListener);

    return () => {
      document.removeEventListener('annotate-end', handleAnnotateEnd as EventListener);
    };
  }, [attributeMapping, playerRef, videoWrapperRef]);

  useEffect(() => {
    const handleAttributeEdit = (
      e: CustomEvent<{
        annotation: VideoAnnotationData;
        mouseEvent?: MouseEvent;
      }>,
    ) => {
      const { annotation, mouseEvent } = e.detail;

      if (!dragModalRef.current || !annotation || !attributeMapping[annotation.type][annotation.label]) {
        return;
      }

      if (playerRef.current) {
        playerRef.current.pause();
      }

      dragModalRef.current.toggleVisibility(true);

      if (playerRef.current) {
        dragModalRef.current.setPosition({
          x: (mouseEvent?.clientX || 0) - 200,
          y: mouseEvent?.clientY || 0,
        });
      }
      // 打开属性编辑框
    };

    document.addEventListener('annotation-attribute-edit', handleAttributeEdit as EventListener);

    return () => {
      document.removeEventListener('annotation-attribute-edit', handleAttributeEdit as EventListener);
    };
  }, [attributeMapping, onAnnotationSelect, playerRef, videoWrapperRef]);

  const handleModalClose = async () => {
    if (!dragModalRef.current || !validationRef.current) {
      return;
    }

    try {
      await validationRef.current.submit();
    } catch (error) {
      return Promise.reject(error);
    }

    // 关闭属性编辑框后继续播放
    if (playerRef.current) {
      playerRef.current.play();
    }

    dragModalRef.current.toggleVisibility(false);
  };

  const [sliceIndex, setSliceIndex] = React.useState(0);
  const [showMore, setShowMore] = React.useState(false);
  const timerRef = useRef<number | undefined>();

  const handleOnMouseOver = () => {
    clearTimeout(timerRef.current);
    setShowMore(true);
  };
  const handleOnMouseOut = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowMore(false);
    }, 1000) as unknown as number;
  };

  useLayoutEffect(() => {
    const processAttributes = throttle(() => {
      const maxWidth = window.innerWidth - 280;
      if (!labelsWrapperRef.current) {
        return;
      }

      const labelElements = labelsWrapperRef.current.childNodes;

      let totalWidth = 0;
      let index = 0;

      for (let i = 0; i < labelElements.length; i++) {
        const labelElement = labelElements[i] as HTMLElement;
        totalWidth += labelElement.clientWidth + LABEL_GAP;

        if (totalWidth >= maxWidth) {
          index = i - 1;
          break;
        }
      }

      setSliceIndex(index);
    }, 100);

    processAttributes();

    window.addEventListener('resize', processAttributes);

    return () => {
      window.removeEventListener('resize', processAttributes);
    };
  }, [attributes]);

  const finalAttributes = sliceIndex > 0 ? attributes.slice(0, sliceIndex) : attributes;
  const extraAttributes = sliceIndex > 0 ? attributes.slice(sliceIndex) : [];

  return (
    <Wrapper>
      <Labels ref={labelsWrapperRef}>
        {finalAttributes.map((attribute) => {
          return (
            <LabelItem
              attribute={attribute}
              key={attribute.value}
              onSelect={handleSelect}
              active={selectedAttribute?.value === attribute.value}
            >
              {attribute.key}
            </LabelItem>
          );
        })}
        {extraAttributes.length > 0 && (
          <MoreTrigger onMouseOver={handleOnMouseOver} onMouseOut={handleOnMouseOut}>
            更多
          </MoreTrigger>
        )}
        {extraAttributes.length > 0 && showMore && (
          <MoreAttribute onMouseOver={handleOnMouseOver} onMouseOut={handleOnMouseOut}>
            {extraAttributes.map((attribute) => (
              <LabelItem
                attribute={attribute}
                key={attribute.value}
                onSelect={handleSelect}
                active={selectedAttribute?.value === attribute.value}
              >
                {attribute.key}
              </LabelItem>
            ))}
          </MoreAttribute>
        )}
      </Labels>
      <TriggerWrapper
        onClick={() => {
          document.dispatchEvent(new CustomEvent('attribute-collapse'));
          setCollapsed((pre) => !pre);
        }}
      >
        {collapsed && <MenuOpenIcon />}
        {!collapsed && <MenuCloseIcon />}
      </TriggerWrapper>
      <DraggableModel
        beforeClose={handleModalClose}
        title="详细信息"
        ref={dragModalRef}
        width={333}
        okText="确认"
        cancelText="取消"
      >
        <AttributeForm
          ref={validationRef}
          onAttributeChange={onAttributeChange}
          onLabelChange={onLabelChange}
          attributes={attributes}
          initialValues={selectedAnnotation}
          currentAttribute={selectedAttribute}
        />
      </DraggableModel>
    </Wrapper>
  );
}
