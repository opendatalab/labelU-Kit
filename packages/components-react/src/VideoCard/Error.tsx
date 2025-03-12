import React from 'react';
import styled from 'styled-components';

import { ReactComponent as MediaErrorIcon } from './videoError.svg';

const StyledMediaError = styled.div`
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  .media-error-image {
    height: 50%;
  }
`;

export default function MediaError({ className }: { className?: string }) {
  return (
    <StyledMediaError className={className}>
      <MediaErrorIcon className="media-error-image" />
    </StyledMediaError>
  );
}
