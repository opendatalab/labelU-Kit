import React, { useCallback, useContext, useEffect, useRef, useMemo } from 'react';
import { Input, Form } from 'antd';
import { cKeyCode, uuid } from '@label-u/annotation';
import { cloneDeep, map, set } from 'lodash-es';
import styled from 'styled-components';
import type { FormInstance, Rule } from 'antd/es/form';
import type { NamePath } from 'antd/es/form/interface';

import { classnames } from '@/utils';
import ViewContext from '@/view.context';

const EKeyCode = cKeyCode.default;

const TextWrapper = styled.div`
  .text-value {
    position: relative;
  }
  .text-tips {
    font-size: 12px;
    position: absolute;
    padding: 0.5rem;
    bottom: 0;
    left: 0;
    width: 100%;
    display: none;
    color: #ccc;
  }

  .ant-input-data-count {
    position: absolute;
    font-size: 12px;
    right: 0.5rem;
    bottom: 0.5rem;
    margin-bottom: 0;
  }

  .ant-form-item-has-error + .text-tips {
    bottom: 1.375rem;
  }

  .required-flag {
    color: var(--color-error);
    margin-right: 0.25rem;
  }
`;

function TextItem({ form, config, name }: { form: FormInstance; config: any; name: NamePath }) {
  const { maxLength, required, key, stringType, regexp } = config;
  const tipRef = useRef<HTMLDivElement>(null);
  const rules = useMemo(() => {
    const _rules: Rule[] = [{ required, message: `${key}不可为空` }];

    if (stringType === 'number') {
      _rules.push({ pattern: /^\d+$/, message: `${key}必须为数字` });
    }

    if (stringType === 'english') {
      _rules.push({ pattern: /^[a-zA-Z]+$/, message: `${key}必须为英文` });
    }

    if (stringType === 'regexp') {
      _rules.push({ pattern: new RegExp(regexp), message: `${key}必须为自定义的${regexp}格式` });
    }

    return _rules;
  }, [key, regexp, required, stringType]);

  const handlePageChange = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      e.nativeEvent.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();

      if (e.ctrlKey && e.keyCode === EKeyCode.Enter) {
        e.preventDefault();
        form
          .validateFields()
          .then(() => {
            document.dispatchEvent(new CustomEvent('sampleChanged', { detail: 'next' }));
          })
          .catch(() => {
            // do nothing
          });
      }
    },
    [form],
  );

  const handleFocus = () => {
    if (!tipRef.current) {
      return;
    }

    tipRef.current.style.display = 'block';
  };

  const handleBlur = () => {
    if (!tipRef.current) {
      return;
    }

    tipRef.current.style.display = 'none';
    form.submit();
  };

  return (
    <div className="text-value">
      <Form.Item label={key} required={required} name={name} rules={rules}>
        <Input.TextArea
          className="text-input"
          rows={4}
          onBlur={handleBlur}
          onFocus={handleFocus}
          showCount
          onKeyDownCapture={handlePageChange}
          maxLength={maxLength}
        />
      </Form.Item>
      <div ref={tipRef} className="text-tips">
        <div className="text-tips__item">[切换] Tab</div>
        <div className="text-tips__item">[翻页] Ctrl + Enter</div>
      </div>
    </div>
  );
}

const TextToolSidebar = () => {
  const { result, setResult, textConfig } = useContext(ViewContext);
  const textValues = useMemo(() => {
    return result?.textTool?.result ?? [];
  }, [result.textTool]);
  const [form] = Form.useForm();

  const handleChange = (values: any) => {
    const newResult = cloneDeep(result);

    set(newResult, `textTool.result`, values.list);
    setResult(newResult);
  };

  useEffect(() => {
    // 填入默认值
    let _textValues = textValues;

    if (_textValues.length === 0) {
      _textValues = map(textConfig, (configItem) => {
        return {
          id: uuid(),
          value: {
            [configItem.value]: configItem.defaultValue,
          },
        };
      });
    }

    form.setFieldsValue({ list: _textValues });
  }, [form, textConfig, textValues]);

  return (
    <TextWrapper
      className={classnames({
        textToolOperationMenu: true,
      })}
    >
      <Form form={form} onFinish={handleChange} name="list" layout="vertical">
        {map(textConfig, (configItem, index) => (
          <TextItem
            key={configItem.value}
            name={['list', index, 'value', configItem.value]}
            config={configItem}
            form={form}
          />
        ))}
      </Form>
    </TextWrapper>
  );
};

export default TextToolSidebar;
