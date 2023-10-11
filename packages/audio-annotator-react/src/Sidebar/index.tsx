import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { AudioCard } from '@labelu/components-react';

import { ReactComponent as ExpandIcon } from '@/assets/icons/arrow.svg';

import { useAnnotator } from '../context';

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  box-sizing: border-box;
  gap: 1rem;
  height: var(--height);
  overflow: auto;
`;

const Wrapper = styled.div.attrs((props: { collapsed: boolean }) => ({
  ...props,
  className: 'labelu-video-editor__sidebar',
}))`
  position: relative;
  grid-area: sidebar;
  background-color: #ebecf0;

  ${({ collapsed }) => (collapsed ? 'width: 0;' : 'width: 232px;')}

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
  const { samples, containerRef, currentSample } = useAnnotator();
  const [height, setHeight] = useState<number>(0);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const handleExpandTriggerClick = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setHeight(containerRef.current?.clientHeight || 0);
    });
  });

  if (!height) {
    return null;
  }

  return (
    // @ts-ignore
    <Wrapper collapsed={collapsed} style={{ '--height': `${height}px` }}>
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
