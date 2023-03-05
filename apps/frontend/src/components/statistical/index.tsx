import { useState } from 'react';
import { UploadOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate, useRouteLoaderData } from 'react-router';
import { Button, Modal } from 'antd';
import { useSelector } from 'react-redux';
import _ from 'lodash-es';

import type { RootState } from '@/store';
import { outputSamples } from '@/services/samples';
import type { TaskResponseWithStatics } from '@/services/types';

import currentStyles from './index.module.scss';
import commonController from '../../utils/common/common';
import currentStyles1 from '../../pages/outputData/index.module.scss';
const Statistical = () => {
  const taskData = useRouteLoaderData('task') as TaskResponseWithStatics;
  const { stats = {} } = taskData || {};
  const taskId = _.get(taskData, 'id');

  const samples = useSelector((state: RootState) => state.sample.list);

  const navigate = useNavigate();

  const handleGoAnnotation = () => {
    if (samples.data.length === 0) {
      return;
    }
    navigate(`/tasks/${taskId}/samples/${samples.data[0].id}`);
  };
  const handleGoConfig = () => {
    navigate(`/tasks/${taskId}/edit#config`);
  };
  const handleGoUpload = () => {
    navigate(`/tasks/${taskId}/edit#upload`);
  };

  const [activeTxt, setActiveTxt] = useState('JSON');
  const [isShowModal, setIsShowModal] = useState(false);

  // TODO: 重构导出逻辑；将多处出现的「导出格式选择」抽离成共用组件
  const clickOk = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowModal(false);
    outputSamples(taskId!, activeTxt).catch((error) => {
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
      <div className={currentStyles.left}>
        <div className={currentStyles.leftTitle}>
          <b>数据总览</b>
        </div>
        <div className={currentStyles.leftTitleContent}>
          <div className={currentStyles.leftTitleContentOption}>
            <div className={currentStyles.leftTitleContentOptionBlueIcon} />
            <div className={currentStyles.leftTitleContentOptionContent}>
              <b>已标注</b>
            </div>
            <div className={currentStyles.leftTitleContentOptionContent}>{stats.done}</div>
          </div>
          <div className={currentStyles.leftTitleContentOption}>
            <div className={currentStyles.leftTitleContentOptionGrayIcon} />
            <div className={currentStyles.leftTitleContentOptionContent}>
              <b>未标注</b>
            </div>
            <div className={currentStyles.leftTitleContentOptionContent}>{stats.new}</div>
          </div>
          <div className={currentStyles.leftTitleContentOption}>
            <div className={currentStyles.leftTitleContentOptionOrangeIcon} />
            <div className={currentStyles.leftTitleContentOptionContent}>
              <b>跳过</b>
            </div>
            <div className={currentStyles.leftTitleContentOptionContent}>{stats.skipped}</div>
          </div>
          <div className={currentStyles.leftTitleContentOption}>
            <div className={currentStyles.leftTitleContentOptionWhiteIcon} />
            <div className={currentStyles.leftTitleContentOptionContent}>
              <b>总计</b>
            </div>
            {stats && (
              <div className={currentStyles.leftTitleContentOptionContent}>
                {stats.done! + stats.new! + stats.skipped!}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={currentStyles.right}>
        <Button type="text" icon={<SettingOutlined />} onClick={handleGoConfig}>
          任务配置
        </Button>
        <Button type="text" icon={<UploadOutlined />} onClick={() => setIsShowModal(true)}>
          数据导出
        </Button>
        <Button type="primary" ghost onClick={handleGoUpload}>
          数据导入
        </Button>
        <Button type="primary" onClick={commonController.debounce(handleGoAnnotation, 100)}>
          开始标注
        </Button>
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
export default Statistical;
