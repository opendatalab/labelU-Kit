import React, { useEffect, useState } from 'react';
import { CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { Button, Modal } from 'antd';

import { getTask } from '@/services/task';

import currentStyles from './index.module.scss';
import { outputSamples } from '../../services/samples';
import commonController from '../../utils/common/common';
import currentStyles1 from '../outputData/index.module.scss';

const SamplesFinished = () => {
  const [stat, setStat] = useState<any>({});
  const taskId = parseInt(window.location.pathname.split('/')[2]);
  useEffect(() => {
    getTask(taskId)
      .then(({ data }) => {
        setStat(data.stats);
      })
      .catch((error) => {
        commonController.notificationErrorMessage(error, 1);
      });
  }, [taskId]);
  const navigate = useNavigate();
  const turnToSamples = () => {
    const currentPathnames = window.location.pathname.split('/');
    currentPathnames.splice(3, 2);
    navigate(currentPathnames.join('/'));
  };

  const [activeTxt, setActiveTxt] = useState('JSON');
  const [isShowModal, setIsShowModal] = useState(false);
  const clickOk = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowModal(false);
    outputSamples(taskId, activeTxt);
  };

  const clickCancel = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowModal(false);
  };
  const confirmActiveTxt = (e: any, value: string) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setActiveTxt(value);
  };
  return (
    <div className={currentStyles.finishedWrapper}>
      <div className={currentStyles.innerWrapper}>
        <div className={currentStyles.check}>
          <CheckOutlined style={{ color: '#64ba64', fontSize: '40px' }} />
        </div>
        <div className={currentStyles.txt}>标注完成</div>
        <div className={currentStyles.stat}>
          <div className={currentStyles.statItem}>已标注： {stat.done},</div>
          <div className={currentStyles.statItem}>
            未标注： <div style={{ color: 'red' }}>{stat.new}</div>,
          </div>
          <div className={currentStyles.statItem}>跳过：{stat.skipped}</div>
        </div>
        <div className={currentStyles.buttons}>
          <Button
            type="primary"
            size="large"
            onClick={() => {
              setIsShowModal(true);
            }}
          >
            导出数据
          </Button>
          <Button type="text" size="large" onClick={turnToSamples}>
            返回主页
          </Button>
        </div>
      </div>

      <Modal title="选择导出格式" okText={'导出'} onOk={clickOk} onCancel={clickCancel} open={isShowModal}>
        <div className={currentStyles1.outerFrame}>
          <div className={currentStyles1.pattern}>
            <div className={currentStyles1.title}>导出格式</div>
            <div className={currentStyles1.buttons}>
              {activeTxt === 'JSON' && (
                <div className={currentStyles1.buttonActive} onClick={(e) => confirmActiveTxt(e, 'JSON')}>
                  JSON
                </div>
              )}
              {activeTxt !== 'JSON' && (
                <div className={currentStyles1.button} onClick={(e) => confirmActiveTxt(e, 'JSON')}>
                  JSON
                </div>
              )}

              {activeTxt === 'COCO' && (
                <div className={currentStyles1.buttonActive} onClick={(e) => confirmActiveTxt(e, 'COCO')}>
                  COCO
                </div>
              )}
              {activeTxt !== 'COCO' && (
                <div className={currentStyles1.button} onClick={(e) => confirmActiveTxt(e, 'COCO')}>
                  COCO
                </div>
              )}

              {activeTxt === 'MASK' && (
                <div className={currentStyles1.buttonActive} onClick={(e) => confirmActiveTxt(e, 'MASK')}>
                  MASK
                </div>
              )}
              {activeTxt !== 'MASK' && (
                <div className={currentStyles1.button} onClick={(e) => confirmActiveTxt(e, 'MASK')}>
                  MASK
                </div>
              )}
            </div>
          </div>
          {activeTxt === 'JSON' && (
            <div className={currentStyles.bottom}>Label U 标准格式，包含任务id、标注结果、url、fileName字段</div>
          )}
          {activeTxt === 'COCO' && (
            <div className={currentStyles.bottom}>COCO数据集标准格式，面向物体检测（拉框）和图像分割（多边形）任务</div>
          )}
          {activeTxt === 'MASK' && <div className={currentStyles.bottom}>面向图像分割（多边形）任务</div>}
        </div>
      </Modal>
    </div>
  );
};

export default SamplesFinished;
