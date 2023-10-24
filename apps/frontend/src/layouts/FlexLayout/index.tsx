import React from 'react';
import styled, { css } from 'styled-components';

interface BasicFlexBox extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  flex?: 'column' | 'row' | boolean;
  full?: boolean;
  scroll?: boolean;
  items?: React.CSSProperties['alignItems'];
  justify?: React.CSSProperties['justifyContent'];

  gap?: React.CSSProperties['gap'];
  ref?: React.Ref<HTMLDivElement>;
}

const common = css<BasicFlexBox>`
  ${({ flex }) => {
    if (!flex) {
      return '';
    }

    switch (flex) {
      case 'column':
        return css`
          display: flex;
          flex-direction: column;
        `;
      case 'row':
      default:
        return css`
          display: flex;
          flex-direction: row;
        `;
    }
  }}

  ${({ full, flex }) => {
    if (!full) {
      return '';
    }

    switch (flex) {
      case 'column':
        return css`
          height: 100%;
        `;
      case 'row':
      default:
        return css`
          width: 100%;
        `;
    }
  }}

  ${({ gap }) =>
    gap &&
    css`
      gap: ${gap};
    `}

  ${({ items }) =>
    items &&
    css`
      align-items: ${items};
    `}

    ${({ justify }) =>
    justify &&
    css`
      justify-content: ${justify};
    `}

    ${({ scroll }) =>
    scroll &&
    css`
      min-height: 0;
      overflow: auto;
    `}
`;

// ========================================= header =========================================

const ItemWrapper = styled.div<BasicFlexBox>`
  flex-shrink: 0;

  ${common}
`;

export interface FlexItemProps extends BasicFlexBox {
  as?: keyof JSX.IntrinsicElements;
}

export function Header({ children, ...props }: FlexItemProps) {
  return (
    <FlexItem as="header" {...props}>
      {children}
    </FlexItem>
  );
}

// ========================================= content =========================================

const ContentWrapper = styled.div<BasicFlexBox>`
  flex: 1 auto;

  ${common}
`;

function Content({ children, ...props }: BasicFlexBox) {
  return <ContentWrapper {...props}>{children}</ContentWrapper>;
}

// ========================================= footer layout =========================================

function Footer({ children, ...props }: FlexItemProps) {
  return (
    <FlexItem as="footer" {...props}>
      {children}
    </FlexItem>
  );
}

function FlexItem({ children, ...props }: FlexItemProps) {
  return <ItemWrapper {...props}>{children}</ItemWrapper>;
}

// ========================================= flex layout =========================================

const FlexLayoutWrapper = styled.div<BasicFlexBox>`
  display: flex;
  ${common}
`;

export default function FlexLayout({ children, ...props }: BasicFlexBox) {
  return <FlexLayoutWrapper {...props}>{children}</FlexLayoutWrapper>;
}

FlexLayout.Header = Header;
FlexLayout.Content = Content;
FlexLayout.Footer = Footer;
FlexLayout.Item = FlexItem;
