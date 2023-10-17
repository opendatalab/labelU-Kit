import styled, { css } from 'styled-components';
import { darken, rgba } from 'polished';
import type { MediaAnnotationType } from '@labelu/interface';

export const Order = styled.div``;

export const AttributeListItem = styled.span``;

export const LabelTextWrapper = styled.div`
  max-width: 20em;
  max-height: 12em;
  overflow: auto;
`;

export const AttributesInner = styled.div`
  display: flex;
  flex-direction: column;
`;

export const AttributeList = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const InnerSegmentBar = styled.div`
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

export const InnerFrame = styled.div`
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

export const AttributeItemWrapper = styled.div<{
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

export const AttributeWrap = styled.div`
  display: flex;
  width: 100%;
  gap: 0.5rem;
`;

export const AttributeText = styled.div`
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

export const ResizeBar = styled.span<{ position: 'left' | 'right' }>`
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

export const TooltipSegmentContent = styled.div`
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

export const TooltipFrameContent = styled.div`
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

export const AnnotationContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
`;

export const OrderWrapper = styled.span`
  align-items: center;
  justify-content: center;
`;

export const AnnotationAttribute = styled.div`
  text-align: left;
  min-width: 0;
`;
