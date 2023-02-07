import React, { useContext } from 'react';
import { Form, Input, Select } from 'antd';
import { PrevResult, Attribute } from '@label-u/annotation';
import { useSelector } from '../../store/ctx';
import { UpdateImgList } from '../../store/annotation/actionCreators';
const { Option } = Select;
import { AppState } from '../../store';
import { IFileItem } from '../../types/data';
import { useDispatch } from '../../store/ctx';
import { PointCloudContext } from '../../components/pointCloudView/PointCloudContext';
import { toolList } from '../../views/MainView/toolHeader/ToolOperation';

interface AttributeResult {
  attributeName: string;
}

interface ToolInfo {
  toolName: string;
  order: number;
  textAttribute: string;
}

export const useAttributes = () => {
  const dispatch = useDispatch();
  const attributeList = useSelector(
    (state: AppState) => state.annotation.attributeList,
  ) as Attribute[];
  const imgList = useSelector((state: AppState) => state.annotation.imgList) as IFileItem[];
  const imgIndex = useSelector((state: AppState) => state.annotation.imgIndex) as number;
  const toolInstance = useSelector((state: AppState) => state.annotation.toolInstance);
  const ptCtx = useContext(PointCloudContext);
  const currentToolName = useSelector((state: AppState) => state.annotation.currentToolName);

  const generateContent = (toolInfo: ToolInfo, attributeResult: AttributeResult) => {
    let children: any[] = [];
    for (let item of attributeList) {
      children.push(<Option key={item.key}>{item.value}</Option>);
    }

    return (
      <Form
        name='basic'
        layout='vertical'
        key={attributeResult.attributeName}
        initialValues={{
          changeAttribute: attributeResult.attributeName,
          description: toolInfo.textAttribute,
        }}
        autoComplete='off'
        onFieldsChange={(_, allFields) => {
          updateLabelResultByOrderAndToolName(
            toolInfo.order,
            toolInfo.toolName,
            allFields[0].value,
            allFields[1].value,
          );
        }}
      >
        <Form.Item
          label='标签'
          name='changeAttribute'
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            style={{
              width: '100%',
            }}
          >
            {children}
          </Select>
        </Form.Item>
        <Form.Item
          label='描述'
          name='description'
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input.TextArea />
        </Form.Item>
      </Form>
    );
  };

  // 更新pre 标注结果
  const updateCanvasView = (newLabelResult: any) => {
    if (currentToolName === 'pointCloudTool') {
      return;
    }
    const prevResult: PrevResult[] = [];
    for (let oneTool of toolList) {
      if (oneTool.toolName !== currentToolName && newLabelResult[oneTool.toolName]) {
        let onePrevResult = {
          toolName: oneTool.toolName,
          result: newLabelResult[oneTool.toolName].result,
        };
        prevResult.push(onePrevResult);
      }
      if (oneTool.toolName === currentToolName) {
        toolInstance.setResult(newLabelResult[oneTool.toolName].result);
      }
    }
    toolInstance.setPrevResultList(prevResult);
    toolInstance.render();
  };

  // 根据标签及工具 修改标签及描述
  const updateLabelResultByOrderAndToolName = (
    order: number,
    fromToolName: string,
    toAttributeName: string,
    toAttributeText: string,
  ) => {
    let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    // 更新结果
    if (oldImgResult[fromToolName].result && oldImgResult[fromToolName].result.length > 0) {
      let newToolLabelItems = oldImgResult[fromToolName].result.map(
        (item: { order: number; isVisible: boolean; attribute: string; textAttribute: string }) => {
          if (item.order === order) {
            return {
              ...item,
              attribute: toAttributeName,
              textAttribute: toAttributeText,
            };
          }
          return item;
        },
      );
      oldImgResult[fromToolName].result = newToolLabelItems;
    }
    imgList[imgIndex].result = JSON.stringify(oldImgResult);
    dispatch(UpdateImgList(imgList));
    setTimeout(() => {
      ptCtx?.mainViewInstance?.emit('refreshPointCloud3dView');
    }, 100);
    updateCanvasView(oldImgResult);
  };

  return {
    generateContent,
    updateLabelResultByOrderAndToolName,
    updateCanvasView,
  };
};
