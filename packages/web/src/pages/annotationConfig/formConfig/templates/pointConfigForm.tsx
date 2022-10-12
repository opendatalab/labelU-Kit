import { BasicConfig } from '@label-u/components';
import React, { FC, useMemo, useState } from 'react';
import { Form, Input } from 'antd';
import { MapStateJSONTab } from '../../components/AttributeConfig';
// import SvgIcon from '../../../../components/basic/svgIcon';
import { AttributeItem } from './rectConfigForm';
import { useForm } from 'antd/es/form/Form';
// const { Option } = Select;
import { delayTime } from '../constants';
interface FormPointConfig {
  upperLimit: number;
  attributeList: AttributeItem[];
}

const PointConfigForm: FC<BasicConfig & { name: string }> = props => {
  const [form] = useForm();
  const isAllReadOnly = false;
  const formItemLayout = {
    labelCol: {
      xs: {
        span: 24
      },
      sm: {
        span: 4
      }
    },
    wrapperCol: {
      xs: {
        span: 24
      },
      sm: {
        span: 16
      }
    }
  };
  const { children } = props;
  const [initVal, setInitVal] = useState<FormPointConfig>({
    upperLimit: 10,
    attributeList: [
      {
        key: 'pointTool',
        value: 'pointTool'
      }
    ]
  } as FormPointConfig);

  useMemo(() => {
    if (props.config) {
      let initV = {
        // @ts-ignore
        upperLimit: props.config.upperLimit ? props.config.upperLimit : 10,
        // @ts-ignore
        attributeList: props.config.attributeList
          ? // @ts-ignore
            props.config.attributeList
          : [
              {
                key: 'pointTool',
                value: 'pointTool'
              }
            ]
      };

      setInitVal(initV);
    }
  }, []);

  // @ts-ignore
  const formSubmitThrottle = window.throttle(() => {
    form.submit();
  }, delayTime);

  return (
    <div>
      <div className="selectedMain">
        <Form {...formItemLayout} name={props.name} form={form} onChange={formSubmitThrottle}>
          <Form.Item name="upperLimit" label="上限点数" initialValue={initVal.upperLimit}>
            <Input />
          </Form.Item>

          <Form.Item label="标签配置" name="attributeList" initialValue={initVal.attributeList}>
            <MapStateJSONTab
              onSubmitAction={() => {
                form.submit();
              }}
              isAttributeList={true}
              readonly={isAllReadOnly}
            />
          </Form.Item>
        </Form>
        {children}
      </div>
    </div>
  );
};

export default PointConfigForm;
