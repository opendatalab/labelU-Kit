import React from 'react';
import styled, { css } from 'styled-components';

const StyledDivider = styled.span<DividerProps>`
  ${({ direction, thickness = 1, space = 8 }) =>
    direction === 'vertical' &&
    css`
      display: inline-block;
      height: 100%;
      width: ${thickness}px;
      vertical-align: middle;
      margin: 0 ${space}px;
    `}

  ${({ direction, thickness = 1, space = 8 }) =>
    direction === 'horizontal' &&
    css`
      display: block;
      width: 100%;
      height: ${thickness}px;
      margin: ${space}px 0;
    `}

  background-color: ${({ color }) => color || '#e5e5e5'};
`;

export interface DividerProps {
  space?: string | number;
  color?: string;
  direction?: 'vertical' | 'horizontal';
  thickness?: number;
  style?: React.CSSProperties;
}

export function Divider({ style, ...restProps }: DividerProps) {
  return <StyledDivider {...restProps} style={style} />;
}
