import React, { useEffect, useState } from 'react';
import { CheckOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import { Button } from 'antd';

import { getTask } from '@/services/task';
import ExportPortal from '@/components/ExportPortal';

import currentStyles from './index.module.scss';
import commonController from '../../utils/common/common';

const SamplesFinished = () => {
  const [stat, setStat] = useState<any>({});
  const routeParams = useParams();
  const taskId = +routeParams.taskId!;

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
  const handleGoHome = () => {
    navigate(`/tasks/${taskId}`);
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
          <ExportPortal taskId={taskId}>
            <Button type="primary" size="large">
              导出数据
            </Button>
          </ExportPortal>
          <Button type="text" size="large" onClick={handleGoHome}>
            返回主页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SamplesFinished;
