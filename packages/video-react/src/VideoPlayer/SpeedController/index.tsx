import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useHotkeys } from 'react-hotkeys-hook';

import { ReactComponent as ArrowUp } from '../icons/arrow-up.svg';
import { ReactComponent as ArrowDown } from '../icons/arrow-down.svg';

export const VIDEO_PLAYBACK_RATE_SPEED = [0.5, 1, 1.5, 2, 4, 6, 8, 16];
export const AUDIO_PLAYBACK_RATE_SPEED = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export enum EPlayerType {
  Video,
  Audio,
}

export enum ESpeedChange {
  Increase,
  Reduce,
}

export const PLAYER_TYPE_RATE_SPEED: { [key in number]: number[] } = {
  [EPlayerType.Video]: VIDEO_PLAYBACK_RATE_SPEED,
  [EPlayerType.Audio]: AUDIO_PLAYBACK_RATE_SPEED,
};

interface IProps {
  onChange: (rate: number) => void;
  playerType: number;
}

const Wrapper = styled.div.attrs((props) => ({
  ...props,
  className: 'video-speed-wrap',
}))`
  display: flex;
  font-size: 12px;

  .video-speed-wrap__controller {
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
      cursor: pointer;

      &:hover {
        color: rgba(0, 0, 0, 0.8);
      }
    }
  }

  .video-speed-wrap__text {
    font-size: 12px;
    display: flex;
    align-items: center;
  }
`;

const SpeedController = (props: IProps) => {
  const { onChange, playerType } = props;
  const PLAYBACK_RATE_SPEED = PLAYER_TYPE_RATE_SPEED[playerType];
  const MAX_PLAYBACK_RATE_SPEED = PLAYBACK_RATE_SPEED.slice(-1)[0];
  const MIN_PLAYBACK_RATE_SPEED = PLAYBACK_RATE_SPEED[0];
  const [rate, setRate] = useState(1);

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
      onChange(newPlaybackRate);
    },
    [MAX_PLAYBACK_RATE_SPEED, MIN_PLAYBACK_RATE_SPEED, PLAYBACK_RATE_SPEED, onChange, rate],
  );

  useHotkeys('ctrl+right,meta+right', () => setPlaybackRate(ESpeedChange.Increase), [setPlaybackRate]);
  useHotkeys('ctrl+left,meta+left', () => setPlaybackRate(ESpeedChange.Reduce), [setPlaybackRate]);

  return (
    <Wrapper>
      <span className="video-speed-wrap__text">
        <span>倍速</span>
        {rate}x
      </span>
      <span className="video-speed-wrap__controller">
        <ArrowUp onClick={() => setPlaybackRate(ESpeedChange.Increase)} />
        <ArrowDown onClick={() => setPlaybackRate(ESpeedChange.Reduce)} />
      </span>
    </Wrapper>
  );
};

export default SpeedController;
