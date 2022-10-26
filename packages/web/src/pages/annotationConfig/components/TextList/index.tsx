// cl 2021/9/8 09:51
import React, { useState } from 'react';
import { Input, Button, Tooltip, Modal, Form } from 'antd';
import { cloneDeep } from 'lodash';
import { ExclamationCircleOutlined, SettingOutlined, CloseCircleFilled } from '@ant-design/icons';
// import { Config, defaultValue } from '../index';
import TextConfig from './textConfig';
import classnames from 'classnames';
import './index.less';
import { useTranslation } from 'react-i18next';

const { confirm } = Modal;

export const defaultValue = {
  label: '文本',
  key: 'text',
  required: false,
  default: '',
  maxLength: 1000
};
export type Config = typeof defaultValue;

interface ITextConfigItem {
  label: string;
  key: string;
  required: boolean;
  default: string;
  maxLength: number;
}

export type ItextConfig = Pick<ITextConfigItem, 'label' | 'default' | 'maxLength'>;

interface IProps {
  value?: ITextConfigItem[];
  onChange?: (value: ITextConfigItem[]) => void;
}

const TextList: React.FC<IProps> = ({ value, onChange }) => {
  const [configs, setConfigs] = useState<ITextConfigItem[]>([defaultValue]);
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const triggerChange = (list: ITextConfigItem[]) => {
    onChange?.(list);
  };

  const updateConfigItem = (newConfig: any, index: number) => {
    const textConfigListArray = cloneDeep(value || configs);
    Object.assign(textConfigListArray[index], newConfig);
    if (!value) {
      setConfigs(textConfigListArray);
    }
    triggerChange(textConfigListArray);
  };

  const addTextConfigItem = () => {
    const len = (value || configs).length;
    const newConfig = { ...defaultValue };
    newConfig.label += len + 1;
    newConfig.key += len + 1;
    if (!value) {
      setConfigs(state => [...state, newConfig]);
    }
    triggerChange([...(value || configs), newConfig]);
  };
  const deleteConfig = (index: number) => {
    (value || configs).splice(index, 1);
    let list = value || configs;
    if (list.length === 1 && list[0].key !== 'text') {
      list = [{ ...defaultValue }];
    }
    if (!value) {
      setConfigs([...list]);
    }
    triggerChange([...list]);
  };

  function showPromiseConfirm(obj: ItextConfig, index: number) {
    confirm({
      title: t('TextSettings'),
      icon: null,
      width: 600,
      content: <TextConfig form={form} label={obj.label} maxLength={obj.maxLength} default={obj.default} />,
      onOk() {
        return new Promise((resolve, reject) => {
          form.validateFields().then(values => {
            if (values) {
              updateConfigItem(values, index);
              resolve(true);
            } else {
              reject();
            }
          });
        });
      },
      onCancel() {}
    });
  }

  return (
    <div
      className={classnames({
        // selectedMain: true,
        sensebeeInputWrap: true
      })}
    >
      {(value || configs).map((i: Config, index: number) => (
        <div
          key={index}
          className={classnames({
            multiple: (value || configs).length > 1,
            textConfigItem: true
          })}
        >
          <span className="textConfigIndex">{index + 1}</span>
          <Input
            value={i.label}
            className={`textConfigInput sensebee-input`}
            placeholder={t('DisplayValue')}
            onChange={e => {
              updateConfigItem({ label: e.target.value }, index);
            }}
          />
          <Input
            value={i.key}
            className="textConfigInput"
            placeholder={t('SaveValue')}
            disabled={(value || configs).length === 1}
            onChange={e => {
              updateConfigItem({ key: e.target.value }, index);
            }}
          />
          <div className="textConfigIconBox">
            <Tooltip title={t('MoreSettings')}>
              <SettingOutlined
                className={classnames({ activeColor: i.default })}
                onClick={() =>
                  showPromiseConfirm(
                    {
                      label: i.label,
                      default: i.default,
                      maxLength: i.maxLength
                    },
                    index
                  )
                }
              />
            </Tooltip>

            {/* <Tooltip title='是否必填'>
              <ExclamationCircleOutlined
                className={classnames({ [styles.activeColor]: i.required })}
                onClick={() => {
                  updateConfigItem({ required: !i.required }, index);
                }} />
            </Tooltip> */}

            <CloseCircleFilled
              className="close"
              onClick={() => {
                deleteConfig(index);
              }}
            />
            <span />
          </div>
        </div>
      ))}
      <Button type='primary' style={{ marginTop: 10 }} onClick={addTextConfigItem} ghost>
        新建
      </Button>
    </div>
  );
};

export default TextList;
