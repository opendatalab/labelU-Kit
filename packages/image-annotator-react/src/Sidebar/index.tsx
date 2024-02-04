import { useCallback, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

import { ReactComponent as ExpandIcon } from '@/assets/icons/arrow.svg';
import { useSample } from '@/context/sample.context';

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  box-sizing: border-box;
  gap: 1rem;
  height: calc(100vh - var(--offset-top));
  overflow: auto;
`;

const Wrapper = styled.div.attrs((props: { collapsed: boolean }) => ({
  ...props,
  className: 'labelu-image__sidebar',
}))`
  position: relative;
  flex-shrink: 0;
  background-color: #fff;
  border-right: 1px solid rgba(235, 236, 240, 1);

  ${({ collapsed }) => (collapsed ? 'width: 0;' : 'width: 232px;')}

  ${Cards} {
    ${({ collapsed }) => (collapsed ? 'display: none;' : 'display: flex;')}
  }
`;

const CardIndex = styled.div`
  padding: 0.1rem 0.25rem;
  text-align: center;
  border-radius: 3px;
`;

const ImageWrapper = styled.div<{ selected: boolean }>`
  display: flex;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;

  img {
    width: 100%;
    object-fit: cover;
  }

  ${({ selected }) =>
    selected &&
    css`
      ${CardIndex} {
        background-color: var(--color-primary);
        color: #fff;
      }
    `};
`;

const CollapseTrigger = styled.div<{ collapsed: boolean }>`
  position: absolute;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 1rem;
  right: -12px;
  z-index: 999;
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background-color: #fff;
  box-shadow: 0px 2px 10px 0px rgba(18, 19, 22, 0.1);

  ${({ collapsed }) =>
    collapsed &&
    css`
      opacity: 0.8;
      border-radius: 0 50% 50% 0;
      right: -20px;
    `}

  svg {
    transform: rotate(${({ collapsed }) => (collapsed ? '0' : '180deg')});
  }
`;

export interface SidebarProps {
  renderSidebar?: null | (() => React.ReactNode);
}

export default function Sidebar({ renderSidebar }: SidebarProps) {
  const { samples, onSampleSelect, currentSample } = useSample();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const handleExpandTriggerClick = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const sidebar = useMemo(() => {
    if (renderSidebar === null) {
      return null;
    }

    return renderSidebar?.();
  }, [renderSidebar]);

  if (sidebar === null) {
    return null;
  }

  return (
    <Wrapper collapsed={collapsed}>
      {sidebar || (
        <Cards>
          {samples.map((sample, index) => {
            return (
              <ImageWrapper key={sample.id} selected={currentSample?.id === sample.id}>
                <img src={sample.url} alt={sample.name} onClick={() => onSampleSelect(sample)} />
                <CardIndex>{index + 1}</CardIndex>
              </ImageWrapper>
            );
          })}
        </Cards>
      )}
      <CollapseTrigger collapsed={collapsed} onClick={handleExpandTriggerClick}>
        <ExpandIcon />
      </CollapseTrigger>
    </Wrapper>
  );
}
