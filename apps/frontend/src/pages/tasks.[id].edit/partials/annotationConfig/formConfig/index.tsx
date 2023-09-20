import { EToolName, TOOL_NAME, EVideoToolName } from '@label-u/annotation';
import type { FormProps, SelectProps, TabsProps } from 'antd';
import { Popconfirm, Button, Form, Tabs, Select } from 'antd';
import React, { useContext, useEffect, useCallback, useMemo, useState } from 'react';
import _, { cloneDeep, find } from 'lodash-es';
import { PlusOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';

import { MediaType, TaskStatus } from '@/services/types';
import FancyForm from '@/components/FancyForm';
import FancyInput, { add } from '@/components/FancyInput';
import type { RootState } from '@/store';

import { TaskCreationContext } from '../../../taskCreation.context';
import { FancyAttributeList } from './customFancy/ListAttribute.fancy';
import { FancyCategoryAttribute } from './customFancy/CategoryAttribute.fancy';
import styles from './index.module.scss';
import lineTemplate from './templates/line.template';
import rectTemplate from './templates/rect.template';
import polygonTemplate from './templates/polygon.template';
import pointTemplate from './templates/point.template';
import tagTemplate from './templates/tag.template';
import textTemplate from './templates/text.template';
import videoSegmentTemplate from './templates/segment.template';
import videoFrameTemplate from './templates/frame.template';

// 注册fancyInput自定义输入组件
add('list-attribute', FancyAttributeList);
add('category-attribute', FancyCategoryAttribute);

const globalTools = [EToolName.Tag, EToolName.Text];
const graphicTools = [EToolName.Rect, EToolName.Point, EToolName.Polygon, EToolName.Line];
const videoAnnotationTools = [EVideoToolName.VideoSegmentTool, EVideoToolName.VideoFrameTool];

const toolMapping = {
  [MediaType.IMAGE]: graphicTools.map((item) => {
    return {
      label: TOOL_NAME[item],
      value: item,
    };
  }),
  [MediaType.VIDEO]: videoAnnotationTools.map((item) => {
    return {
      label: TOOL_NAME[item],
      value: item,
    };
  }),
};

const getDefaultActiveTool = (mediaType?: MediaType) => {
  switch (mediaType) {
    case MediaType.IMAGE:
      return EToolName.Rect;
    case MediaType.VIDEO:
      return EVideoToolName.VideoSegmentTool;
    default:
      return undefined;
  }
};

const templateMapping: Record<string, any> = {
  [EToolName.Line]: lineTemplate,
  [EToolName.Rect]: rectTemplate,
  [EToolName.Polygon]: polygonTemplate,
  [EToolName.Point]: pointTemplate,
  [EToolName.Tag]: tagTemplate,
  [EToolName.Text]: textTemplate,
  [EVideoToolName.VideoSegmentTool]: videoSegmentTemplate,
  [EVideoToolName.VideoFrameTool]: videoFrameTemplate,
};

const FormConfig = () => {
  const { annotationFormInstance, onAnnotationFormChange, task } = useContext(TaskCreationContext);
  const [activeTool, setActiveTool] = useState<string | undefined>(getDefaultActiveTool(task.media_type));
  const [activeGlobalTool, setActiveGlobalTool] = useState<string | undefined>(globalTools[0]);
  // 选中的所有工具
  const [selectedTools, setSelectedTools] = useState<any[]>([]);
  // 选中的标记工具
  const [selectedAnnotationTools, setSelectedAnnotationTools] = useState<any[]>([]);
  // 选中的全局工具
  const [selectedGlobalTools, setSelectedGlobalTools] = useState<string[]>([]);
  const [hasAttributes, setHasAttributes] = useState(false);

  const config = useSelector((state: RootState) => state.task.config);
  const taskStatus = useSelector((state: RootState) => state.task.item.status);
  const taskDoneAmount = useSelector((state: RootState) => state.task.item.stats?.done);
  const { tools } = config || {};

  // 进行中和已完成的任务不允许删除工具
  const isGlobalToolDeletable = useMemo(() => {
    const isNew = !find(tools, { tool: activeGlobalTool });

    if (isNew) {
      return true;
    }

    if ([TaskStatus.INPROGRESS, TaskStatus.FINISHED].includes(taskStatus as TaskStatus) || taskDoneAmount) {
      return false;
    }

    return true;
  }, [tools, activeGlobalTool, taskStatus, taskDoneAmount]);

  const isToolDeletable = useMemo(() => {
    const isNew = !find(tools, { tool: activeTool });

    if (isNew) {
      return true;
    }

    if ([TaskStatus.INPROGRESS, TaskStatus.FINISHED].includes(taskStatus as TaskStatus) || taskDoneAmount) {
      return false;
    }

    return true;
  }, [tools, activeTool, taskStatus, taskDoneAmount]);

  useEffect(() => {
    const toolNames = _.chain(tools).compact().map('tool').value();
    setSelectedTools(toolNames);

    const annotationToolNames = _.filter(toolNames, (item) => !globalTools.includes(item));
    setSelectedAnnotationTools(annotationToolNames);
    setActiveTool(annotationToolNames[0]);

    const globalToolNames = _.filter(toolNames, (item) => globalTools.includes(item));
    setSelectedGlobalTools(globalToolNames);
    setActiveGlobalTool(globalToolNames[0]);
    setHasAttributes(config?.commonAttributeConfigurable ?? false);
  }, [config, tools]);

  // ======================== 以下为新增代码 ========================
  const handleToolItemClick: SelectProps['onChange'] = (key) => {
    setSelectedTools((pre) => [...pre, key]);

    if (globalTools.includes(key as EToolName)) {
      setSelectedGlobalTools((pre) => [...pre, key]);
      setActiveGlobalTool(key);
    } else {
      setActiveTool(key);
      setSelectedAnnotationTools((pre) => [...pre, key]);
    }

    if (typeof onAnnotationFormChange === 'function') {
      setTimeout(onAnnotationFormChange);
    }
  };

  const handleRemoveTool = useCallback(
    (toolName: EToolName) => () => {
      const newTools = selectedTools.filter((item) => item !== toolName);
      setSelectedTools(newTools);

      if (globalTools.includes(toolName)) {
        const newGlobalTools = newTools.filter((item) => globalTools.includes(item));
        setSelectedGlobalTools(newGlobalTools);
        setActiveGlobalTool(newGlobalTools[0]);
      } else {
        const newAnnotationTools = newTools.filter((item) => !globalTools.includes(item));
        setSelectedAnnotationTools(newAnnotationTools);
        setActiveTool(newAnnotationTools[0]);
      }

      // 因为antd的form的特殊性，删除数组元素时，需要手动调用setFieldsValue
      const prevValues = cloneDeep(annotationFormInstance.getFieldsValue());

      setTimeout(() => {
        annotationFormInstance.setFieldsValue({
          ...prevValues,
          tools: prevValues.tools.filter((item: any) => item.tool !== toolName),
        });

        if (typeof onAnnotationFormChange === 'function') {
          setTimeout(onAnnotationFormChange);
        }
      });
    },
    [annotationFormInstance, onAnnotationFormChange, selectedTools],
  );

  const toolsMenu = useMemo(() => {
    const toolOptions = toolMapping[task.media_type!];

    return [
      {
        label: '全局',
        options: _.map(globalTools, (toolName) => ({
          disabled: selectedTools.includes(toolName),
          value: toolName,
          label: <span>{TOOL_NAME[toolName]}</span>,
        })),
      },
      {
        label: '标记',
        options: _.map(toolOptions, ({ value, label }) => ({
          disabled: selectedTools.includes(value),
          value: value,
          label: <span>{label}</span>,
        })),
      },
    ];
  }, [selectedTools, task.media_type]);

  const tabItems: TabsProps['items'] = useMemo(() => {
    return _.chain(selectedTools)
      .filter((tool) => {
        return !globalTools.includes(tool);
      })
      .map((tool) => {
        const fancyFormTemplate = templateMapping[tool] || null;
        const index = _.findIndex(selectedTools, (item) => item === tool);
        return {
          key: tool,
          label: TOOL_NAME[tool],
          forceRender: true,
          children: (
            <div className={styles.innerForm}>
              <div style={{ display: isToolDeletable ? 'flex' : 'none', justifyContent: 'flex-end' }}>
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
      })
      .value();
  }, [isToolDeletable, handleRemoveTool, selectedTools]);

  const tabGlobalItems: TabsProps['items'] = useMemo(() => {
    return _.chain(selectedTools)
      .filter((tool) => {
        return globalTools.includes(tool);
      })
      .map((tool) => {
        const fancyFormTemplate = templateMapping[tool] || null;
        const index = _.findIndex(selectedTools, (item) => item === tool);
        return {
          key: tool,
          label: TOOL_NAME[tool],
          forceRender: true,
          children: (
            <div className={styles.innerForm}>
              <div style={{ display: isGlobalToolDeletable ? 'flex' : 'none', justifyContent: 'flex-end' }}>
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
      })
      .value();
  }, [isGlobalToolDeletable, handleRemoveTool, selectedTools]);

  // TODO: 增加表单数据类型
  const handleFormValuesChange: FormProps['onValuesChange'] = useCallback(
    (changedValue: any) => {
      if ('commonAttributeConfigurable' in changedValue) {
        if (!changedValue.commonAttributeConfigurable) {
          annotationFormInstance.setFieldValue('attributes', []);
        }
        setHasAttributes(changedValue.commonAttributeConfigurable);
      }
    },
    [annotationFormInstance],
  );

  // ========================= end ==============================

  return (
    <Form
      form={annotationFormInstance}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
      colon={false}
      className={styles.formConfig}
      initialValues={config}
      onValuesChange={handleFormValuesChange}
      validateTrigger="onBlur"
    >
      <Form.Item label="标注工具">
        <Select placeholder="新增工具" options={toolsMenu} onSelect={handleToolItemClick}>
          <PlusOutlined />
        </Select>
      </Form.Item>
      {selectedGlobalTools.length > 0 && (
        <Form.Item label="全局" tooltip="通过分类和描述给媒体数据（如图片、视频、音频等）本身打标签">
          <div className="formTabBox">
            <Tabs
              type="card"
              size="small"
              activeKey={activeGlobalTool}
              destroyInactiveTabPane={false}
              onTabClick={(tabKey) => {
                setActiveGlobalTool(tabKey);
              }}
              items={tabGlobalItems}
            />
          </div>
        </Form.Item>
      )}
      {selectedAnnotationTools.length > 0 && (
        <Form.Item label="标记" tooltip="通过配置工具在媒体中绘制标记">
          <div className="formTabBox">
            <Tabs
              type="card"
              size="small"
              activeKey={activeTool}
              destroyInactiveTabPane={false}
              onTabClick={(tabKey) => {
                setActiveTool(tabKey);
              }}
              items={tabItems}
            />
          </div>
        </Form.Item>
      )}
      {selectedAnnotationTools.length > 0 && (
        <Form.Item
          label={<span className="formTitle">通用标签</span>}
          name="commonAttributeConfigurable"
          tooltip="已经配置的所有标注工具均可以使用通用标签"
          hidden={globalTools.includes(activeTool as EToolName)}
        >
          <FancyInput type="boolean" />
        </Form.Item>
      )}
      <Form.Item
        wrapperCol={{ offset: 4 }}
        className={styles.attributes}
        hidden={!hasAttributes || globalTools.includes(activeTool as EToolName)}
      >
        <div className={styles.attributesBox}>
          <Form.Item name="attributes">
            <FancyInput type="list-attribute" fullField={['attributes']} />
          </Form.Item>
        </div>
      </Form.Item>

      {task.media_type === MediaType.IMAGE && (
        <Form.Item
          label="画布外标注"
          name="drawOutsideTarget"
          tooltip="开启后可以在媒体文件画布范围外进行标注"
          hidden={!graphicTools.includes(activeTool as EToolName)}
        >
          <FancyInput type="boolean" />
        </Form.Item>
      )}
    </Form>
  );
};

export default React.memo(FormConfig);
