import styled from 'styled-components';
import type { VideoAnnotationData, Attribute, AudioAnnotationData, MediaAnnotationInUI } from '@labelu/interface';
import { useContext, useRef } from 'react';

import { MediaAnnotationContext } from './context';
import { AnnotationItem } from './AnnotationBar';

const Wrapper = styled.div`
  position: relative;
  box-sizing: border-box;
  height: var(--bar-height);
  background-color: #333333;
  border-top: 1px solid #e6e6e633;
  display: flex;
  align-items: center;
`;

type MediaAnnotationData = VideoAnnotationData | AudioAnnotationData;

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
          <AnnotationItem
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
