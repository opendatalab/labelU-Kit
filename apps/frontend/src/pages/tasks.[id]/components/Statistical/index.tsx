import { UploadOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { Button } from 'antd';
import { useSelector } from 'react-redux';
import _ from 'lodash-es';

import type { RootState } from '@/store';

import currentStyles from './index.module.scss';
import commonController from '../../../../utils/common/common';
import ExportPortal from '../../../../components/ExportPortal';

const Statistical = () => {
  const taskData = useSelector((state: RootState) => state.task.item);
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
        <ExportPortal taskId={+taskId!}>
          <Button type="text" icon={<UploadOutlined />}>
            数据导出
          </Button>
        </ExportPortal>
        <Button type="primary" ghost onClick={handleGoUpload}>
          数据导入
        </Button>
        <Button type="primary" onClick={commonController.debounce(handleGoAnnotation, 100)}>
          开始标注
        </Button>
      </div>
    </div>
  );
};
export default Statistical;
