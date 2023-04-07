import { Col, Row, Slider, Input } from 'antd/es';
import { throttle } from 'lodash-es';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import saturationSvg from '@/assets/annotation/image/saturation.svg';
import contrastSvg from '@/assets/annotation/image/contrast.svg';
import brightnessSvg from '@/assets/annotation/image/brightness.svg';
import ViewContext from '@/view.context';
import type { ImageAttribute } from '@/interface/base';

const ImgAttributeInfo = () => {
  const { t } = useTranslation();
  const { imageAttribute, setImageAttribute } = useContext(ViewContext);

  const imgAttributeChange = throttle(
    (payload: Partial<ImageAttribute>) => {
      setImageAttribute((pre) => ({
        ...pre,
        ...payload,
      }));
    },
    60,
    { trailing: true },
  );

  const imgAttributeInfo = [
    {
      name: 'Saturation',
      min: -100,
      max: 500,
      step: 2,
      onChange: (v: number) => imgAttributeChange({ saturation: v }),
      value: imageAttribute.saturation,
      svg: saturationSvg,
    },
    {
      name: 'Contrast',
      min: -100,
      max: 300,
      step: 2,
      onChange: (v: number) => imgAttributeChange({ contrast: v }),
      value: imageAttribute.contrast,
      svg: contrastSvg,
    },
    {
      name: 'Exposure',
      min: -100,
      max: 400,
      step: 2,
      onChange: (v: number) => imgAttributeChange({ brightness: v }),
      value: imageAttribute.brightness,
      svg: brightnessSvg,
    },
  ];

  return (
    <div>
      {imgAttributeInfo.map((info: any, index: number) => (
        <div className="imgAttributeController" key={`option_${index}`}>
          <Row className="tools" style={{ padding: '0px 0' }}>
            <Col span={24}>
              <span className="singleTool">
                <img width={16} height={16} src={info.svg} />
                <span className="toolName">{t(info.name)}</span>
              </span>
            </Col>
          </Row>
          <Row>
            <Col span={20}>
              <Slider
                min={info.min}
                max={info.max}
                step={info.step}
                value={info.value}
                onChange={info.onChange}
                trackStyle={{ background: '#1B67FF' }}
              />
            </Col>
            <Col span={4}>
              <Input
                value={info.value}
                disabled
                style={{
                  fontSize: 12,
                  marginBottom: 23,
                  padding: '0px 2px',
                  textAlign: 'center',
                }}
              />
            </Col>
          </Row>
        </div>
      ))}
    </div>
  );
};

export default ImgAttributeInfo;
