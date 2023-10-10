import { useCallback, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import { ReactComponent as PlayIcon } from './play.svg';
import { EllipsisText } from '../EllipsisText';
import { secondsToMinute } from '../utils';

const InnerWrapper = styled.div`
  position: relative;
  background-color: #fff;
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: space-between;
  padding: 0.75rem 0.5rem;
  cursor: pointer;
  user-select: none;
  border-radius: 3px;
`;

const CardIndex = styled.div`
  padding: 0.1rem 0.25rem;
  text-align: center;
  border-radius: 3px;
`;

const Wrapper = styled.div<{
  active: boolean;
}>`
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${({ active }) =>
    active &&
    css`
      ${InnerWrapper} {
        border: var(--color-primary) 2px solid;
      }

      ${CardIndex} {
        background-color: var(--color-primary);
        color: #fff;
      }
    `}
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export interface AudioCardProps {
  src: string;
  active?: boolean;
  title: React.ReactNode;
  /**
   * 显示序号
   */
  showNo?: boolean;
  /**
   * 序号
   */
  no: number;
}

export function AudioCard({ active, no, title, src, showNo }: AudioCardProps) {
  const ref = useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = useState(0);

  const onMetadataLoad = useCallback(() => {
    setDuration(ref.current?.duration || 0);
  }, []);

  return (
    <Wrapper active={active}>
      {showNo && <CardIndex>{no}</CardIndex>}
      <InnerWrapper>
        <Left>
          <PlayIcon />
          <EllipsisText title={title} maxWidth={80}>
            {/* @ts-ignore */}
            {title}
          </EllipsisText>
        </Left>
        <span>{secondsToMinute(duration)}</span>
        <audio ref={ref} onLoadedMetadata={onMetadataLoad} src={src} />
      </InnerWrapper>
    </Wrapper>
  );
}
