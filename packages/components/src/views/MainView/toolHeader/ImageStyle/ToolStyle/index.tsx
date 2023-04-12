import { Slider } from 'antd/es';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { keys } from 'lodash-es';
import styled from 'styled-components';

import widthSvg from '@/assets/toolStyle/icon_border.svg';
import colorSvg from '@/assets/toolStyle/icon_borderColor.svg';
import borderOpacitySvg from '@/assets/toolStyle/icon_opacityStroke.svg';
import fillOpacitySvg from '@/assets/toolStyle/icon_opacityFill.svg';
import ViewContext from '@/view.context';
import type { ToolStyle } from '@/interface/base';
import slideIcon from '@/assets/cssIcon/slide_btn.svg';

const StyledSlider = styled.div`
  .ant-slider-handle {
    background-image: url(${() => slideIcon});
    background-repeat: no-repeat;
    background-size: 30px 30px;
    width: 40px;
    height: 40px;
    background-color: transparent;
    border-color: transparent;
    background-position: 3px 2px;
    margin-top: -15px;

    &::after,
    &::before {
      display: none;
    }
  }

  .ant-slider-handle:focus {
    box-shadow: none;
  }

  .ant-slider-rail {
    height: 8px;
  }

  #style_fillOpacity,
  #style_borderOpacity {
    .ant-slider-rail {
      background: linear-gradient(
        to right,
        rgb(0 0 0 / 20%) 0%,
        rgb(0 0 0 / 20%) 20%,
        rgb(0 0 0 / 40%) 20%,
        rgb(0 0 0 / 40%) 40%,
        rgb(0 0 0 / 60%) 40%,
        rgb(0 0 0 / 60%) 60%,
        rgb(0 0 0 / 80%) 60%,
        rgb(0 0 0 / 80%) 80%,
        rgb(0 0 0 / 100%) 80%,
        rgb(0 0 0 / 100%) 100%
      );
    }

    .ant-slider-dot {
      display: none;
    }
  }

  #style_width {
    .ant-slider-dot {
      height: 12px;
      background: #666666;
      border-radius: 0;
      margin-left: -2px;
      border: none;
    }
    .ant-slider-dot:nth-of-type(1) {
      width: 1px;
    }

    .ant-slider-dot:nth-of-type(2) {
      width: 2px;
    }

    .ant-slider-dot:nth-of-type(3) {
      width: 3px;
    }

    .ant-slider-dot:nth-of-type(4) {
      width: 4px;
    }

    .ant-slider-dot:nth-of-type(5) {
      width: 5px;
    }
  }

  .style-slider {
    margin-bottom: 12px;
  }

  .ant-slider-track {
    background-color: transparent;
  }

  .ant-slider:hover .ant-slider-track {
    background-color: transparent;
  }
`;

const enlargeToolParam = (params: Record<string, number>): Partial<ToolStyle> => {
  const key = keys(params)![0];
  if (!key) return params;
  const res: Record<string, number> = {};
  switch (key) {
    case 'borderOpacity':
      res[key] = params[key] * 10;
      break;
    case 'fillOpacity':
      res[key] = params[key] * 10;
      break;
    default:
      res[key] = params[key];
  }
  return res;
};

const shrinkToolParam = (key: string, value: number) => {
  if (!key) return value;
  let res = value;
  switch (key) {
    case 'borderOpacity':
      res = value / 10;
      break;
    case 'fillOpacity':
      res = value / 10;
      break;
  }
  return res;
};

const getMarks = (type: string, t: any) => {
  const lineMarks = [
    { step: 1, value: '1' },
    { step: 2, value: '2' },
    { step: 3, value: '3' },
    { step: 4, value: '4' },
    { step: 5, value: '5' },
  ];
  const colorMarks = [
    { step: 1, value: 'Blue' },
    { step: 3, value: 'Cyan' },
    { step: 5, value: 'Green' },
    { step: 7, value: 'Yellow' },
    { step: 9, value: 'Pink' },
  ];
  const borderOpacityMarks = [
    { step: 0.1, value: '0.1' },
    { step: 0.3, value: '0.3' },
    { step: 0.5, value: '0.5' },
    { step: 0.7, value: '0.7' },
    { step: 0.9, value: '0.9' },
  ];

  const fillOpacityMarks = [
    { step: 0.1, value: '0.1' },
    { step: 0.3, value: '0.3' },
    { step: 0.5, value: '0.5' },
    { step: 0.7, value: '0.7' },
    { step: 0.9, value: '0.9' },
  ];
  let list: { step: number; value: string }[] = [];
  const marks: Record<
    number,
    {
      style: {};
      label: any;
    }
  > = {};
  switch (type) {
    case 'width':
      list = lineMarks;
      break;
    case 'color':
      list = colorMarks;
      break;
    case 'borderOpacity':
      list = borderOpacityMarks;
      break;
    case 'fillOpacity':
      list = fillOpacityMarks;
      break;
  }
  list.forEach(({ step, value }) => {
    marks[step] = {
      style: { color: '#999999', fontSize: '12px' },
      label: <span>{t(value)}</span>,
    };
  });
  return marks;
};

const getTitle = (title: string) => {
  switch (title) {
    case 'width':
      return 'BorderThickness';
    case 'color':
      return 'Color';
    case 'borderOpacity':
      return 'BorderOpacity';
    case 'fillOpacity':
      return 'FillOpacity';
    default:
      return '';
  }
};
const getImage = (title: string) => {
  switch (title) {
    case 'width':
      return widthSvg;
    case 'color':
      return colorSvg;
    case 'borderOpacity':
      return borderOpacitySvg;
    case 'fillOpacity':
      return fillOpacitySvg;
  }
};
const getDefaultValue = (value: string) => {
  switch (value) {
    case 'width':
      return 2;
    case 'color':
      return 1;
    case 'borderOpacity':
      return 0.9;
    case 'fillOpacity':
      return 9;
  }
};

/**
 * 判断使用那种样式 (slider的step中间为选中和step为选中)
 * @param info TToolStyleConfig
 */
const getStyleType = (info: string): boolean => ['width', 'color'].includes(info);

const HeaderToolStyle = () => {
  const { toolStyle, setToolStyle } = useContext(ViewContext);
  const { width, borderOpacity, fillOpacity } = toolStyle;
  const styleConfig = {
    width,
    borderOpacity,
    fillOpacity,
  };
  const { t } = useTranslation();

  const changeToolStyle = (params: Partial<ToolStyle>) => {
    setToolStyle((pre) => ({
      ...pre,
      ...enlargeToolParam(params),
    }));
  };

  return (
    <StyledSlider className="toolStyle">
      {Object.entries(styleConfig).map((item: any[], index) => {
        const key: keyof ToolStyle = item[0];

        return (
          <div id={`style_${key}`} className={`style-slider ${index > 0 ? 'style-slider__opacity' : ''}`} key={key}>
            <span className="title" style={{ fontSize: 16 }}>
              <img src={getImage(key)} className="icon" style={{ width: 16, marginRight: 10 }} />
              {t(getTitle(key))}
            </span>
            <span className="slider">
              <Slider
                tipFormatter={null}
                max={getStyleType(key) ? 5 : 1}
                min={getStyleType(key) ? 1 : 0}
                step={getStyleType(key) ? 1 : 1}
                value={(shrinkToolParam(key, toolStyle[key] as number) ?? getDefaultValue(key)) as number}
                marks={getMarks(key, t)}
                onChange={(e: any) => changeToolStyle({ [key]: e })}
              />
            </span>
          </div>
        );
      })}
    </StyledSlider>
  );
};

export default HeaderToolStyle;
