import { EToolName, TOOL_NAME } from '@label-u/annotation';
import type { FormInstance, FormProps, MenuProps, TabsProps } from 'antd';
import { Empty, Popconfirm, Button, Dropdown, Form, Tabs } from 'antd';
import type { FC } from 'react';
import React, { useEffect, useCallback, useMemo, useState } from 'react';
import _ from 'lodash-es';
import { PlusOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';

import { MediaType } from '@/services/types';
import FancyForm from '@/components/FancyForm';
import FancyInput, { add } from '@/components/FancyInput';
import type { RootState } from '@/store';

import { FancyAttributeList } from './customFancy/ListAttribute.fancy';
import { FancyCategoryAttribute } from './customFancy/CategoryAttribute.fancy';
import styles from './index.module.scss';
import lineTemplate from './templates/line.template';
import rectTemplate from './templates/rect.template';
import polygonTemplate from './templates/polygon.template';
import pointTemplate from './templates/point.template';
import tagTemplate from './templates/tag.template';
import textTemplate from './templates/text.template';

// 注册fancyInput自定义输入组件
add('list-attribute', FancyAttributeList);
add('category-attribute', FancyCategoryAttribute);

const validTools = [EToolName.Rect, EToolName.Point, EToolName.Polygon, EToolName.Line, EToolName.Tag, EToolName.Text];

const toolOptions = validTools.map((item) => {
  return {
    label: TOOL_NAME[item],
    value: item,
  };
});

const mediaTypeMapping = {
  [MediaType.IMAGE]: '图片',
  [MediaType.VIDEO]: '视频',
};

const mediaOptions = Object.values(MediaType).map((item) => {
  return {
    label: mediaTypeMapping[item],
    value: item,
    disabled: item === MediaType.VIDEO,
  };
});

const templateMapping: Record<string, any> = {
  [EToolName.Line]: lineTemplate,
  [EToolName.Rect]: rectTemplate,
  [EToolName.Polygon]: polygonTemplate,
  [EToolName.Point]: pointTemplate,
  [EToolName.Tag]: tagTemplate,
  [EToolName.Text]: textTemplate,
};

interface IProps {
  form: FormInstance;
}

const FormConfig: FC<IProps> = ({ form }) => {
  const [activeTool, setActiveTool] = useState<string>(toolOptions[0].value);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [hasAttributes, setHasAttributes] = useState(false);

  const config = useSelector((state: RootState) => state.task.config);
  const { tools } = config || {};

  useEffect(() => {
    setSelectedTools((tools || []).map((item) => item.tool));
    setActiveTool((tools || [])[0]?.tool);
    setHasAttributes(config?.commonAttributeConfigurable ?? false);
  }, [config, tools]);

  // ======================== 以下为新增代码 ========================
  const handleToolItemClick: MenuProps['onClick'] = async ({ key }) => {
    setSelectedTools((pre) => [...pre, key]);
    setActiveTool(key);
  };

  const handleRemoveTool = useCallback(
    (toolName: EToolName) => () => {
      const newTools = selectedTools.filter((item) => item !== toolName);
      setSelectedTools(newTools);
      setActiveTool(newTools[0]);
    },
    [selectedTools],
  );

  const toolsMenu: MenuProps['items'] = useMemo(
    () =>
      _.chain(toolOptions)
        .filter((item) => !selectedTools.includes(item.value))
        .map(({ value, label }) => ({
          key: value,
          label: <span>{label}</span>,
        }))
        .value(),
    [selectedTools],
  );

  const tabItems: TabsProps['items'] = useMemo(() => {
    return _.map(selectedTools, (tool, index) => {
      const fancyFormTemplate = templateMapping[tool] || null;

      return {
        key: tool,
        label: TOOL_NAME[tool],
        children: (
          <div className={styles.innerForm}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Popconfirm title="确定删除此工具吗？" onConfirm={handleRemoveTool(tool as EToolName)}>
                <Button type="link" danger style={{ marginBottom: '0.5rem' }}>
                  删除工具
                </Button>
              </Popconfirm>
            </div>
            <FancyForm template={fancyFormTemplate} name={['tools', index]} />
          </div>
        ),
      };
    });
  }, [handleRemoveTool, selectedTools]);

  // TODO: 增加表单数据类型
  const handleFormValuesChange: FormProps['onValuesChange'] = useCallback(
    (changedValue: any) => {
      if ('commonAttributeConfigurable' in changedValue) {
        if (!changedValue.commonAttributeConfigurable) {
          form.setFieldValue('attributes', []);
        }
        setHasAttributes(changedValue.commonAttributeConfigurable);
      }
    },
    [form],
  );

  // ========================= end ==============================

  return (
    <Form
      form={form}
      labelCol={{ span: 3 }}
      wrapperCol={{ span: 21 }}
      colon={false}
      className={styles.formConfig}
      initialValues={config}
      onValuesChange={handleFormValuesChange}
    >
      <Form.Item label="标注类型" name="media_type" rules={[{ required: true, message: '标注类型不可为空' }]}>
        <FancyInput
          type="enum"
          size="middle"
          options={mediaOptions}
          listItemHeight={10}
          listHeight={250}
          defaultValue={MediaType.IMAGE}
        />
      </Form.Item>
      <Form.Item label="标注工具">
        <Dropdown menu={{ items: toolsMenu, onClick: handleToolItemClick }} placement="bottomLeft" trigger={['click']}>
          <Button type="primary" ghost icon={<PlusOutlined />}>
            新增工具
          </Button>
        </Dropdown>
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 3 }}>
        {selectedTools.length > 0 ? (
          <div className="formTabBox">
            <Tabs
              type="card"
              size="small"
              activeKey={activeTool}
              onChange={(tabKey) => {
                setActiveTool(tabKey);
              }}
              items={tabItems}
            />
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择工具" />
        )}
      </Form.Item>
      <Form.Item label="画布外标注" name="drawOutsideTarget" tooltip="开启后可以在媒体文件画布范围外进行标注">
        <FancyInput type="boolean" />
      </Form.Item>

      <Form.Item
        label={<span className="formTitle">通用标签</span>}
        name="commonAttributeConfigurable"
        tooltip="已经配置的所有标注工具均可以使用通用标签"
      >
        <FancyInput type="boolean" />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 3 }} className={styles.attributes} hidden={!hasAttributes}>
        <div className={styles.attributesBox}>
          <Form.Item name="attributes">
            <FancyInput type="list-attribute" fullField={['attributes']} />
          </Form.Item>
        </div>
      </Form.Item>
    </Form>
  );
};

export default React.memo(FormConfig);
