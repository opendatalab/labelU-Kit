import React, { useState } from 'react';
import { Modal, Progress, Tooltip } from 'antd';
import { useNavigate } from 'react-router';
import moment from 'moment';
import Icon, { ExclamationOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';

import type { Dispatch, RootState } from '@/store';
import { ReactComponent as DeleteIcon } from '@/assets/svg/delete.svg';
import { ReactComponent as OutputIcon } from '@/assets/svg/outputData.svg';

import commonController from '../../utils/common/common';
import { outputSamples } from '../../services/samples';
import currentStyles from './index.module.scss';
import { deleteTask } from '../../services/task';
import currentStyles1 from '../../pages/outputData/index.module.scss';
import FlexItem from '../FlexItem';
import Status from '../Status';
import IconText from '../IconText';

const TaskCard = (props: any) => {
  const [isShowDeleteModal, setIsShowDeleteModal] = useState(false);
  const { cardInfo } = props;
  const dispatch = useDispatch<Dispatch>();
  const { stats, id, status } = cardInfo;
  const unDoneSample = stats.new;
  const doneSample = stats.done + stats.skipped;
  const total = unDoneSample + doneSample;
  const navigate = useNavigate();
  const turnToAnnotation = (e: any) => {
    e.stopPropagation();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    // navigate('/taskList/task/taskAnnotation');
    navigate('/tasks/' + id);
  };
  const userInfo = useSelector((state: RootState) => state.user);

  const handleDeleteTask = (e: React.MouseEvent) => {
    e.stopPropagation();

    Modal.confirm({
      title: '删除任务',
      icon: <ExclamationOutlined />,
      content: '确定删除该任务吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        dispatch.task.deleteTask(id);
        navigate('/tasks');
      },
    });
  };

  // TODO: 以下代码需要优化 =============================
  const [activeTxt, setActiveTxt] = useState('JSON');
  const [isShowModal, setIsShowModal] = useState(false);
  const clickOk = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowModal(false);
    outputSamples(id, activeTxt);
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
  const deleteSingleTaskOk = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowDeleteModal(false);
    deleteTask(id)
      .then(() => {
        navigate('/tasks?' + new Date().getTime());
      })
      .catch((_e) => commonController.notificationErrorMessage(_e, 1));
  };
  const deleteSingleTaskCancel = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowDeleteModal(false);
  };
  const stopPropagation = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
  };

  return (
    <FlexItem className={currentStyles.cardWrapper} onClick={turnToAnnotation}>
      <div className={currentStyles.cardInner}>
        <div className={currentStyles.item}>
          <div className={currentStyles.itemLeft}>
            <div className={currentStyles.itemTaskName}>{cardInfo.name}</div>
            {cardInfo.status !== 'DRAFT' && cardInfo.status !== 'IMPORTED' && (
              <div className={currentStyles.mediaType}>
                <div style={{ color: '#1b67ff' }}>图片</div>
              </div>
            )}
            {(cardInfo.status === 'DRAFT' || cardInfo.status === 'IMPORTED') && (
              <div className={currentStyles.draft}>
                <div style={{ color: '#FF8800' }}>草稿</div>
              </div>
            )}
          </div>
          <div className={currentStyles.actions}>
            <div
              className={currentStyles.upload}
              onClick={(e: any) => {
                e.nativeEvent.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
                setIsShowModal(true);
              }}
            >
              <Tooltip placement={'top'} title={'数据导出'}>
                <Icon className={currentStyles.actionIcon} component={OutputIcon} />
              </Tooltip>
            </div>
            {userInfo.username === cardInfo.created_by.username && (
              <div onClick={handleDeleteTask} className={currentStyles.delete}>
                <Tooltip title={'删除项目'} placement={'top'}>
                  <Icon className={currentStyles.actionIcon} component={DeleteIcon} />
                </Tooltip>
              </div>
            )}
          </div>
        </div>
        <div className={currentStyles.item} style={{ marginTop: '8px' }}>
          {cardInfo.created_by?.username}
        </div>
        <div className={currentStyles.item} style={{ marginTop: '8px' }}>
          {moment(cardInfo.created_at).format('YYYY-MM-DD HH:MM')}
        </div>
        {doneSample === total && status !== 'DRAFT' && status !== 'IMPORTED' && (
          <div className={currentStyles.item41}>
            <div className={currentStyles.item41Left}>
              {total}/{total}
            </div>
            <div className={currentStyles.item41Right}>
              <Status type="success">已完成</Status>
            </div>
          </div>
        )}
        {doneSample !== total && status !== 'DRAFT' && status !== 'IMPORTED' && (
          <div className={currentStyles.item42}>
            <div className={currentStyles.item42Left}>
              <Progress percent={Math.trunc((doneSample * 100) / total)} showInfo={false} />
            </div>
            <div className={currentStyles.item41Left}>
              {doneSample}/{total}
            </div>
          </div>
        )}
        {isShowDeleteModal && (
          <div onClick={stopPropagation}>
            <Modal open={isShowDeleteModal} onOk={deleteSingleTaskOk} onCancel={deleteSingleTaskCancel}>
              <IconText
                icon={
                  <div className={currentStyles.tipWarnIcon}>
                    <ExclamationOutlined />
                  </div>
                }
              >
                您确认要删除该任务吗？
              </IconText>
            </Modal>
          </div>
        )}
        {isShowModal && (
          <div onClick={stopPropagation}>
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
                  <div className={currentStyles.bottom}>
                    COCO数据集标准格式，面向物体检测（拉框）和图像分割（多边形）任务
                  </div>
                )}
                {activeTxt === 'MASK' && <div className={currentStyles.bottom}>面向图像分割（多边形）任务</div>}
              </div>
            </Modal>
          </div>
        )}
      </div>
    </FlexItem>
  );
};
export default TaskCard;
