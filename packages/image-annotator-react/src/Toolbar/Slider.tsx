import { useRef, useState } from 'react';
import styled from 'styled-components';

const THUMB_WIDTH = 16;

const Range = styled.div`
  position: relative;

  --range-width: 100%;

  --range-handle-color: #ffffff;
  --range-handle-size: ${() => `${THUMB_WIDTH}px`};

  --range-track-color: #f7f7f7;
  --range-track-height: 8px;
`;

const SliderThumbTriangle = styled.div`
  position: absolute;
  display: block;
  top: -5px;
  left: 24px;
  content: ' ';
  width: 0;
  height: 0;
  border-style: solid;
  border-right: 8px solid transparent;
  border-left: 8px solid transparent;
  border-top: 8px solid var(--range-handle-color);
  border-bottom: 0;
  background-color: transparent;
  box-shadow: none;
  z-index: 3;
  border-radius: 0;
  transform: translateX(-50%);
  cursor: pointer;
`;

const RangeInput = styled.input`
  -webkit-appearance: none;
  width: 100%;
  height: var(--range-track-height);
  border-radius: 5px;
  background-color: transparent;
  outline: none;
  padding: 0;
  margin: 0;

  &::-webkit-slider-thumb {
    position: relative;
    appearance: none;
    width: var(--range-handle-size);
    height: 12px;
    z-index: 3;
    border-radius: 3px 3px 0 0;
    transform: translateY(-20px);
    background: var(--range-handle-color);
    box-shadow: 1px 6px 10px 0px rgba(0, 0, 0, 0.5);
    cursor: pointer;
  }

  &::-moz-range-thumb {
    position: relative;
    appearance: none;
    width: var(--range-handle-size);
    height: 12px;
    z-index: 3;
    border-radius: 3px 3px 0 0;
    transform: translateY(-20px);
    background: var(--range-handle-color);
    box-shadow: 1px 6px 10px 0px rgba(0, 0, 0, 0.5);
    cursor: pointer;
  }
`;

const ExtraTrack = styled.div`
  position: absolute;
  z-index: 2;
  width: 100%;
  height: 100%;
`;

const Mark = styled.div<{ text: string | number }>`
  height: 8px;
  background-color: #000;
  position: absolute;
  top: -2px;
  left: 0;

  &:after {
    content: '${(props) => props.text}';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: #666;
    font-weight: bold;
  }
`;

const MarkWrapper = styled.div`
  background-color: var(--range-track-color);
  position: absolute;
  top: 0px;
  left: 0;
  height: 8px;

  ${Mark} {
    position: static;
    transform: translateX(50%);
    height: 12px;
  }

  display: flex;
  justify-content: center;
  align-items: center;
`;

const NormalRange = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  span {
    color: #666;
  }
`;

const NormalRangeInner = styled.div`
  flex: 1;
  position: relative;

  ${RangeInput} {
    background-color: #007aff;
    height: 2px;
    transform: translateY(-3px);
  }

  ${SliderThumbTriangle} {
    top: -5px;
  }
`;

const NormalValue = styled.span`
  position: absolute;
  top: 14px;
  transform: translateX(-50%);
  color: #333 !important;
`;

export interface SliderProps {
  name?: string;
  max: number;
  min: number;
  value: number;
  step?: number;
  onChange?: (value: number) => void;
  className?: string;
  type: 'mark' | 'fill' | 'normal';
}

export default function Slider({
  name,
  max,
  min,
  step = 1,
  value: propsValue,
  className,
  type = 'mark',
  onChange,
}: SliderProps) {
  const [value, setValue] = useState(`${propsValue}`);
  const range = max - min;
  const amount = range / step;
  const thumbRef = useRef<HTMLDivElement>(null);
  const ratio = (Number(value) - min) / range;

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange?.(Number(e.target.value));
  };

  if (type === 'normal') {
    return (
      <Range className={className}>
        <NormalRange>
          <span>{min}</span>
          <NormalRangeInner>
            <RangeInput
              onChange={handleOnChange}
              className="range-slider__range"
              value={value}
              type="range"
              name={name}
              min={min}
              max={max}
              step={step}
            />
            <SliderThumbTriangle
              style={{ left: `calc((100% - ${THUMB_WIDTH}px) * ${ratio} + ${THUMB_WIDTH / 2}px)` }}
              ref={thumbRef}
            />
            <NormalValue style={{ left: `calc((100% - ${THUMB_WIDTH}px) * ${ratio} + ${THUMB_WIDTH / 2}px)` }}>
              {value}
            </NormalValue>
          </NormalRangeInner>
          <span>{max}</span>
        </NormalRange>
      </Range>
    );
  }

  return (
    <Range className={className}>
      {type === 'mark' && (
        <ExtraTrack>
          {new Array(Math.floor(amount + 1)).fill(0).map((_, index) => {
            return (
              <MarkWrapper
                key={index}
                style={{
                  width: `calc((100% - ${THUMB_WIDTH}px) / ${amount})`,
                  transform: `translateX(-50%)`,
                  left: `calc(((100% - ${THUMB_WIDTH}px) * ${index}) / ${amount} + ${
                    THUMB_WIDTH / 2 - (index + 1) / 2
                  }px)`,
                }}
              >
                <Mark text={min + step * index} style={{ width: index + 1 }} />
              </MarkWrapper>
            );
          })}
        </ExtraTrack>
      )}

      {type === 'fill' && (
        <ExtraTrack>
          {new Array(Math.floor(amount + 1)).fill(0).map((_, index) => {
            const _value = (min + step * index).toFixed(1);

            return (
              <Mark
                style={{
                  width: `calc((100% - ${THUMB_WIDTH}px) / ${amount})`,
                  left: `calc(((100% - ${THUMB_WIDTH}px) * ${index}) / ${amount} + ${
                    THUMB_WIDTH / 2 - (index + 2) / 2
                  }px)`,
                  transform: `translateX(-50%)`,
                  opacity: _value,
                }}
                key={index}
                text={_value}
              />
            );
          })}
        </ExtraTrack>
      )}

      <RangeInput
        onChange={handleOnChange}
        className="range-slider__range"
        value={value}
        type="range"
        name={name}
        min={min}
        max={max}
        step={step}
      />
      <SliderThumbTriangle
        style={{ left: `calc((100% - ${THUMB_WIDTH}px) * ${ratio} + ${THUMB_WIDTH / 2}px)` }}
        ref={thumbRef}
      />
    </Range>
  );
}
