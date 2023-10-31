import styled, { css } from 'styled-components';
import type { MediaAnnotationType } from '@labelu/interface';
import type { SVGProps } from 'react';

import sliceIcon from './cursor-segment.svg';
import frameIcon from './cursor-frame.svg';
import { ReactComponent as ExpandIcon } from './arrow.svg';

export const TrackWrapper = styled.div<{ expanded: boolean }>`
  max-height: var(--bar-height);
  ${({ expanded }) =>
    expanded &&
    css`
      max-height: calc(5 * var(--bar-height));
    `}
  overflow-y: auto;
  overflow-x: hidden;
`;

export const PlayerFrame = styled.div`
  left: 0;
  position: absolute;
  height: 100%;
  width: 1px;
  top: 0;
  background-color: #fff;
  z-index: 999;
`;

export const ActivityBar = styled.div<{ editingType?: MediaAnnotationType }>`
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

export const BarWrapper = styled.div<{ expanded?: boolean }>`
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

export const ExpandIconElem = styled<React.FC<SVGProps<SVGSVGElement>>>(ExpandIcon)``;

export const ExpandTrigger = styled.div<{ expanded: boolean }>`
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
