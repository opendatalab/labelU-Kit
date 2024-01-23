import { useCallback, useState } from 'react';
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
  className: 'labelu-image-editor__sidebar',
}))`
  position: relative;
  flex-shrink: 0;
  background-color: #fff;

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
  top: 50%;
  transform: translateY(-50%);
  right: -18px;
  z-index: 999;
  height: 36px;
  width: 18px;
  border-radius: 0 2px 2px 0;
  background-color: #e5e5e5;

  svg {
    transform: rotate(${({ collapsed }) => (collapsed ? '0' : '180deg')});
  }
`;

export interface SidebarProps {
  renderSidebar?: () => React.ReactNode;
}

export default function Sidebar({ renderSidebar }: SidebarProps) {
  const { samples, onSampleSelect, currentSample } = useSample();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const handleExpandTriggerClick = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <Wrapper collapsed={collapsed}>
      {renderSidebar ? (
        renderSidebar()
      ) : (
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
