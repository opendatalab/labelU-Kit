import styled from 'styled-components';
import { FlexLayout } from '@labelu/components-react';

export const Wrapper = styled(FlexLayout)`
  height: calc(100vh - var(--header-height));
  padding: 0 1.5rem;
  box-sizing: border-box;
`;

export const Header = styled(FlexLayout.Header)`
  padding: 1rem 0;
`;

export const Footer = styled(FlexLayout.Footer)`
  padding: 1rem 0;
`;
