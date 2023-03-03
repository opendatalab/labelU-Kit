import { useState } from 'react';
import { UploadOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate, useRouteLoaderData } from 'react-router';
import { Button, Modal } from 'antd';
import { useDispatch } from 'react-redux';
import _ from 'lodash-es';

import currentStyles from './index.module.scss';
import commonController from '../../utils/common/common';
import { getSamples, outputSamples } from '../../services/samples';
import currentStyles1 from '../../pages/outputData/index.module.scss';
import { updateStatus } from '../../stores/task.store';
// import { updateAllConfig } from '../../stores/toolConfig.store';
const Statistical = () => {
  const dispatch = useDispatch();
  const taskData = useRouteLoaderData('task');
  const statisticalDatas = _.get(taskData, 'stats', {});
  const taskStatus = _.get(taskData, 'status');
  const taskId = _.get(taskData, 'id');

  // useEffect(() => {
  //   getTask(taskId)
  //     .then((res: any) => {
  //       // @ts-ignore
  //       if (res?.status === 200) {
  //         // @ts-ignore
  //         setStatisticalDatas(res.data.data.stats);
  //         setTaskStatus(res.data.data.status);
  //         // @ts-ignore
  //         dispatch(updateTask({ data: res.data.data }));
  //         dispatch(updateStatus(res.data.data.status));
  //         if (res.data.data.config) {
  //           dispatch(updateAllConfig(JSON.parse(res.data.data.config)));
  //         }
  //       } else {
  //         commonController.notificationErrorMessage({ message: '请求任务数据出错' }, 1);
  //       }
  //     })
  //     .catch((error) => {
  //       commonController.notificationErrorMessage(error, 1);
  //     });
  // }, [dispatch, taskId]);
  const navigate = useNavigate();
  const getSamplesLocal = (params: any) => {
    getSamples(taskId!, params)
      .then(({ data }) => {
        if (data.length > 0) {
          const sampleId = data[0].id;
          navigate('/tasks/' + taskId + '/samples/' + sampleId);
        }
      })
      .catch((error) => {
        commonController.notificationErrorMessage(error, 1);
      });
  };
  const beginAnnotation = () => {
    getSamplesLocal({ pageNo: 0, pageSize: 10 });
  };
  const turnToTaskConfig = () => {
    //   getTask(taskId).then((res:any)=>{
    //   if (res.status === 200) {
    //     console.log(res.data.data);
    //     dispatch(updateTask({data:res.data.data}));
    //     if (res.data.data.config){
    //       dispatch(updateAllConfig(JSON.parse(res.data.data.config)));
    //     }
    //   }else{
    //     commonController.notificationErrorMessage({message : '请求任务状态不是200'},1)
    //   }
    // }).catch(error=>commonController.notificationErrorMessage(error,1))
    dispatch(updateStatus(taskStatus));
    if (taskStatus !== 'CONFIGURED') {
      navigate('/tasks/' + taskId + '/edit/config?currentStatus=2&noConfig=1');
    } else {
      navigate('/tasks/' + taskId + '/edit/config?currentStatus=2');
    }
  };
  const turnToInputData = () => {
    dispatch(updateStatus(taskStatus));
    navigate('/tasks/' + taskId + '/edit/upload?currentStatus=1');
  };
  const [activeTxt, setActiveTxt] = useState('JSON');
  const [isShowModal, setIsShowModal] = useState(false);
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
            <div className={currentStyles.leftTitleContentOptionContent}>{statisticalDatas.done}</div>
          </div>
          <div className={currentStyles.leftTitleContentOption}>
            <div className={currentStyles.leftTitleContentOptionGrayIcon} />
            <div className={currentStyles.leftTitleContentOptionContent}>
              <b>未标注</b>
            </div>
            <div className={currentStyles.leftTitleContentOptionContent}>{statisticalDatas.new}</div>
          </div>
          <div className={currentStyles.leftTitleContentOption}>
            <div className={currentStyles.leftTitleContentOptionOrangeIcon} />
            <div className={currentStyles.leftTitleContentOptionContent}>
              <b>跳过</b>
            </div>
            <div className={currentStyles.leftTitleContentOptionContent}>{statisticalDatas.skipped}</div>
          </div>
          <div className={currentStyles.leftTitleContentOption}>
            <div className={currentStyles.leftTitleContentOptionWhiteIcon} />
            <div className={currentStyles.leftTitleContentOptionContent}>
              <b>总计</b>
            </div>
            <div className={currentStyles.leftTitleContentOptionContent}>
              {statisticalDatas.done + statisticalDatas.new + statisticalDatas.skipped}
            </div>
          </div>
        </div>
      </div>
      <div className={currentStyles.right}>
        <Button type="text" icon={<SettingOutlined />} onClick={turnToTaskConfig}>
          任务配置
        </Button>
        <Button type="text" icon={<UploadOutlined />} onClick={() => setIsShowModal(true)}>
          数据导出
        </Button>
        <Button type="primary" ghost onClick={turnToInputData}>
          数据导入
        </Button>
        <Button type="primary" onClick={commonController.debounce(beginAnnotation, 100)}>
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
