import { Attribute } from '@label-u/annotation';
import { Form, Switch } from 'antd';
import React, { FC, useMemo, useState } from 'react';
import { MapStateJSONTab } from '../AttributeConfig';
import TextConfigurable from '../TextConfigurable';

interface CommonFormConf {
  attribute: Attribute[];
  drawOutsideTarget: boolean;
  textCheckType: number;
  customFormat: string;
  textConfigurable: boolean;
  commonAttributeConfigurable: boolean;
}

const CommonFormItem: FC<CommonFormConf & { name: string; toolName: string; isShow: boolean }> = props => {
  const isAllReadOnly = false;
  const [form] = Form.useForm();
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
  const [initVal, setInitVal] = useState<CommonFormConf>();

  useMemo(() => {
    if (props) {
      const tmpInitV = {
        attribute: props.attribute,
        drawOutsideTarget: props.drawOutsideTarget,
        textCheckType: props.textCheckType,
        customFormat: props.customFormat,
        textConfigurable: props.textConfigurable,
        commonAttributeConfigurable: props.commonAttributeConfigurable
      };
      setInitVal(tmpInitV);
    }
  }, [props]);

  if (!props.isShow) {
    return <></>;
  }
  return (
    <div style={{ marginTop: 10 }}>
      {initVal && (
        <Form
          {...formItemLayout}
          onChange={e => {
            form.submit();
          }}
          form={form}
          name={props.name}
        >
          {props.toolName !== 'lineTool' && (
            <Form.Item
              valuePropName="checked"
              label={<span className="formTitle">目标外标注</span>}
              name="drawOutsideTarget"
              initialValue={initVal.drawOutsideTarget}
            >
              <Switch
                onChange={e => {
                  form.submit();
                }}
                disabled={isAllReadOnly}
              />
            </Form.Item>
          )}

          <Form.Item
            valuePropName="checked"
            label={<span className="formTitle">通用标签</span>}
            name="commonAttributeConfigurable"
            initialValue={initVal.commonAttributeConfigurable}
          >
            <Switch disabled={isAllReadOnly} />
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {() => {
              return (
                form?.getFieldValue('commonAttributeConfigurable') && (
                  <Form.Item label=" " name="attribute" initialValue={initVal.attribute}>
                    <MapStateJSONTab
                      onChange={e => {
                        form.submit();
                      }}
                      isAttributeList={true}
                      readonly={isAllReadOnly}
                    />
                  </Form.Item>
                )
              );
            }}
          </Form.Item>
          <Form.Item
            label={<span className="formTitle">属性配置</span>}
            name="textConfigurableContext"
            initialValue={{
              textConfigurable: initVal.textConfigurable,
              textCheckType: initVal.textCheckType,
              customFormat: initVal.customFormat
            }}
          >
            <TextConfigurable
              onChange={e => {
                form.submit();
              }}
            />
          </Form.Item>
        </Form>
      )}
    </div>
  );
};

export default CommonFormItem;
