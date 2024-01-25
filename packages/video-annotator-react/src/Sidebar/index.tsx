import { useCallback, useState } from 'react';
import styled, { css } from 'styled-components';
import { useAnnotator } from '@labelu/audio-annotator-react';

import { ReactComponent as ExpandIcon } from '@/assets/icons/arrow.svg';
import { VideoCard, StyledVideo } from '@/VideoCard';

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
  className: 'labelu-video__sidebar',
}))`
  position: relative;
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

const VideoCardWrapper = styled.div<{ selected: boolean }>`
  display: flex;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;

  ${StyledVideo} {
    border-radius: 3px;
    padding: 1rem;

    ${({ selected }) =>
      selected &&
      css`
        outline: 3px solid var(--color-primary);
      `}
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
  renderSidebar?: () => React.ReactNode;
}

export default function Sidebar({ renderSidebar }: SidebarProps) {
  const { samples, handleSelectSample, currentSample } = useAnnotator();
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
              <VideoCardWrapper key={sample.id} selected={currentSample?.id === sample.id}>
                <VideoCard
                  src={sample.url}
                  showDuration={currentSample?.id !== sample.id}
                  showPlayIcon={currentSample?.id !== sample.id}
                  onClick={() => handleSelectSample(sample)}
                />
                <CardIndex>{index + 1}</CardIndex>
              </VideoCardWrapper>
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
