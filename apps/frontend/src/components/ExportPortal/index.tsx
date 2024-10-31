import type { RadioChangeEvent } from 'antd';
import { Modal, Radio } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { FlexLayout } from '@labelu/components-react';

import { ExportType, MediaType } from '@/api/types';
import { outputSample, outputSamples } from '@/api/services/samples';
import { ImageToolName } from '@/enums';

export interface ExportPortalProps {
  children: React.ReactChild;
  taskId: number;
  mediaType: MediaType | undefined;
  sampleIds?: number[];
  tools?: any[];
}

export const exportDescriptionMapping = {
  [ExportType.JSON]: 'Label U 标准格式，包含任务id、标注结果、url、fileName字段',
  [ExportType.CSV]: '适用于单一标注类型的任务场景',
  [ExportType.COCO]: 'COCO数据集标准格式，面向物体检测（拉框）和图像分割（多边形）任务',
  [ExportType.MASK]: '面向图像分割（多边形）任务',
  [ExportType.YOLO]: 'YOLO数据集标准格式，面向物体检测（拉框）任务',
  [ExportType.LABEL_ME]: '兼容 Labelme 标注工具的标注数据格式（不支持立体框、曲线）',
};

const optionMapping = {
  [ExportType.JSON]: {
    label: ExportType.JSON,
    value: ExportType.JSON,
  },
  [ExportType.CSV]: {
    label: ExportType.CSV,
    value: ExportType.CSV,
  },
  [ExportType.YOLO]: {
    label: ExportType.YOLO,
    value: ExportType.YOLO,
  },
  [ExportType.COCO]: {
    label: ExportType.COCO,
    value: ExportType.COCO,
  },
  [ExportType.MASK]: {
    label: ExportType.MASK,
    value: ExportType.MASK,
  },
  [ExportType.LABEL_ME]: {
    label: 'Labelme' as any,
    value: ExportType.LABEL_ME,
  },
};

function isIncludeCoco(tools?: any[]) {
  if (!tools) {
    return false;
  }

  // coco 包含 rect 和 polygon、point
  return !tools.some((item) => [ImageToolName.Cuboid, ImageToolName.Line, ImageToolName.Point].includes(item.tool));
}

export default function ExportPortal({ taskId, sampleIds, mediaType, tools, children }: ExportPortalProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [exportType, setExportType] = useState<ExportType>(ExportType.JSON);

  const handleOpenModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleOptionChange = ({ target: { value } }: RadioChangeEvent) => {
    setExportType(value);
  };

  const handleExport = useCallback(async () => {
    if (!sampleIds) {
      await outputSamples(taskId, exportType);
    } else {
      await outputSample(taskId, sampleIds, exportType);
    }

    setTimeout(() => {
      setModalVisible(false);
    });
  }, [exportType, sampleIds, taskId]);

  const plainChild = useMemo(() => {
    if (
      children === null ||
      children === undefined ||
      typeof children === 'boolean' ||
      !React.isValidElement(children)
    ) {
      return null;
    }

    if (typeof children === 'string' || typeof children === 'number') {
      return <span onClick={handleOpenModal}>{children}</span>;
    }

    return React.cloneElement(React.Children.only(children), {
      // @ts-ignore
      onClick: handleOpenModal,
    });
  }, [children, handleOpenModal]);

  const options = useMemo(() => {
    const result = [optionMapping[ExportType.JSON]];

    if (!mediaType) {
      return result;
    }

    const onlyPolygonTool = tools?.length === 1 && tools[0].tool === 'polygonTool';
    const onlyRectTool = tools?.length === 1 && tools[0].tool === 'rectTool';
    const onlyPointTool = tools?.length === 1 && tools[0].tool === 'pointTool';
    const onlyCuboidTool = tools?.length === 1 && tools[0].tool === 'cuboidTool';
    const onlyLineTool = tools?.length === 1 && tools[0].tool === 'lineTool';

    if (mediaType === MediaType.IMAGE) {
      if (onlyPolygonTool || onlyRectTool || onlyPointTool || onlyCuboidTool || onlyLineTool) {
        result.push(optionMapping[ExportType.CSV]);
      }

      if (isIncludeCoco(tools)) {
        result.push(optionMapping[ExportType.COCO]);
      }

      if (onlyRectTool) {
        result.push(optionMapping[ExportType.YOLO]);
      }

      // mask: polygon
      if (onlyPolygonTool) {
        result.push(optionMapping[ExportType.MASK]);
      }

      if (!tools?.find((item) => ['cuboidTool'].includes(item.tool))) {
        result.push(optionMapping[ExportType.LABEL_ME] as any);
      }
    }

    return result;
  }, [mediaType, tools]);

  return (
    <>
      {plainChild}
      <Modal title="选择导出格式" okText={'导出'} onOk={handleExport} onCancel={handleCloseModal} open={modalVisible}>
        <FlexLayout flex="column" gap="1rem">
          <FlexLayout.Header items="center" gap="1rem" flex>
            <span>导出格式</span>
            <Radio.Group
              options={options}
              onChange={handleOptionChange}
              value={exportType}
              optionType="button"
              buttonStyle="solid"
            />
          </FlexLayout.Header>
          <div>{exportDescriptionMapping[exportType]}</div>
        </FlexLayout>
      </Modal>
    </>
  );
}
