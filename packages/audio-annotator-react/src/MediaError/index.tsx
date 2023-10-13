import React from 'react';

import StyledMediaError from './styled';
import { ReactComponent as MediaErrorIcon } from './videoError.svg';

export interface MediaErrorProps {
  visible: boolean;
  className?: string;
}

export default function MediaError({ visible, className }: MediaErrorProps) {
  if (!visible) {
    return null;
  }

  return (
    <StyledMediaError visible={visible} className={className}>
      <MediaErrorIcon className="media-error-image" />
    </StyledMediaError>
  );
}
