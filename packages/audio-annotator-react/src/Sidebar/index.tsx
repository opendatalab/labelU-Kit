import { useCallback, useState } from 'react';
import styled, { css } from 'styled-components';
import { AudioCard } from '@labelu/components-react';

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
  className: 'labelu-audio__sidebar',
}))`
  position: relative;
  background-color: #fff;
  flex-shrink: 0;
  padding: 0 1rem;
  box-sizing: border-box;

  ${({ collapsed }) => (collapsed ? 'width: 0; padding: 0;' : 'width: 236px;')}

  ${Cards} {
    ${({ collapsed }) => (collapsed ? 'display: none;' : 'display: flex;')}
  }
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
  renderSidebar?: () => React.ReactNode;
}

export default function Sidebar({ renderSidebar }: SidebarProps) {
  const { samples, currentSample, onSampleSelect } = useSample();
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
              <AudioCard
                key={sample.id}
                no={index + 1}
                showNo
                active={currentSample?.id === sample.id}
                onClick={() => onSampleSelect(sample)}
                src={sample.url}
                title={sample.name}
              />
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
