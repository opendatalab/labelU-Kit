import styled from 'styled-components';
import { useCallback } from 'react';
import { useTranslation } from '@labelu/components-react';

// import { useAnnotator } from '@/context';

import { useTool } from '@/context/tool.context';

import Slider from './Slider';
import { ReactComponent as StrokeWidthIcon } from './assets/stroke-width.svg';
import { ReactComponent as OpacityStrokeIcon } from './assets/opacity-stroke.svg';
import { ReactComponent as OpacityFillIcon } from './assets/opacity-fill.svg';

export const PropertyWrapper = styled.div`
  position: relative;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: 1rem;
`;

const SliderWrapper = styled.div`
  padding: 0 0.75rem;
`;

export const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export default function ToolStyle() {
  const { engine } = useTool();
  // @ts-ignore
  const { t } = useTranslation();

  const handleStrokeWidthChange = useCallback(
    (value: number) => {
      engine.strokeWidth = value;
    },
    [engine],
  );

  const handleStrokeOpacityChange = useCallback(
    (value: number) => {
      engine.strokeOpacity = value;
    },
    [engine],
  );

  const handleFillOpacityChange = useCallback(
    (value: number) => {
      engine.fillOpacity = value;
    },
    [engine],
  );

  return (
    <Wrapper>
      <PropertyWrapper>
        <TitleWrapper>
          <StrokeWidthIcon />
          {t('strokeWidth')}
        </TitleWrapper>
        <SliderWrapper style={{ padding: '0 0.75rem' }}>
          <Slider type="mark" max={5} min={1} value={2} step={1} onChange={handleStrokeWidthChange} />
        </SliderWrapper>
      </PropertyWrapper>
      <PropertyWrapper>
        <TitleWrapper>
          <OpacityStrokeIcon />
          {t('strokeOpacity')}
        </TitleWrapper>
        <SliderWrapper style={{ padding: '0 0.75rem' }}>
          <Slider type="fill" max={0.9} min={0.1} value={0.9} step={0.2} onChange={handleStrokeOpacityChange} />
        </SliderWrapper>
      </PropertyWrapper>
      <PropertyWrapper>
        <TitleWrapper>
          <OpacityFillIcon />
          {t('fillOpacity')}
        </TitleWrapper>
        <SliderWrapper style={{ padding: '0 0.75rem' }}>
          <Slider type="fill" max={0.9} min={0.1} value={0.7} step={0.2} onChange={handleFillOpacityChange} />
        </SliderWrapper>
      </PropertyWrapper>
    </Wrapper>
  );
}
