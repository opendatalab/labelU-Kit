import { EToolName, TOOL_NAME } from '@label-u/annotation';
import type { MenuProps, TabsProps } from 'antd';
import { Button, Dropdown, Form, Tabs } from 'antd';
import type { FC } from 'react';
import React, { useMemo, useState } from 'react';
import _ from 'lodash-es';
import { PlusOutlined } from '@ant-design/icons';

import type { ToolsConfigState } from '@/types/toolConfig';
import { validateTools } from '@/utils/tool/common';
import { MediaType } from '@/services/types';

import { LoadInitConfig } from '../configTemplate/config';
import styles from './index.module.scss';
import lineTemplate from './templates/line.template';
import FancyForm from './FancyForm';
import FancyInput from './FancyInput';

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
  };
});

const templateMapping: Record<string, any> = {
  [EToolName.Line]: lineTemplate,
};

interface IProps {
  config: ToolsConfigState;
  updateConfig: (field: string) => (value: any) => void;
}

const FormConfig: FC<IProps> = ({ config, updateConfig }) => {
  const { tools = [] } = config || {};
  const [activeTool, setActiveTool] = useState<string>(toolOptions[0].value);

  // ======================== 以下为新增代码 ========================
  const updateTools = useMemo(() => updateConfig('tools'), [updateConfig]);

  const handleToolItemClick: MenuProps['onClick'] = async ({ key }) => {
    const defaultConfig = await LoadInitConfig(key);

    updateTools([...tools, defaultConfig.tools[0]]);

    setActiveTool(key);
  };

  const toolsMenu: MenuProps['items'] = useMemo(
    () =>
      _.chain(toolOptions)
        .filter((item) => !_.find(tools, { tool: item.value }))
        .map(({ value, label }) => ({
          key: value,
          label: <span>{label}</span>,
        }))
        .value(),
    [tools],
  );

  const tabItems: TabsProps['items'] = useMemo(() => {
    return _.map(tools, ({ tool }, index) => {
      const fancyFormTemplate = templateMapping[tool] || null;

      return {
        key: tool,
        label: TOOL_NAME[tool],
        children: (
          <div
            style={{
              padding: '1rem',
              border: '1px solid var(--color-border-secondary)',
              borderTop: 0,
              borderRadius: '0 0 var(--border-radius) var(--border-radius)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="link" danger style={{ marginBottom: '0.5rem' }}>
                删除工具
              </Button>
            </div>
            <FancyForm template={fancyFormTemplate} name={['tools', index]} />
          </div>
        ),
      };
    });
  }, [tools]);

  const selectTools = useMemo(() => {
    return _.map(tools, 'tool');
  }, [tools]);

  // ========================= end ==============================

  return (
    <Form
      labelCol={{ span: 3 }}
      wrapperCol={{ span: 21 }}
      colon={false}
      className={styles.formConfig}
      initialValues={config}
      onValuesChange={(changedValues, allValues) => {
        console.log('changedValues', changedValues);
        console.log('allValues', allValues);
      }}
    >
      <Form.Item label="标注类型" name="media_type">
        <FancyInput type="enum" size="middle" options={mediaOptions} listItemHeight={10} listHeight={250} />
      </Form.Item>
      <Form.Item label="标注工具">
        <Dropdown menu={{ items: toolsMenu, onClick: handleToolItemClick }} placement="bottomLeft" trigger={['click']}>
          <Button type="primary" ghost icon={<PlusOutlined />}>
            新增工具
          </Button>
        </Dropdown>
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 3 }}>
        {selectTools && selectTools.length > 0 && validateTools(tools) && (
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
        )}
      </Form.Item>
      <Form.Item valuePropName="checked" label="画布外标注" name="drawOutsideTarget">
        <FancyInput type="boolean" />
      </Form.Item>

      <Form.Item
        valuePropName="checked"
        label={<span className="formTitle">通用标签</span>}
        name="commonAttributeConfigurable"
      >
        <FancyInput type="boolean" />
      </Form.Item>
    </Form>
  );
};

export default React.memo(FormConfig);
