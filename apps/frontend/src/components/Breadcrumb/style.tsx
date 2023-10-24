import type { FC } from 'react';
import type { LinkProps } from 'react-router-dom';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

import BlockContainer from '@/layouts/BlockContainer';

import type { BreadcrumbProps } from './index';

const StyledBreadcrumb = styled(BlockContainer).attrs((props: BreadcrumbProps) => ({
  ...props,
  className: 'breadcrumbs',
}))`
  display: flex;
  justify-content: flex-start;
  font-size: 14px;
  .breadcrumb-item-wrap {
    display: flex;
    align-items: center;
  }

  .breadcrumb-item-separator {
    margin: 0 0.5rem;
    color: rgba(0, 0, 0, 0.45);
  }
`;

export interface BreadcrumbItemProps extends LinkProps {
  isCurrent?: boolean;
}

const CustomLink: FC<BreadcrumbItemProps> = ({ isCurrent: _, ...props }) => {
  return <Link {...props} />;
};

export const BreadcrumbItem = styled(CustomLink).attrs((props: BreadcrumbItemProps) => ({
  ...props,
  className: 'breadcrumb-item',
}))`
  color: ${({ isCurrent }: BreadcrumbItemProps) => (isCurrent ? '#333' : '#999')};
  text-decoration: none;

  ${({ isCurrent }: BreadcrumbItemProps) =>
    !isCurrent &&
    css`
      &:hover {
        color: var(--color-primary);
      }
    `}
`;

export default StyledBreadcrumb;
