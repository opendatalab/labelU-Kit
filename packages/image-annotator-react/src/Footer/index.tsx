import styled from 'styled-components';
import { Tooltip } from '@labelu/components-react';
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
  background-color: #f7f7f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
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

  const handleAttrChange = (attr: 'contrast' | 'saturation' | 'brightness') => (value: number) => {
    engine?.backgroundRenderer?.attr(attr, value);
  };

  return (
    <ContentBody>
      <PropertyWrapper>
        <TitleWrapper>
          <SaturationIcon className="labelu-svg-icon" />
          饱和度
        </TitleWrapper>
        <Slider type="normal" max={100} min={-100} value={0} onChange={handleAttrChange('saturation')} />
      </PropertyWrapper>
      <PropertyWrapper>
        <TitleWrapper>
          <ContrastIcon className="labelu-svg-icon" />
          对比度
        </TitleWrapper>
        <Slider type="normal" max={100} min={-100} value={0} onChange={handleAttrChange('contrast')} />
      </PropertyWrapper>
      <PropertyWrapper>
        <TitleWrapper>
          <BrightnessIcon className="labelu-svg-icon" />
          曝光度
        </TitleWrapper>
        <Slider type="normal" max={100} min={-100} value={0} onChange={handleAttrChange('brightness')} />
      </PropertyWrapper>
    </ContentBody>
  );
}

export default function Footer() {
  const { engine } = useTool();

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
              defaultValue="#999999"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (engine?.backgroundRenderer) {
                  engine.backgroundRenderer.backgroundColor = e.target.value;
                }
              }}
            />
            背景颜色
          </BarItem>
        </label>
        <Tooltip overlay={<Content />} overlayStyle={tooltipStyle} placement="topLeft">
          <BarItem>
            <SettingIcon className="labelu-svg-icon" />
            图片调整
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
          适应窗口显示
        </BarItem>
        <BarItem
          onClick={() => {
            engine?.resetScale();
          }}
        >
          <ScaleResetIcon className="labelu-svg-icon" />
          按原图比例显示
        </BarItem>
        <BarItem onClick={handleRotate}>
          <RotateIcon className="labelu-svg-icon" />
          旋转
        </BarItem>
      </Right>
    </FooterBar>
  );
}
