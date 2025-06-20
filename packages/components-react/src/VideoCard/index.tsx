import React, { useCallback, useRef, useState } from 'react';
import type { CSSObject } from 'styled-components';
import styled from 'styled-components';

import { secondsToMinute } from '@/utils';

import MediaError from './Error';
import { ReactComponent as PlayIcon } from './play.svg';
import { StatusCard } from '../StatusCard';

function DurationBar({ value = 0 }) {
  const volumeStyle = {
    width: `${value}%`,
  };
  return (
    <div className="video-card__duration-bar">
      <div className="video-card__duration-volume" style={volumeStyle} />
    </div>
  );
}

interface Size {
  width: number;
  height: number;
}

export interface StyledVideoProps {
  isPlaying?: boolean;

  className?: string;

  style?: React.CSSProperties;

  onMouseOver?: (e: React.MouseEvent) => void;

  onMouseLeave?: (e: React.MouseEvent) => void;
}

const videoClassName = 'labelu-video-card';

const VideoWrapper = styled.div`
  padding: 0 1rem;
`;

export const StyledVideo = styled.div<StyledVideoProps>`
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;

  &:hover {
    &:before {
      opacity: 0;
    }
  }

  &:before {
    transition: all 0.2s;
    content: '';
    display: block;
    position: absolute;
    z-index: 2;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
  }

  .${videoClassName}__video {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  ${({ isPlaying }): CSSObject =>
    isPlaying
      ? {
          '&--playing': {
            fontSize: 'unset',
          },
        }
      : {}}

  .${videoClassName}__play {
    position: absolute;
    top: calc(100% / 2 - 20px);
    left: calc(100% / 2 - 20px);
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    opacity: 1;
    pointer-events: none;

    .${videoClassName}--playing & {
      opacity: 0;
    }
  }

  .${videoClassName}__icon {
    color: rgba(255, 255, 255, 0.8);
    font-size: 26px;
  }

  .${videoClassName}__duration {
    position: absolute;
    right: 5px;
    bottom: 8px;
    font-size: 12px;
    color: #fff;
    text-shadow: 0px 0px 10px #0000007a;
    line-height: 1;
    opacity: 1;
    pointer-events: none;

    .${videoClassName}--playing & {
      opacity: 0;
    }
  }

  .${videoClassName}__duration-bar {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    box-sizing: border-box;
    height: 6px;
    background-color: rgba(0, 0, 0, 0.65);
    pointer-events: none;
    touch-action: none;
  }

  .${videoClassName}__duration-volume {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 100%;
    background-color: #d9d9d9;
  }
`;

export interface VideoCardProps {
  size?: Size;

  showPlayIcon?: boolean;

  showDuration?: boolean;

  style?: React.CSSProperties;

  className?: string;

  active?: boolean;

  completed?: boolean;

  skipped?: boolean;

  src: string;

  title: React.ReactNode;

  onClick?: () => void;
}
export function VideoCard({
  size = {} as Size,
  src,
  onClick,
  className,
  showPlayIcon = true,
  showDuration = false,
  style = {},
  completed,
  title,
  skipped,
  active,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [playedTime, setPlayedTime] = useState<number>(0);
  const [isPlaying, togglePlaying] = useState<boolean>(false);
  const [loaded, toggleLoaded] = useState<boolean>(false);
  const [isVideoValid, toggleVideoValid] = useState<boolean>(true);

  const cardStyle = {
    ...size,
    ...style,
  };

  // *************** handlers start ****************
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) {
      return;
    }
    const currentTime = videoRef.current.currentTime;
    const value = +((currentTime / duration) * 100).toFixed(3);
    setPlayedTime(value > 100 ? 100 : value);
  }, [duration]);

  const handleMouseEnter = useCallback(() => {
    // 不设置muted刷新页面后会报这个错导致不能播放
    // play() failed because the user didn't interact with the document first
    togglePlaying(true);
    videoRef.current?.play().catch((err: any) => {
      // REVIEW
      window.console.log(err);
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    togglePlaying(false);
    videoRef.current?.pause();
  }, []);

  const handleCanPlay = useCallback(() => {
    // onCanPlay会执行很多次 这里只要第一次执行就好
    if (!loaded && videoRef.current) {
      toggleLoaded(true);
      setDuration(videoRef.current.duration);
    }
  }, [loaded]);

  const handleVideoError = useCallback(() => {
    toggleVideoValid(false);
  }, []);
  // *************** handlers end ****************

  const bodyNodes = isVideoValid ? (
    <>
      {showPlayIcon && !isPlaying && (
        <div className={`${videoClassName}__play`}>
          <PlayIcon className={`${videoClassName}__icon`} />
        </div>
      )}

      <video
        className={`${videoClassName}__video`}
        src={src}
        ref={videoRef}
        muted={true}
        onTimeUpdate={handleTimeUpdate}
        preload="preload"
        onCanPlay={handleCanPlay}
        onError={handleVideoError}
      />
      {showDuration && (
        <>
          <div className={`${videoClassName}__duration`}>{secondsToMinute(duration)}</div>
          <DurationBar value={playedTime} />
        </>
      )}
    </>
  ) : (
    <MediaError />
  );

  return (
    <VideoWrapper>
      <StatusCard completed={completed} active={active} skipped={skipped} onClick={onClick} title={title}>
        <StyledVideo
          isPlaying={isPlaying}
          className={className}
          style={cardStyle}
          onMouseOver={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {bodyNodes}
        </StyledVideo>
      </StatusCard>
    </VideoWrapper>
  );
}
