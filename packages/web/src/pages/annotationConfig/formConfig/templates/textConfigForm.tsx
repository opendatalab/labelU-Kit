import { TextConfig } from '@label-u/components';
import React, { FC, useMemo, useState } from 'react';
import { Form } from 'antd';
import TextList from '../../components/TextList';
import { useForm } from 'antd/lib/form/Form';

interface TextConfigProp {
  textConfig: TextConfig;
}

const TextConfigForm: FC<TextConfigProp & { name: string }> = props => {
  const [form] = useForm();
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

  const [initVal, setInitVal] = useState<TextConfig>([
    {
      label: '文本',
      key: 'text',
      required: false,
      default: '',
      maxLength: 1000
    }
  ]);

  // 表单提交处理
  const finish = (value: any) => {
    form.setFieldsValue({ textConfig: value });
    form.submit();
  };

  useMemo(() => {
    if (props) {
      let initV =
        // @ts-ignore
        props.textConfig && props.textConfig.length > 0
          ? // @ts-ignore
            props.textConfig
          : [
              {
                label: '文本',
                key: 'text',
                required: false,
                default: '',
                maxLength: 1000
              }
            ];
      setInitVal(initV);
    }
  }, []);

  return (
    <div className="selectedMain">
      <Form {...formItemLayout} name={props.name} form={form}>
        <Form.Item label={<span className="formTitle">文本列表</span>} name="textConfig" initialValue={initVal}>
          <TextList onChange={finish} />
        </Form.Item>
      </Form>
    </div>
  );
};

export default TextConfigForm;
