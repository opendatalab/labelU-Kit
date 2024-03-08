import type { PropsWithChildren } from 'react';
import styled, { css } from 'styled-components';

export interface StyledMediaErrorProps {
  visible?: boolean;
  className?: string;
}

const StyledMediaError: React.FC<PropsWithChildren<StyledMediaErrorProps>> = styled.div<StyledMediaErrorProps>`
  display: none;
  width: 100%;
  height: 100%;

  ${({ visible }: StyledMediaErrorProps) =>
    visible &&
    css`
      display: flex;
      align-items: center;
      justify-content: center;
    `}

  .media-error-image {
    height: 50%;
  }
`;

export default StyledMediaError;
