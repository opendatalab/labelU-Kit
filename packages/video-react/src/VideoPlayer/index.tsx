import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';

import './video-js.css';
import { secondsToMinute } from '@/utils';

import invalidVideoIcon from './icons/video-error.svg';
import { ReactComponent as PauseIcon } from './icons/pause.svg';
import { ReactComponent as PlayIcon } from './icons/play.svg';
import SpeedController, { EPlayerType, VIDEO_PLAYBACK_RATE_SPEED } from './SpeedController';

/** 视频不支持的样式 */
const notSupportedErrorContent = () => {
  const errorImage = document.createElement('img');
  errorImage.src = invalidVideoIcon;

  const description = document.createElement('div');
  description.innerText = '暂不支持此编码的视频数据';

  const container = document.createElement('div');
  container.className = 'videojs-error-notSupported';

  container.appendChild(errorImage);
  container.appendChild(description);

  return container;
};

const defaultOptions = {
  playbackRates: VIDEO_PLAYBACK_RATE_SPEED,
  controls: false,
  controlBar: {
    children: ['progressControl'],
  },
};

const videoPlayerClassName = 'video-player';

const StyledVideoPlayer = styled.div.attrs((props) => ({
  ...props,
  className: videoPlayerClassName,
}))`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;

  .${videoPlayerClassName}__wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    text-align: center;
    height: var(--height);
  }

  .${videoPlayerClassName}__video {
    display: inline-block;
    flex-grow: 1;
    width: 100%;
    vertical-align: middle;
    outline: none;
    user-select: none;
  }

  .${videoPlayerClassName}__controllers {
    display: flex;
    align-items: center;
    padding: 0.75rem 0;
  }

  .${videoPlayerClassName}__play {
    font-size: 24px;
    cursor: pointer;
    display: flex;
  }

  .${videoPlayerClassName}__controller {
    margin: 0 16px;
  }
`;

interface IProps {
  src?: string;
  showControllers?: boolean;
  size?: {
    width: number;
    height: number;
  };
  paused?: boolean;
  className?: string;
  onMetaDataLoad?: (videoRef: HTMLVideoElement) => void;
  children?: React.ReactNode;
  onPlaying?: (playerInstance: any) => void;
  onPause?: (playerInstance: any) => void;
  onStatusChange?: (isPlaying: boolean) => void;
  wrapperRef: React.ForwardedRef<HTMLDivElement | null>;
}

/**
 * 视频播放器
 * @param props
 * @returns
 */
const VideoPlayer = forwardRef<any, React.PropsWithChildren<IProps>>(
  (
    {
      src,
      paused,
      className,
      showControllers = true,
      children,
      onMetaDataLoad,
      onPlaying,
      onPause,
      onStatusChange,
      wrapperRef: propsWrapperRef,
    },
    ref,
  ) => {
    const playerRef = useRef<any>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [playing, setPlaying] = useState<boolean>(false);
    const [current, setCurrent] = useState<number>(0);
    const [, setLoaded] = useState<boolean>(false);
    const videoRef = useRef<any>(undefined); // 记录slider拖动前是否正在播放
    const [parentHeight, setParentHeight] = useState<number>(0);

    useLayoutEffect(() => {
      if (!wrapperRef.current) {
        return;
      }

      setParentHeight(wrapperRef.current.clientHeight);
    }, []);

    // 暴露给 ref 的一些方法
    useImperativeHandle(
      ref,
      () => {
        return playerRef.current;
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [playerRef.current],
    );

    useImperativeHandle(
      propsWrapperRef,
      () => {
        return wrapperRef.current as HTMLDivElement;
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [wrapperRef.current],
    );

    const handlePlayerReady = useCallback(() => {
      if (!playerRef.current) {
        return;
      }

      playerRef.current.on('play', () => {
        setPlaying(true);
        onStatusChange?.(true);
      });
      playerRef.current.on('pause', () => {
        setPlaying(false);
        onStatusChange?.(false);
      });
      playerRef.current.on('error', () => {
        console.log(playerRef.current?.error());
      });
      playerRef.current.on('loadeddata', () => {
        setLoaded(true);
      });

      /**
       * 改写错误显示方法
       * sourceLine: https://github.com/videojs/video.js/blob/master/src/js/error-display.js#L10 line:47
       */
      playerRef.current.errorDisplay.content = () => {
        let error;
        if (playerRef.current) {
          error = playerRef.current.error();

          if (error?.code === 4) {
            return notSupportedErrorContent();
          }

          return error ? playerRef.current.localize(error.message) : '';
        }
        return 'Unknown Error';
      };
    }, [onStatusChange]);

    /** 实例化videojs */
    useEffect(() => {
      if (!videoRef.current || !document.contains(videoRef.current)) {
        return;
      }
      import('video.js').then((m) => {
        if (playerRef.current) {
          playerRef.current.src([
            {
              src,
              type: 'video/mp4',
            },
          ]);
        } else {
          playerRef.current = m.default(
            videoRef.current,
            {
              ...defaultOptions,
              sources: src
                ? [
                    {
                      src,
                      type: 'video/mp4',
                    },
                  ]
                : [],
            },
            handlePlayerReady,
          );
        }
      });
    }, [src, handlePlayerReady, videoRef, parentHeight]);

    useEffect(() => {
      if (paused) {
        setPlaying(false);
      }
    }, [paused]);

    useEffect(() => {
      const player = playerRef.current;

      return () => {
        if (player) {
          player.dispose();
          playerRef.current = null;
        }
      };
    }, [playerRef]);

    const initProcessPosition = () => {
      const processDom: HTMLDivElement | null = document.querySelector('.video-player-progressWrap');
      if (!processDom) {
        return;
      }
      const { offsetTop, offsetHeight, offsetLeft, offsetWidth } = videoRef.current;
      processDom.style.top = `${offsetTop + offsetHeight - 52}px`;
      processDom.style.left = `${offsetLeft}px`;
      processDom.style.width = `${offsetWidth}px`;
    };

    useEffect(() => {
      window.addEventListener('resize', initProcessPosition);
      return () => {
        window.removeEventListener('resize', initProcessPosition);
      };
    }, []);

    const handleRateChange = useCallback((rate: number) => {
      playerRef.current?.playbackRate(rate);
    }, []);

    const togglePlaying = useCallback(() => {
      if (!playerRef.current) {
        return;
      }
      if (playing) {
        playerRef.current.pause();

        if (typeof onPause === 'function') {
          onPause(playerRef.current);
        }
      } else {
        playerRef.current.play();
      }

      setPlaying(!playing);
    }, [onPause, playing]);

    /** 更新进度 */
    const frameIdRef = useRef<number | null>(null);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const updateProgress = useCallback(() => {
      if (!playing) {
        return;
      }

      const totalTime = playerRef.current?.duration() || 0;
      const currentTime = playerRef.current?.currentTime() || 0;

      if (typeof onPlaying === 'function') {
        onPlaying(playerRef.current);
      }

      setRemainingTime(isNaN(totalTime) ? 0 : Math.max(totalTime - currentTime, 0));
      setCurrent(currentTime);

      frameIdRef.current = requestAnimationFrame(updateProgress);
    }, [onPlaying, playing]);

    useEffect(() => {
      frameIdRef.current = requestAnimationFrame(updateProgress);
      return () => {
        cancelAnimationFrame(frameIdRef.current!);
      };
    }, [updateProgress]);

    const playNode = (
      <div className="video-player__controller video-player__play" onClick={togglePlaying}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </div>
    );

    const durationNode = (
      <div className="video-player__controller video-player__duration">
        {secondsToMinute(current)} / -{secondsToMinute(remainingTime)}
      </div>
    );

    return (
      // @ts-ignore
      <StyledVideoPlayer className={className} ref={wrapperRef}>
        {/* @ts-ignore */}
        <div className={`${videoPlayerClassName}__wrap`} style={{ '--height': `${parentHeight}px` }}>
          <video
            className={`${videoPlayerClassName}__video video-js vjs-big-play-centered`}
            ref={videoRef}
            onLoadedMetadata={() => onMetaDataLoad?.(videoRef.current)}
          />
          {children}
          {showControllers && (
            <div className={`${videoPlayerClassName}__controllers`}>
              {playNode}
              {durationNode}
              <SpeedController playerType={EPlayerType.Video} onChange={handleRateChange} />
              <div className={`${videoPlayerClassName}__play`} />
            </div>
          )}
        </div>
      </StyledVideoPlayer>
    );
  },
);

export default React.memo(VideoPlayer);
