import { CaretRightOutlined } from '@ant-design/icons';
import React, { useCallback, useRef, useState } from 'react';
import { secondsToMinute } from '@label-u/video-react';

import MediaError from '@/MediaError';

import StyledVideo, { videoClassName } from './styled';

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

export interface VideoCardProps {
  size?: Size;
  src: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  showPlayIcon?: boolean;
  showDuration?: boolean;
}

export function VideoCard({
  size = {} as Size,
  src,
  onClick,
  className,
  showPlayIcon = true,
  showDuration = true,
  style = {},
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
    const currentTime = videoRef.current?.currentTime() ?? 0;
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
      {showPlayIcon && (
        <div className={`${videoClassName}__play`}>
          <CaretRightOutlined className={`${videoClassName}__icon`} />
        </div>
      )}

      <video
        className={`${videoClassName}__video`}
        src={src}
        ref={videoRef}
        muted={true}
        onTimeUpdate={handleTimeUpdate}
        preload="preload"
        onMouseOver={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onCanPlay={handleCanPlay}
        onClick={onClick}
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
    <MediaError visible={!isVideoValid} />
  );

  return (
    <StyledVideo isPlaying={isPlaying} className={className} style={cardStyle}>
      {bodyNodes}
    </StyledVideo>
  );
}
