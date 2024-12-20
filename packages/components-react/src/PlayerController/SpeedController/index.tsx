import React, { useState, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowUpIcon } from './arrow-up.svg';
import { ReactComponent as ArrowDownIcon } from './arrow-down.svg';

export const VIDEO_PLAYBACK_RATE_SPEED = [0.5, 1, 1.5, 2, 4, 6, 8, 16];
export const AUDIO_PLAYBACK_RATE_SPEED = [0.25, 0.5, 1, 2, 4];

export type PlayerType = 'video' | 'audio';

export enum ESpeedChange {
  Increase,
  Reduce,
}

export const PLAYER_TYPE_RATE_SPEED: Record<PlayerType, number[]> = {
  video: VIDEO_PLAYBACK_RATE_SPEED,
  audio: AUDIO_PLAYBACK_RATE_SPEED,
};

const Wrapper = styled.div.attrs((props) => ({
  ...props,
  className: 'video-speed-wrap',
}))`
  display: flex;
  font-size: 12px;
`;

const SpeedText = styled.span`
  font-size: 12px;
  display: flex;
  align-items: center;
`;

const ArrowUp = styled(ArrowUpIcon)<{ disabled: boolean }>`
  ${({ disabled }) =>
    disabled
      ? css`
          cursor: not-allowed !important;
        `
      : css`
          cursor: pointer;
          &:hover {
            color: rgba(0, 0, 0, 0.8);
          }
        `}
`;

const ArrowDown = styled(ArrowDownIcon)<{ disabled: boolean }>`
  ${({ disabled }) =>
    disabled
      ? css`
          cursor: not-allowed !important;
        `
      : css`
          cursor: pointer;
          &:hover {
            color: rgba(0, 0, 0, 0.8);
          }
        `}
`;

const SpeedControllerWrapper = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 10px;
  margin-left: 5px;
  font-size: 10px;
  transition: all 0.2s;

  svg {
    transition: all 0.2s;
    color: rgba(0, 0, 0, 0.2);
    user-select: none;
  }
`;

export interface SpeedControllerProps {
  onChange?: (rate: number) => void;
  playerType: PlayerType;
  disabled?: boolean;
}

export function SpeedController(props: SpeedControllerProps) {
  const { onChange, playerType = 'video', disabled } = props;
  const PLAYBACK_RATE_SPEED = PLAYER_TYPE_RATE_SPEED[playerType];
  const MAX_PLAYBACK_RATE_SPEED = PLAYBACK_RATE_SPEED.slice(-1)[0];
  const MIN_PLAYBACK_RATE_SPEED = PLAYBACK_RATE_SPEED[0];
  const [rate, setRate] = useState(1);
  // @ts-ignore
  const { t } = useTranslation();

  const setPlaybackRate = useCallback(
    (speedChange: ESpeedChange) => {
      const indexChanges = speedChange === ESpeedChange.Increase ? 1 : -1;

      if (indexChanges === 1 && rate === MAX_PLAYBACK_RATE_SPEED) {
        return;
      }

      if (indexChanges === -1 && rate === MIN_PLAYBACK_RATE_SPEED) {
        return;
      }

      const newPlaybackRateIndex = PLAYBACK_RATE_SPEED.findIndex((i) => i === rate) + indexChanges;
      const newPlaybackRate = PLAYBACK_RATE_SPEED[newPlaybackRateIndex];

      setRate(newPlaybackRate);
      onChange?.(newPlaybackRate);
    },
    [MAX_PLAYBACK_RATE_SPEED, MIN_PLAYBACK_RATE_SPEED, PLAYBACK_RATE_SPEED, onChange, rate],
  );

  useHotkeys(
    'ctrl+right,meta+right',
    () => setPlaybackRate(ESpeedChange.Increase),
    {
      enabled: !disabled,
      preventDefault: true,
    },
    [setPlaybackRate],
  );
  useHotkeys(
    'ctrl+left,meta+left',
    () => setPlaybackRate(ESpeedChange.Reduce),
    {
      enabled: !disabled,
      preventDefault: true,
    },
    [setPlaybackRate],
  );

  return (
    <Wrapper>
      <SpeedText>
        <span>{t('playRate')}</span>
        {rate}x
      </SpeedText>
      <SpeedControllerWrapper>
        <ArrowUp
          disabled={disabled || rate === MAX_PLAYBACK_RATE_SPEED}
          onClick={disabled ? undefined : () => setPlaybackRate(ESpeedChange.Increase)}
        />
        <ArrowDown
          disabled={disabled || rate === MIN_PLAYBACK_RATE_SPEED}
          onClick={disabled ? undefined : () => setPlaybackRate(ESpeedChange.Reduce)}
        />
      </SpeedControllerWrapper>
    </Wrapper>
  );
}
