import styled, { css } from 'styled-components';
import { useMemo } from 'react';
import { EllipsisText, secondsToMinute } from '@labelu/components-react';
import type { MediaAnnotationInUI, MediaAnnotationWithTextAndTag } from '@labelu/interface';

import { ReactComponent as SegmentIcon } from '@/assets/icons/segment.svg';
import { ReactComponent as FrameIcon } from '@/assets/icons/frame.svg';
import { ReactComponent as EditIcon } from '@/assets/icons/edit.svg';
import { ReactComponent as DeleteIcon } from '@/assets/icons/delete.svg';
import { ReactComponent as VisibilityIcon } from '@/assets/icons/visibility.svg';
import { ReactComponent as VisibilityOffIcon } from '@/assets/icons/visibility-off.svg';

import { useAnnotator } from '../context';

interface AttributeItemProps {
  annotation: MediaAnnotationInUI;
  order: number;
  labelText: string;
  color: string;
  active?: boolean;
}

export const Action = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 1.125rem;
  color: #999;

  svg {
    opacity: 0;
    cursor: pointer;

    &:hover {
      color: var(--color-primary);
    }

    &:last-child {
      &:hover {
        color: red;
      }
    }
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover svg {
    opacity: 1;
  }
`;

const InnerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    font-size: 1.25rem;
    flex-shrink: 0;
  }
`;

// @ts-ignore
const StyledVisibilityOffIcon = styled(VisibilityOffIcon)`
  opacity: 1 !important;
`;

const AsideAttributeWrapper = styled.div<{ active?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 1rem 0.5rem 2rem;
  cursor: pointer;

  &:hover svg {
    opacity: 1;
  }

  &:hover ${InnerHeader} {
    ${({ color }) => css`
      color: ${color};
    `}
  }

  &:last-child {
    margin-bottom: 0;
  }

  ${({ active }) =>
    active &&
    css`
      background-color: #f5f5f5;
    `}
`;

const Body = styled.div`
  display: flex;
`;

export interface AttributeActionProps {
  annotation?: MediaAnnotationInUI;
  annotations?: MediaAnnotationInUI[];
  showEdit?: boolean;
}

export function AttributeAction({ annotation, annotations, showEdit = true }: AttributeActionProps) {
  const { onAnnotationRemove, onAnnotationsRemove, onAnnotationChange, onAnnotationsChange, currentSample } =
    useAnnotator();

  const annotationsMapping = useMemo(() => {
    if (!annotations) {
      return {};
    }

    return annotations.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, MediaAnnotationWithTextAndTag>);
  }, [annotations]);

  const visible = useMemo(() => {
    if (annotation) {
      return typeof annotation.visible === 'undefined' ? true : Boolean(annotation.visible);
    }

    if (annotations) {
      return annotations.every((item) => (typeof item.visible === 'undefined' ? true : item.visible));
    }

    return true;
  }, [annotation, annotations]);

  const handleEditClick = (e: React.MouseEvent) => {
    document.dispatchEvent(new CustomEvent('annotation-attribute-edit', { detail: { annotation, mouseEvent: e } }));
  };

  const toggleOneVisibility = (value: boolean) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!annotation) {
      return;
    }

    onAnnotationChange({ ...annotation, visible: value });
  };

  const toggleBatchVisibility = (value: boolean) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!annotations) {
      return;
    }

    onAnnotationsChange(
      currentSample!.annotations.map((item) => {
        if (annotationsMapping[item.id]) {
          return { ...item, visible: value };
        }

        return item;
      }),
    );
  };

  if (annotation) {
    return (
      <Action>
        {showEdit && <EditIcon onClick={handleEditClick} />}
        {visible && <VisibilityIcon onClick={toggleOneVisibility(false)} />}
        {!visible && <StyledVisibilityOffIcon onClick={toggleOneVisibility(true)} />}
        <DeleteIcon onClick={() => onAnnotationRemove(annotation)} />
      </Action>
    );
  }

  return (
    <Action>
      {showEdit && <EditIcon onClick={handleEditClick} />}
      {visible && <VisibilityIcon onClick={toggleBatchVisibility(false)} />}
      {!visible && <StyledVisibilityOffIcon onClick={toggleBatchVisibility(true)} />}
      <DeleteIcon onClick={() => onAnnotationsRemove(annotations!)} />
    </Action>
  );
}

export default function AsideAttributeItem({ annotation, active, order, labelText, color }: AttributeItemProps) {
  const { type } = annotation;
  const { onAnnotationSelect } = useAnnotator();

  if (type === 'segment') {
    const { start, end } = annotation;

    return (
      <AsideAttributeWrapper color={color} active={active} onClick={() => onAnnotationSelect(annotation)}>
        <Header>
          <InnerHeader>
            <div>{order}.</div>
            <SegmentIcon color={color} />
            <EllipsisText maxWidth={112} title={labelText}>
              <div>{labelText}</div>
            </EllipsisText>
          </InnerHeader>
          <AttributeAction annotation={annotation} />
        </Header>
        <Body>
          {secondsToMinute(start)} ~ {secondsToMinute(end)}
        </Body>
      </AsideAttributeWrapper>
    );
  }

  const { time } = annotation;

  return (
    <AsideAttributeWrapper color={color} active={active} onClick={() => onAnnotationSelect(annotation)}>
      <Header>
        <InnerHeader>
          <div>{order}.</div>
          <FrameIcon color={color} />
          <EllipsisText maxWidth={112} title={labelText}>
            <div>{labelText}</div>
          </EllipsisText>
        </InnerHeader>
        <AttributeAction annotation={annotation} />
      </Header>
      <Body>{secondsToMinute(time)}</Body>
    </AsideAttributeWrapper>
  );
}
