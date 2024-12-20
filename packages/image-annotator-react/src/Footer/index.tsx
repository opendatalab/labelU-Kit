import styled from 'styled-components';
import { Tooltip, useTranslation } from '@labelu/components-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useCallback } from 'react';

import { tooltipStyle } from '@/Toolbar';
import Slider from '@/Toolbar/Slider';
import { PropertyWrapper, TitleWrapper } from '@/Toolbar/ToolStyle';
import { useTool } from '@/context/tool.context';

import { ReactComponent as SettingIcon } from './assets/setting.svg';
import { ReactComponent as BrightnessIcon } from './assets/brightness.svg';
import { ReactComponent as ContrastIcon } from './assets/contrast.svg';
import { ReactComponent as SaturationIcon } from './assets/saturation.svg';
import { ReactComponent as ScaleResetIcon } from './assets/scale-reset.svg';
import { ReactComponent as FitContainerIcon } from './assets/fit-container.svg';
import { ReactComponent as RotateIcon } from './assets/rotate.svg';

const FooterBar = styled.div`
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(235, 236, 240, 1);
  padding: 0 16px;
  font-size: 14px;
  user-select: none;

  .labelu-svg-icon {
    font-size: 1.25rem;
    color: #666;
  }
`;

const Left = styled.div`
  display: flex;
  gap: 1rem;
`;

const Right = styled.div`
  display: flex;
  gap: 1rem;
`;

const BarItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  &:hover {
    color: var(--color-primary);

    .labelu-svg-icon {
      color: var(--color-primary);
    }
  }
`;

const ContentBody = styled.div`
  display: flex;
  flex-direction: column;
  width: 280px;
  padding: 1.5rem 1rem;
  gap: 2rem;

  ${PropertyWrapper} {
    width: auto;
  }

  .labelu-svg-icon {
    font-size: 1.25rem;
  }
`;

const ColorPicker = styled.input`
  border: 0;
  outline: none;
  width: 24px;
  height: 24px;
`;

function Content() {
  const { engine } = useTool();
  // @ts-ignore
  const { t } = useTranslation();

  const handleAttrChange = (attr: 'contrast' | 'saturation' | 'brightness') => (value: number) => {
    engine?.backgroundRenderer?.attr(attr, value);
  };

  return (
    <ContentBody>
      <PropertyWrapper>
        <TitleWrapper>
          <SaturationIcon className="labelu-svg-icon" />
          {t('saturation')}
        </TitleWrapper>
        <Slider type="normal" max={100} min={-100} value={0} onChange={handleAttrChange('saturation')} />
      </PropertyWrapper>
      <PropertyWrapper>
        <TitleWrapper>
          <ContrastIcon className="labelu-svg-icon" />
          {t('contrast')}
        </TitleWrapper>
        <Slider type="normal" max={100} min={-100} value={0} onChange={handleAttrChange('contrast')} />
      </PropertyWrapper>
      <PropertyWrapper>
        <TitleWrapper>
          <BrightnessIcon className="labelu-svg-icon" />
          {t('exposure')}
        </TitleWrapper>
        <Slider type="normal" max={100} min={-100} value={0} onChange={handleAttrChange('brightness')} />
      </PropertyWrapper>
    </ContentBody>
  );
}

export default function Footer() {
  const { engine } = useTool();
  // @ts-ignore
  const { t } = useTranslation();

  const handleRotate = useCallback(() => {
    const lastRotate = engine?.backgroundRenderer?.rotate || 0;
    engine.rotate(lastRotate + 90);
  }, [engine]);

  useHotkeys(
    'r',
    handleRotate,
    {
      preventDefault: true,
    },
    [handleRotate],
  );

  return (
    <FooterBar>
      <Left>
        <label>
          <BarItem>
            <ColorPicker
              type="color"
              name="background-color"
              defaultValue="#F0F0F0"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (engine?.backgroundRenderer) {
                  engine.backgroundRenderer.backgroundColor = e.target.value;
                }
              }}
            />
            {t('backgroundColor')}
          </BarItem>
        </label>
        <Tooltip overlay={<Content />} overlayStyle={tooltipStyle} placement="topLeft">
          <BarItem>
            <SettingIcon className="labelu-svg-icon" />
            {t('adjustment')}
          </BarItem>
        </Tooltip>
      </Left>
      <Right>
        <BarItem
          onClick={() => {
            engine?.fit();
          }}
        >
          <FitContainerIcon className="labelu-svg-icon" />
          {t('fitContainer')}
        </BarItem>
        <BarItem
          onClick={() => {
            engine?.resetScale();
          }}
        >
          <ScaleResetIcon className="labelu-svg-icon" />
          {t('rawScale')}
        </BarItem>
        <BarItem onClick={handleRotate}>
          <RotateIcon className="labelu-svg-icon" />
          {t('rotate')}
        </BarItem>
      </Right>
    </FooterBar>
  );
}
