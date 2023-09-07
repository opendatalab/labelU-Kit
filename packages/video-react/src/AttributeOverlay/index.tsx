import { useContext, useMemo } from 'react';
import styled from 'styled-components';

import VideoAnnotationContext from '@/context';

const Wrapper = styled.div`
  position: absolute;
  right: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
`;

const OverlayItem = styled.div`
  background-color: var(--color);
  text-align: left;
  padding: 0.5rem;
  opacity: 0.8;
  color: #fff;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

export function AttributeOverlay() {
  const { playingAnnotationIds, annotations, attributeConfigMapping } = useContext(VideoAnnotationContext);

  const playingAnnotations = useMemo(() => {
    return annotations.filter((annotation) => playingAnnotationIds.includes(annotation.id));
  }, [playingAnnotationIds, annotations]);

  return (
    <Wrapper>
      {playingAnnotations.map((annotation) => {
        const { type, attributes } = annotation;
        // @ts-ignore
        const currentAttributeMapping = attributeConfigMapping[type]?.[annotation.label]?.attributesMapping || {};

        const nodes = attributes && Object.keys(attributes).length > 0 && (
          <List>
            {Object.entries(attributes).map(([key, value], index) => {
              return (
                <span key={key}>
                  {index + 1}.&nbsp;{currentAttributeMapping[key]?.key ?? key}:{' '}
                  {(Array.isArray(value)
                    ? value
                        .map((item) => currentAttributeMapping[key]?.optionMapping?.[item]?.key)
                        .filter((item) => item)
                        .join(', ')
                    : currentAttributeMapping[key]?.optionMapping?.[value]?.key) || value}
                </span>
              );
            })}
          </List>
        );

        return (
          <OverlayItem
            key={annotation.id}
            // @ts-ignore
            style={{ '--color': attributeConfigMapping[type]?.[annotation.label]?.color ?? '#666' }}
          >
            <div>{attributeConfigMapping[type]?.[annotation.label]?.key ?? '无标签'}</div>
            {nodes}
          </OverlayItem>
        );
      })}
    </Wrapper>
  );
}
