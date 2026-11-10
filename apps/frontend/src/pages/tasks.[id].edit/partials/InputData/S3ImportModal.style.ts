import styled from 'styled-components';

export const BreadcrumbNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  font-size: 13px;
  color: var(--color-text-secondary);

  .breadcrumb-separator {
    margin: 0 0.125rem;
  }

  .breadcrumb-item {
    cursor: pointer;
    color: var(--color-primary);

    &:hover {
      text-decoration: underline;
    }
  }

  .breadcrumb-current {
    color: var(--color-text);
  }
`;
