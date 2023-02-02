import React, { useEffect, useState } from 'react';
import currentStyles from './index.module.scss';
import { CheckOutlined } from '@ant-design/icons';
import { getTask, outputSamples } from '../../services/samples';
import commonController from '../../utils/common/common';
import { useNavigate } from 'react-router';
import OutputData from '../outputData';
import { Modal } from 'antd';
import currentStyles1 from '../outputData/index.module.scss';
const SamplesFinished = (props: any) => {
  const [stat, setStat] = useState<any>({});
  let taskId = parseInt(window.location.pathname.split('/')[2]);
  const { sampleId } = props;
  useEffect(() => {
    getTask(taskId)
      .then((res: any) => {
        if (res.status === 200) {
          setStat(res.data.data.stats);
        } else {
          commonController.notificationErrorMessage({ message: '向服务端请求任务数据出错' }, 1);
        }
      })
      .catch((error) => {
        commonController.notificationErrorMessage(error, 1);
      });
  }, []);
  const navigate = useNavigate();
  const turnToSamples = () => {
    let currentPathnames = window.location.pathname.split('/');
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
    outputSamples(taskId, activeTxt)
      .then((res) => console.log(res))
      .catch((error) => {
        commonController.notificationErrorMessage(error, 1);
      });
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
    <div className={currentStyles.outerFrame}>
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
        <div
          className={currentStyles.buttons1}
          // onClick={commonController.debounce(outputSamplesLocal, 100)}
          onClick={() => {
            setIsShowModal(true);
          }}
        >
          导出数据
        </div>
        <div className={currentStyles.buttons2} onClick={turnToSamples}>
          返回主页
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
