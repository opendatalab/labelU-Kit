import { BasicConfig } from '@label-u/components';
import React, { FC, useMemo, useState } from 'react';
import { Form, FormInstance, Select, Input } from 'antd';
import { MapStateJSONTab } from '../../components/AttributeConfig';
import SvgIcon from '../../../../components/basic/svgIcon';
import { AttributeItem } from './rectConfigForm';
const { Option } = Select;

interface FormPointConfig {
  upperLimit: number;
  attributeList: AttributeItem[];
}

const PointConfigForm: FC<BasicConfig> = props => {
  // const minWidth = 1,
  //   minHeight = 1;
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
  const [initVal, setInitVal] = useState<FormPointConfig>({} as FormPointConfig);

  useMemo(() => {
    console.log(props);
    let initV = {
      // @ts-ignore
      upperLimit: props.config.upperLimit ? props.config.upperLimit : 10,
      // @ts-ignore
      attributeList: props.config.attributeList
        ? // @ts-ignore
          props.config.attributeList
        : [
            {
              key: 'tag1',
              label: 'tag1'
            }
          ]
    };

    setInitVal(initV);
  }, []);

  return (
    <div>
      <div className="selectedMain">
        <Form {...formItemLayout}>
          <Form.Item
            name="upperLimit"
            label="上限点数"
            rules={[
              {
                required: true,
                message: 'Please select lineType!'
              }
            ]}
            initialValue={initVal.upperLimit}
          >
            <Input />
          </Form.Item>

          <Form.Item label="标签配置" name="attributeList" initialValue={initVal.attributeList}>
            <MapStateJSONTab isAttributeList={true} readonly={isAllReadOnly} />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default PointConfigForm;
