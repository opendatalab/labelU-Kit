import type { DrawerProps } from 'antd';
import { Form, Button, Drawer } from 'antd';
import { get, isEmpty, isEqual } from 'lodash/fp';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import Icon, { ExclamationCircleFilled } from '@ant-design/icons';

import { ReactComponent as AddCategoryIcon } from '@/assets/svg/add-category.svg';
import { ReactComponent as AddTextIcon } from '@/assets/svg/add-text.svg';
import { modal } from '@/StaticAnt';

import type { CategoryAttributeItem, FancyCategoryAttributeRef } from '../CategoryAttribute.fancy';
import { CategoryType, FancyCategoryAttribute, StyledFancyAttributeWrapper } from '../CategoryAttribute.fancy';

export interface AttributeConfigurationProps {
  visible: boolean;
  onClose: () => void;
  value?: CategoryAttributeItem[];
  defaultValue?: CategoryAttributeItem[];
  onChange?: (value: CategoryAttributeItem[]) => void;
}

const StyledDrawer = styled<React.FC<DrawerProps>>(Drawer)`
  .addition {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .addition-button {
    display: flex;
    padding: 1.5rem 3rem;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    cursor: pointer;
    background-color: #fff;
    flex-direction: column;
    border-style: dashed;
    border-width: 1px;
    background-color: var(--color-primary-bg);
    border-color: var(--color-primary-border);
    transition: all var(--motion-duration-fast);

    &:hover {
      background-color: var(--color-primary-bg-hover);
      border-color: var(--color-primary-border-hover);
    }

    &:active {
      border-color: var(--color-primary-active);
    }
  }

  .new-category-attr {
    margin-right: 1.5rem;
  }

  .icon {
    font-size: 3rem;
  }

  .title {
    margin: 1rem 0 0.5rem;
  }

  sub {
    color: var(--color-text-secondary);
  }

  .footer {
    padding: 0.375rem;
  }

  ${StyledFancyAttributeWrapper} {
    margin-bottom: 1rem;
    .buttons {
      padding: 1rem 0;
    }
  }
`;

interface AttributeConfigurationState {
  list: CategoryAttributeItem[];
}

export default function AttributeConfiguration({ onClose, visible, value, onChange }: AttributeConfigurationProps) {
  const [stateValue, setStateValue] = useState<AttributeConfigurationState>({ list: value || [] });
  const ref = useRef<FancyCategoryAttributeRef>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    setStateValue({ list: value || [] });
    form.setFieldsValue({ list: value || [] });
  }, [form, value]);

  const handleAddCategoryAttribute = useCallback(
    (type: CategoryType) => () => {
      if (!ref.current) {
        return;
      }

      ref.current?.addCategory(type)();
    },
    [],
  );

  const reset = useCallback(() => {
    form.resetFields();
    setStateValue({ list: [] });
  }, [form]);

  const handleSave = useCallback(() => {
    form
      .validateFields()
      .then((values) => {
        onChange?.(values.list);
        onClose();
        reset();
      })
      .catch((error) => {
        modal.info({
          title: '请填写完整的属性内容',
          content: get('errorFields[0].errors[0]')(error),
          icon: <ExclamationCircleFilled style={{ color: 'var(--color-warning)' }} />,
          onOk: () => {
            form.scrollToField(error.errorFields[0].name);
          },
        });
      });
  }, [form, onChange, onClose, reset]);

  const handleCancel = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleClose = useCallback(() => {
    if (!isEqual(value)(form.getFieldsValue().list)) {
      modal.confirm({
        title: '关联属性将不会保存，是否确认退出',
        content: '当前属性配置已修改',
        onOk: handleCancel,
        okText: '退出',
        cancelText: '继续编辑',
      });

      return;
    }

    onClose();
  }, [form, handleCancel, onClose, value]);

  const emptyPlaceholder = useMemo(
    () => (
      <div className="addition">
        <button className="addition-button new-category-attr" onClick={handleAddCategoryAttribute(CategoryType.Enum)}>
          <Icon className="icon" component={AddCategoryIcon} />
          <span className="title">新建分类属性</span>
          <sub>选择题形式</sub>
        </button>

        <button className="addition-button new-text-attr" onClick={handleAddCategoryAttribute(CategoryType.String)}>
          <Icon className="icon" component={AddTextIcon} />
          <span className="title">新建文本属性</span>
          <sub>填空题形式</sub>
        </button>
      </div>
    ),
    [handleAddCategoryAttribute],
  );
  const footer = useMemo(
    () => (
      <div className="footer">
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
        <Button onClick={handleClose}>取消</Button>
      </div>
    ),
    [handleSave, handleClose],
  );

  const isValueEmpty = useMemo(() => {
    return isEmpty(stateValue.list);
  }, [stateValue.list]);

  const content = useMemo(
    () => (
      <Form
        form={form}
        labelCol={{ span: 0 }}
        wrapperCol={{ span: 24 }}
        colon={false}
        onValuesChange={(_, allValues) => {
          setStateValue(allValues);
        }}
        style={{ display: isValueEmpty ? 'none' : 'block', width: '100%' }}
      >
        <Form.Item name="list" label="">
          <FancyCategoryAttribute className="category-content" ref={ref} fullField={['list']} />
        </Form.Item>
      </Form>
    ),
    [form, isValueEmpty],
  );

  return (
    <StyledDrawer
      open={visible}
      title="属性配置"
      width={800}
      onClose={handleClose}
      footer={footer}
      bodyStyle={{ display: 'flex', justifyContent: 'center' }}
    >
      {isValueEmpty && emptyPlaceholder}
      {content}
    </StyledDrawer>
  );
}
