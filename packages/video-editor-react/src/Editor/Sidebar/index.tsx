import { useCallback, useContext, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';

import { ReactComponent as ExpandIcon } from '@/assets/icons/arrow.svg';
import VideoCard from '@/VideoCard';
import StyledVideo from '@/VideoCard/styled';

import EditorContext from '../context';

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  box-sizing: border-box;
  gap: 1rem;
  height: var(--height);
  overflow: auto;
`;

const Wrapper = styled.div<{ collapsed: boolean }>`
  position: relative;
  grid-area: sidebar;
  background-color: #ebecf0;
  /* flex-direction: column; */

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

export default function Sidebar() {
  const { samples, handleSelectSample, currentSample, videoWrapperRef } = useContext(EditorContext);
  const [height, setHeight] = useState<number>(0);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const handleExpandTriggerClick = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setHeight(videoWrapperRef.current?.clientHeight || 0);
    });
  });

  if (!height) {
    return null;
  }

  return (
    // @ts-ignore
    <Wrapper collapsed={collapsed} style={{ '--height': `${height}px` }}>
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
      <CollapseTrigger collapsed={collapsed} onClick={handleExpandTriggerClick}>
        <ExpandIcon />
      </CollapseTrigger>
    </Wrapper>
  );
}
