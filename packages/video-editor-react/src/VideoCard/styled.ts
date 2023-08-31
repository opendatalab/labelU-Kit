import styled, { css } from 'styled-components';

export interface StyledVideoProps {
  isPlaying?: boolean;
  className?: string;
}

export const videoClassName = 'video-card';

const StyledVideo = styled.div.attrs((props: StyledVideoProps) => ({
  ...props,
  className: `${videoClassName} ${props.className || ''}` as string,
}))`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #e9e9e9;
  cursor: pointer;

  .${videoClassName}__video {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  ${({ isPlaying }: StyledVideoProps) =>
    isPlaying
      ? css`
          &--playing {
            font-size: unset;
          }
        `
      : ''}

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
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    opacity: 1;
    pointer-events: none;

    .${videoClassName}--playing & {
      opacity: 0;
    }
  }

  .${videoClassName}__icon {
    color: white;
    font-size: 26px;
  }

  .${videoClassName}__duration {
    position: absolute;
    right: 5px;
    bottom: 8px;
    font-size: 10px;
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

export default StyledVideo;
