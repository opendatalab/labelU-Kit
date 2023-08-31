import React, { useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import type { DraggableModalRef, ValidationContextType } from '@label-u/components-react';
import { DraggableModel, AttributeForm } from '@label-u/components-react';
import type { VideoAnnotationData, VideoFrameAnnotation, VideoSegmentAnnotation, Attribute } from '@label-u/interface';

import EditorContext from '../context';

const Wrapper = styled.div`
  grid-area: header;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f8f8f8;
  padding: 0 1rem;
`;

const LabelWrapper = styled.div<{ color: string; active: boolean }>`
  --attribute-color: ${({ color }) => color};
  display: flex;
  position: relative;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  background-color: ${({ active }) => (active ? `var(--attribute-color)` : '#fff')};
  color: ${({ active }) => (active ? '#fff' : '#333')};
  border-radius: 2px;
  font-size: 14px;

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
    <LabelWrapper active={active} color={attribute.color ?? '#000'} onClick={handleClick}>
      {children as string}
    </LabelWrapper>
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
  const dragModalRef = React.useRef<DraggableModalRef | null>(null);

  const handleSelect = (attribute: Attribute, e: React.MouseEvent) => {
    onLabelChange(attribute);

    if (!dragModalRef.current || !selectedAnnotation) {
      return;
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

      if (
        !dragModalRef.current ||
        !annotation ||
        !attributeMapping[annotation.type][annotation.label]?.attributes?.length
      ) {
        return;
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

    dragModalRef.current.toggleVisibility(false);
  };

  return (
    <Wrapper>
      {attributes.map((attribute) => {
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
