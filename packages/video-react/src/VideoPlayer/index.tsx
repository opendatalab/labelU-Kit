import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import type { PlayerControllerRef } from '@label-u/components-react';
import { PlayerController, VIDEO_PLAYBACK_RATE_SPEED } from '@label-u/components-react';

import './video-js.css';
import invalidVideoIcon from './icons/video-error.svg';

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
  onPlaying?: (time: number) => void;
  onStatusChange?: (isPlaying: boolean) => void;
  wrapperRef: React.ForwardedRef<HTMLDivElement | null>;
}

/**
 * 视频播放器
 * @param props
 * @returns
 */
export const VideoPlayer = memo(
  forwardRef<any, React.PropsWithChildren<IProps>>(
    (
      {
        src,
        paused,
        className,
        showControllers = true,
        children,
        onMetaDataLoad,
        onPlaying,
        onStatusChange,
        wrapperRef: propsWrapperRef,
      },
      ref,
    ) => {
      const playerRef = useRef<any>(null);
      const wrapperRef = useRef<HTMLDivElement>(null);
      const controllerRef = useRef<PlayerControllerRef>(null);
      const [playing, setPlaying] = useState<boolean>(false);
      const [duration, setDuration] = useState<number>(0);
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

        const onPause = () => {
          controllerRef.current?.pause();
        };

        const onPlay = () => {
          controllerRef.current?.play();
        };

        const onError = () => {
          console.log(playerRef.current?.error());
        };

        playerRef.current.off('pause', onPause);
        playerRef.current.off('play', onPlay);
        playerRef.current.off('error', onError);
        playerRef.current.on('pause', onPause);
        playerRef.current.on('play', onPlay);
        playerRef.current.on('error', onError);

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
      }, []);

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

      const togglePlaying = useCallback(
        (isPlay: boolean) => {
          if (!playerRef.current) {
            return;
          }

          onStatusChange?.(isPlay);

          if (isPlay) {
            playerRef.current.play();
          } else {
            playerRef.current.pause();
          }

          setPlaying(!playing);
        },
        [onStatusChange, playing],
      );

      const handleMetaDataOnLoad = useCallback(() => {
        setDuration(videoRef.current.duration);
        onMetaDataLoad?.(videoRef.current);
      }, [onMetaDataLoad]);

      const getCurrentTime = useCallback(() => {
        return playerRef.current?.currentTime() || 0;
      }, []);

      const handlePlaying = useCallback(
        (time: number) => {
          console.log('playing', time);
          onPlaying?.(time);
        },
        [onPlaying],
      );

      return (
        // @ts-ignore
        <StyledVideoPlayer className={className} ref={wrapperRef}>
          {/* @ts-ignore */}
          <div className={`${videoPlayerClassName}__wrap`} style={{ '--height': `${parentHeight}px` }}>
            <video
              className={`${videoPlayerClassName}__video video-js vjs-big-play-centered`}
              ref={videoRef}
              onLoadedMetadata={handleMetaDataOnLoad}
            />
            {children}
            {showControllers && (
              <PlayerController
                duration={duration}
                ref={controllerRef}
                type="video"
                onRateChange={handleRateChange}
                getCurrentTime={getCurrentTime}
                onPlaying={handlePlaying}
                onChange={togglePlaying}
              />
            )}
          </div>
        </StyledVideoPlayer>
      );
    },
  ),
);
