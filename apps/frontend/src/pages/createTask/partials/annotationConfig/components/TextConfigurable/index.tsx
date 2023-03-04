// import { ETextType, TEXT_TYPE } from '@/constant/store';
import { Select as SenseSelect, Input as SenseInput, Switch } from 'antd';
import React, { useState } from 'react';

// 文本标注类型
export enum ETextType {
  AnyString, // 任意字符
  Order, // 序号
  EnglishOnly, // 仅英文
  NumberOnly, // 仅数字
  CustomFormat, // 自定义文本格式
}

export const TEXT_TYPE = {
  0: 'AnyString',
  1: 'OrderString',
  2: 'EnglishOnly',
  3: 'NumbersOnly',
  4: 'CustomFormat',
};

export const translate = {
  AnyString: '任意字符',
  OrderString: '序号',
  EnglishOnly: '仅英文',
  NumbersOnly: '仅数字',
  CustomFormat: '自定义文本格式',
};

interface ITextConfigurableValue {
  textConfigurable?: boolean;
  textCheckType?: string;
  customFormat?: string;
}
interface IProps {
  value?: ITextConfigurableValue;
  onChange?: (value: ITextConfigurableValue) => void;
}

const TextConfigurable: React.FC<IProps> = ({ value = {}, onChange }) => {
  const [textConfigurable, setTextConfigurable] = useState(false);
  const [textCheckType, setTextCheckType] = useState(ETextType.AnyString);
  const [customFormat, setCustomFormat] = useState('');

  const triggerChange = (changeValue: any) => {
    onChange?.({ textConfigurable, textCheckType, customFormat, ...value, ...changeValue });
  };

  const onSwitchChange = (newTextConfigurable: boolean) => {
    if (!('textConfigurable' in value)) {
      setTextConfigurable(newTextConfigurable);
    }
    triggerChange({ textConfigurable: newTextConfigurable });
  };
  const onSelectChange = (newTextCheckType: keyof typeof TEXT_TYPE) => {
    if (!('textCheckType' in value)) {
      setTextCheckType(newTextCheckType);
    }
    triggerChange({ textCheckType: newTextCheckType });
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCustomFormat = e.target.value;
    if (!('customFormat' in value)) {
      setCustomFormat(newCustomFormat);
    }
    triggerChange({ customFormat: newCustomFormat });
  };
  return (
    <>
      <div className="switchMain">
        <Switch checked={value.textConfigurable} onChange={onSwitchChange} />
      </div>
      {(value.textConfigurable || textConfigurable) && (
        <>
          <SenseSelect
            style={{ width: '100%', marginTop: '24px' }}
            value={~~(value.textCheckType ?? ETextType.AnyString) as ETextType}
            onChange={onSelectChange}
          >
            {Object.entries(TEXT_TYPE).map((item) => (
              <SenseSelect.Option value={~~item[0]} key={~~item[0]}>
                {
                  // @ts-ignore
                  translate[item[1]]
                }
              </SenseSelect.Option>
            ))}
          </SenseSelect>

          {(value.textCheckType || textCheckType) === ETextType.CustomFormat && (
            <SenseInput
              placeholder="请输入正则表达式"
              style={{ width: '100%', marginTop: '24px' }}
              value={value.customFormat ?? customFormat}
              onChange={onInputChange}
            />
          )}
        </>
      )}
    </>
  );
};
export default TextConfigurable;
