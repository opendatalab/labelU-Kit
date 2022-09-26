import { Form, Switch } from 'antd';
import React, { FC } from 'react';
import { MapStateJSONTab } from '../AttributeConfig';
import TextConfigurable, { ETextType } from '../TextConfigurable';

const CommonFormItem: FC = () => {
  const isAllReadOnly = false;
  //   const [drawOutsideTarget, setDrawOutsideTarget] = useState<boolean>(false);
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
  const [form] = Form.useForm();
  return (
    <div style={{ marginTop: 10 }}>
      <Form
        {...formItemLayout}
        form={form}
        name="commonConfig"
        initialValues={{
          changeAttribute: false,
          description: false,
          attributeList: []
        }}
      >
        <Form.Item
          valuePropName="checked"
          label={<span className="formTitle">目标外标注</span>}
          name="drawOutsideTarget"
          initialValue={false}
        >
          <Switch disabled={isAllReadOnly} />
        </Form.Item>
        <Form.Item
          valuePropName="checked"
          label={<span className="formTitle">属性配置</span>}
          name="commonAttributeConfigurable"
          initialValue={false}
        >
          <Switch disabled={isAllReadOnly} />
        </Form.Item>

        <Form.Item noStyle shouldUpdate>
          {() => {
            console.log(form?.getFieldValue('commonAttributeConfigurable'));
            return (
              form?.getFieldValue('commonAttributeConfigurable') && (
                <Form.Item
                  label=" "
                  name="attribute"
                  initialValue={[
                    {
                      key: '类别1',
                      value: '类别1'
                    }
                  ]}
                >
                  <MapStateJSONTab isAttributeList={true} readonly={isAllReadOnly} />
                </Form.Item>
              )
            );
          }}
        </Form.Item>
        <Form.Item
          label={<span className="formTitle">属性配置</span>}
          name="textConfigurableContext"
          initialValue={{
            textConfigurable: false,
            textCheckType: ETextType.AnyString,
            customFormat: ''
          }}
        >
          <TextConfigurable />
        </Form.Item>
      </Form>
    </div>
  );
};

export default CommonFormItem;
