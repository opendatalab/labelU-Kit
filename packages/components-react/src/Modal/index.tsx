import type { DialogProps } from 'rc-dialog';
import RcDialog from 'rc-dialog';
import 'rc-dialog/assets/index.css';
import styled, { css } from 'styled-components';

export interface ModalProps extends DialogProps {
  fullscreen?: boolean;
}

// @ts-ignore
const StyledModal = styled(RcDialog)`
  .rc-dialog-content {
    box-shadow: 0px 2px 8px 0px #0000001a;
    ${({ fullscreen }: ModalProps) =>
      fullscreen &&
      css`
        height: 100%;
        display: flex;
        flex-direction: column;
      `}
  }

  .rc-dialog-body {
    ${({ fullscreen }: ModalProps) =>
      fullscreen &&
      css`
        flex-grow: 1;
        overflow: auto;
      `}
  }

  ${({ fullscreen }: ModalProps) =>
    fullscreen &&
    css`
      margin: 0;
      width: 100vw;
      height: 100vh;
    `}
`;

export function Modal({ children, ...props }: ModalProps) {
  return <StyledModal {...props}>{children}</StyledModal>;
}
