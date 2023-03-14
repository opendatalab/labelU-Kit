import type { RadioChangeEvent } from 'antd';
import { Modal, Radio } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';

import { ExportType } from '@/services/types';
import { outputSample, outputSamples } from '@/services/samples';

import styles from './index.module.scss';

export interface ExportPortalProps {
  children: React.ReactChild;
  taskId: number;
  sampleIds?: number[];
}

export const exportDescriptionMapping = {
  [ExportType.JSON]: 'Label U 标准格式，包含任务id、标注结果、url、fileName字段',
  [ExportType.COCO]: 'COCO数据集标准格式，面向物体检测（拉框）和图像分割（多边形）任务',
  [ExportType.MASK]: '面向图像分割（多边形）任务',
};

const exportTypeOptions = [
  {
    label: ExportType.JSON,
    value: ExportType.JSON,
  },
  {
    label: ExportType.COCO,
    value: ExportType.COCO,
  },
  {
    label: ExportType.MASK,
    value: ExportType.MASK,
  },
];

export default function ExportPortal({ taskId, sampleIds, children }: ExportPortalProps) {
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

  return (
    <>
      {plainChild}
      <Modal title="选择导出格式" okText={'导出'} onOk={handleExport} onCancel={handleCloseModal} open={modalVisible}>
        <div className={styles.wrapper}>
          <div className={styles.title}>导出格式</div>
          <div className={styles.options}>
            <Radio.Group
              options={exportTypeOptions}
              onChange={handleOptionChange}
              value={exportType}
              optionType="button"
              buttonStyle="solid"
            />
          </div>
        </div>
        <div className={styles.description}>{exportDescriptionMapping[exportType]}</div>
      </Modal>
    </>
  );
}
