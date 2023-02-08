import React, { useState } from 'react';
import { Modal, Progress, Tooltip } from 'antd';
import { useNavigate } from 'react-router';
import moment from 'moment';
import { ExclamationOutlined } from '@ant-design/icons';

import commonController from '../../utils/common/common';
import { outputSamples } from '../../services/samples';
import currentStyles from './index.module.scss';
import { deleteTask } from '../../services/createTask';
import currentStyles1 from '../../pages/outputData/index.module.scss';

const TaskCard = (props: any) => {
  const [isShowDeleteModal, setIsShowDeleteModal] = useState(false);

  const { cardInfo } = props;
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
  const localUserEmail = localStorage.getItem('username');

  const deleteTaskLocal = (e: any) => {
    e.nativeEvent.stopImmediatePropagation();
    e.preventDefault();
    e.stopPropagation();
    setIsShowDeleteModal(true);
  };
  const [activeTxt, setActiveTxt] = useState('JSON');
  const [isShowModal, setIsShowModal] = useState(false);
  const clickOk = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowModal(false);
    outputSamples(id, activeTxt).catch((error) => {
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
  const deleteSingleTaskOk = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowDeleteModal(false);
    deleteTask(id)
      .then((res: any) => {
        if (res.status === 200) {
          navigate('/tasks?' + new Date().getTime());
        } else {
          commonController.notificationErrorMessage({ message: '删除不成功' }, 100);
        }
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
  const [isShowTwoButtons, setIsShowTwoButtons] = useState(0);
  const [isShowBlue, setIsShowBlue] = useState('');

  return (
    <div
      className={currentStyles.outerFrame}
      onClick={turnToAnnotation}
      onMouseOver={() => {
        setIsShowTwoButtons(id);
      }}
      onMouseLeave={() => {
        setIsShowTwoButtons(0);
      }}
    >
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
        {isShowTwoButtons === id && (
          <div className={currentStyles.icons2}>
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
                {isShowBlue !== 'outputData' && (
                  <img
                    src="/src/icons/outputData1.svg"
                    onMouseOver={() => {
                      setIsShowBlue('outputData');
                    }}
                    onMouseLeave={() => {
                      setIsShowBlue('');
                    }}
                    alt=""
                  />
                )}
                {isShowBlue === 'outputData' && (
                  <img
                    src="/src/icons/outputDataBlue.svg"
                    onMouseOver={() => {
                      setIsShowBlue('outputData');
                    }}
                    onMouseLeave={() => {
                      setIsShowBlue('');
                    }}
                    alt=""
                  />
                )}
                {/*<UploadOutlined />*/}
              </Tooltip>
            </div>
            {localUserEmail === cardInfo.created_by.username && (
              <div onClick={deleteTaskLocal} className={currentStyles.delete}>
                <Tooltip title={'删除项目'} placement={'top'}>
                  {isShowBlue !== 'delete' && (
                    <img
                      src="/src/icons/delete.svg"
                      onMouseOver={() => {
                        setIsShowBlue('delete');
                      }}
                      onMouseLeave={() => {
                        setIsShowBlue('');
                      }}
                      alt=""
                    />
                  )}
                  {isShowBlue === 'delete' && (
                    <img
                      src="/src/icons/deleteBlue.svg"
                      onMouseOver={() => {
                        setIsShowBlue('delete');
                      }}
                      onMouseLeave={() => {
                        setIsShowBlue('');
                      }}
                      alt=""
                    />
                  )}
                  {/*<DeleteOutlined/>*/}
                </Tooltip>
              </div>
            )}
          </div>
        )}
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
            {total}/{total}{' '}
          </div>
          {/*<div className = {currentStyles.item41Right}><CheckCircleOutlined style ={{color : '#00B365'}}/>&nbsp;已完成</div>*/}
          <div className={currentStyles.item41Right}>
            <img src="/src/icons/finished.svg" />
            &nbsp;已完成
          </div>
        </div>
      )}
      {doneSample !== total && status !== 'DRAFT' && status !== 'IMPORTED' && (
        <div className={currentStyles.item42}>
          <div className={currentStyles.item42Left}>
            <Progress percent={Math.trunc((doneSample * 100) / total)} showInfo={false} />
          </div>
          <div className={currentStyles.item41Left}>
            &nbsp;&nbsp;{doneSample}/{total}{' '}
          </div>
        </div>
      )}
      {isShowDeleteModal && (
        <div onClick={stopPropagation}>
          <Modal open={isShowDeleteModal} onOk={deleteSingleTaskOk} onCancel={deleteSingleTaskCancel}>
            <div className={currentStyles.deleteWarnInfo}>
              <div className={currentStyles.tipWarnIcon}>
                <ExclamationOutlined />
              </div>
              <span>&nbsp;&nbsp;您确认要删除该任务吗？</span>
            </div>
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
  );
};
export default TaskCard;
