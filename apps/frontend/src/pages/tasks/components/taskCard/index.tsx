import React from 'react';
import { Button, Progress, Tooltip } from 'antd';
import { useNavigate, useRevalidator } from 'react-router';
import Icon from '@ant-design/icons';
import formatter from '@labelu/formatter';
import { EllipsisText } from '@labelu/components-react';

import { modal } from '@/StaticAnt';
import { ReactComponent as DeleteIcon } from '@/assets/svg/delete.svg';
import { ReactComponent as OutputIcon } from '@/assets/svg/outputData.svg';
import { deleteTask } from '@/api/services/task';
import Status from '@/components/Status';
import ExportPortal from '@/components/ExportPortal';
import { MediaTypeText } from '@/constants/mediaType';
import type { MediaType } from '@/api/types';
import { TaskStatus } from '@/api/types';
import * as storage from '@/utils/storage';
import FlexLayout from '@/layouts/FlexLayout';

import { ActionRow, CardWrapper, MediaBadge, Row, TaskName } from './style';

function MediaTypeTag({ type, status }: React.PropsWithChildren<{ type: MediaType; status: TaskStatus }>) {
  let children = MediaTypeText[type];
  let color = 'var(--color-primary)';
  let bgColor = 'var(--color-primary-bg)';

  if (status === TaskStatus.DRAFT || status === TaskStatus.IMPORTED) {
    children = '草稿';
    color = 'var(--color-warning-text)';
    bgColor = 'var(--color-warning-bg)';
  } else {
    children = MediaTypeText[type];
  }

  return (
    <MediaBadge color={color} bg={bgColor}>
      {children}
    </MediaBadge>
  );
}

const TaskCard = (props: any) => {
  const { cardInfo, className } = props;
  const revalidator = useRevalidator();
  const { stats, id, status } = cardInfo;
  const unDoneSample = stats.new;
  const doneSample = stats.done + stats.skipped;
  const total = unDoneSample + doneSample;
  const navigate = useNavigate();
  const turnToAnnotation = (e: any) => {
    if (!e.currentTarget.contains(e.target)) {
      return;
    }

    e.stopPropagation();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    navigate('/tasks/' + id);
  };
  const username = storage.get('username');

  const handleDeleteTask = (e: React.MouseEvent) => {
    e.stopPropagation();

    modal.confirm({
      title: '删除任务',
      content: '确定删除该任务吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        await deleteTask(id);
        revalidator.revalidate();
      },
    });
  };

  return (
    <CardWrapper className={className} onClick={turnToAnnotation} gap=".5rem">
      <Row justify="space-between">
        <FlexLayout items="center" gap=".5rem">
          <EllipsisText maxWidth={120} title={cardInfo.name}>
            <TaskName>{cardInfo.name}</TaskName>
          </EllipsisText>
          <MediaTypeTag type={cardInfo.media_type as MediaType} status={cardInfo.status} />
        </FlexLayout>
        <ActionRow justify="flex-end" items="center">
          <ExportPortal taskId={cardInfo.id} mediaType={cardInfo.media_type}>
            <Tooltip placement={'top'} title={'数据导出'}>
              <Button size="small" type="text" icon={<Icon component={OutputIcon} />} />
            </Tooltip>
          </ExportPortal>
          {username === cardInfo.created_by.username && (
            <Tooltip title={'删除文件'} placement={'top'}>
              <Button onClick={handleDeleteTask} size="small" type="text" icon={<Icon component={DeleteIcon} />} />
            </Tooltip>
          )}
        </ActionRow>
      </Row>

      <Row>{cardInfo.created_by?.username}</Row>
      <Row>{formatter.format('dateTime', cardInfo.created_at, { style: 'YYYY-MM-DD HH:mm' })}</Row>

      {doneSample === total && status !== 'DRAFT' && status !== 'IMPORTED' && (
        <FlexLayout gap=".5rem">
          <FlexLayout.Header>
            {total}/{total}
          </FlexLayout.Header>
          <FlexLayout.Footer>
            <Status type="success">已完成</Status>
          </FlexLayout.Footer>
        </FlexLayout>
      )}
      {doneSample !== total && status !== 'DRAFT' && status !== 'IMPORTED' && (
        <FlexLayout gap=".5rem">
          <FlexLayout.Content>
            <Progress percent={Math.trunc((doneSample * 100) / total)} showInfo={false} />
          </FlexLayout.Content>
          <FlexLayout.Footer>
            {doneSample}/{total}
          </FlexLayout.Footer>
        </FlexLayout>
      )}
    </CardWrapper>
  );
};
export default TaskCard;
