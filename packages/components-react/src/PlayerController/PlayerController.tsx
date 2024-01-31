import styled from 'styled-components';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import type { PlayerType } from './SpeedController';
import { SpeedController } from './SpeedController';
import { ReactComponent as PauseIcon } from './pause.svg';
import { ReactComponent as PlayIcon } from './play.svg';
import { secondsToMinute } from '../utils';

const ControllerWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  background-color: #fff;
`;

const PlayStatus = styled.div`
  margin: 0 1rem;

  font-size: 24px;
  cursor: pointer;
  display: flex;
`;

const Duration = styled.div`
  margin: 0 1rem;
`;

export interface PlayerControllerProps {
  type: PlayerType;
  disabled?: boolean;
  onRateChange?: (rate: number) => void;
  onChange?: (playing: boolean) => void;
  duration?: number;
  onPlaying?: (currentTime: number) => void;
  getCurrentTime: () => number;
}

export interface PlayerControllerRef {
  play: () => void;
  pause: () => void;
  updateTime: (time: number) => void;
}

/**
 * 播放器控制器
 */
export const PlayerController = forwardRef<PlayerControllerRef, PlayerControllerProps>(function ForwardRefPlayer(
  { type, duration = 0, onPlaying, getCurrentTime, onRateChange, onChange, disabled },
  ref,
) {
  const [playing, togglePlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(duration);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    setRemainingTime(duration);
  }, [duration]);

  const handlePlayStatusChange = useCallback(() => {
    const nextState = !playing;
    togglePlaying(nextState);

    if (typeof onChange === 'function') {
      onChange(nextState);
    }
  }, [onChange, playing]);

  useEffect(() => {
    // 更新进度
    const updateProgress = () => {
      const currentTimeFromPlayer = getCurrentTime() || 0;

      onPlaying?.(currentTimeFromPlayer);
      setRemainingTime(Math.max(duration - currentTimeFromPlayer, 0));
      setCurrentTime(currentTimeFromPlayer);

      frameIdRef.current = requestAnimationFrame(updateProgress);
    };

    if (playing) {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }

      frameIdRef.current = requestAnimationFrame(updateProgress);
    } else {
      cancelAnimationFrame(frameIdRef.current!);
    }

    return () => {
      cancelAnimationFrame(frameIdRef.current!);
    };
  }, [duration, getCurrentTime, onPlaying, playing]);

  // 暂停/播放
  useHotkeys(
    'space',
    handlePlayStatusChange,
    {
      preventDefault: true,
      enabled: !disabled,
    },
    [handlePlayStatusChange],
  );

  useImperativeHandle(
    ref,
    () => {
      return {
        play: () => {
          togglePlaying(true);
        },
        pause: () => {
          togglePlaying(false);
        },
        updateTime: (time) => {
          const _time = +time;

          if (isNaN(_time)) {
            console.log('time is not a number');

            return;
          }

          setCurrentTime(time);
          setRemainingTime(duration - time);
        },
      };
    },
    [duration],
  );

  return (
    <ControllerWrapper>
      <PlayStatus onClick={disabled ? undefined : handlePlayStatusChange}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </PlayStatus>
      <Duration>
        {secondsToMinute(currentTime)} / -{secondsToMinute(remainingTime)}
      </Duration>
      <SpeedController disabled={disabled} playerType={type} onChange={onRateChange} />
    </ControllerWrapper>
  );
});
