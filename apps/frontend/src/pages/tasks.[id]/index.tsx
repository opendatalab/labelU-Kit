import React, { useState } from 'react';
import { Link, useParams, useRouteLoaderData, useSearchParams } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { Table, Pagination, Button } from 'antd';
import { VideoCard } from '@labelu/video-annotator-react';
import _ from 'lodash-es';
import formatter from '@labelu/formatter';
import styled from 'styled-components';

import type { SampleResponse } from '@/api/types';
import { MediaType, TaskStatus } from '@/api/types';
import ExportPortal from '@/components/ExportPortal';
import type { TaskLoaderResult } from '@/loaders/task.loader';
import FlexLayout from '@/layouts/FlexLayout';
import BlockContainer from '@/layouts/BlockContainer';

import type { TaskStatusProps } from './components/Statistical';
import Statistical, { TaskStatus as TaskStatusComponent } from './components/Statistical';
import GoToEditTask from './components/GoToEditTask';

const HeaderWrapper = styled(FlexLayout.Header)`
  background-color: #fff;
  height: 3.5rem;
`;

const Samples = () => {
  const routerData = useRouteLoaderData('task') as TaskLoaderResult;
  const samples = _.get(routerData, 'samples.data');
  const task = _.get(routerData, 'task');
  const metaData = routerData?.samples?.meta_data;
  const routeParams = useParams();
  const taskId = +routeParams.taskId!;

  // 查询参数
  const [searchParams, setSearchParams] = useSearchParams(
    new URLSearchParams({
      // 默认按照最后更新时间倒序
      pageNo: '1',
      pageSize: '10',
    }),
  );

  const taskStatus = _.get(task, 'status');
  const isTaskReadyToAnnotate =
    ![TaskStatus.DRAFT, TaskStatus.IMPORTED].includes(taskStatus!) &&
    task?.config &&
    Object.keys(task?.config).length > 0;
  const [enterRowId, setEnterRowId] = useState<any>(undefined);
  const [selectedSampleIds, setSelectedSampleIds] = useState<any>([]);

  const columns: ColumnsType<SampleResponse> = [
    {
      title: '数据ID',
      dataIndex: 'id',
      key: 'id',
      align: 'left',
    },
    {
      title: '数据预览',
      dataIndex: 'data',
      key: 'packageID',
      align: 'left',
      render: (data) => {
        let url = '';
        for (const sampleId in data.urls) {
          url = data.urls[sampleId];
        }

        if (task!.media_type === MediaType.IMAGE) {
          return <img src={url} style={{ width: '116px', height: '70px' }} />;
        } else if (task!.media_type === MediaType.AUDIO) {
          return <audio src={url} controls />;
        } else {
          return <VideoCard size={{ width: 116, height: 70 }} src={url} showPlayIcon showDuration />;
        }
      },
    },
    {
      title: '标注情况',
      dataIndex: 'state',
      key: 'packageID',
      align: 'left',

      render: (text) => {
        if (!isTaskReadyToAnnotate) {
          return '';
        }

        return <TaskStatusComponent status={_.lowerCase(text) as TaskStatusProps['status']} />;
      },
      sorter: true,
    },
    {
      title: '标注数',
      dataIndex: 'annotated_count',
      key: 'annotated_count',
      align: 'left',

      render: (temp: any, record: any) => {
        let result = 0;
        const resultJson = JSON.parse(record.data.result);
        for (const key in resultJson) {
          if (key.indexOf('Tool') > -1 && key !== 'textTool' && key !== 'tagTool') {
            const tool = resultJson[key];
            if (!tool.result) {
              let _temp = 0;
              if (tool.length) {
                _temp = tool.length;
              }
              result = result + _temp;
            } else {
              result = result + tool.result.length;
            }
          }
        }
        return result;
      },
      sorter: true,

      // width: 80,
    },
    {
      title: '标注者',
      dataIndex: 'created_by',
      key: 'created_by',
      align: 'left',

      render: (created_by: any) => {
        if (!isTaskReadyToAnnotate) {
          return '';
        }
        return created_by.username;
      },
    },
    {
      title: '上次标注时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      align: 'left',

      // width : 310,
      render: (updated_at: any) => {
        if (!isTaskReadyToAnnotate) {
          return '';
        }

        return formatter.format('dateTime', new Date(updated_at), { style: 'YYYY-MM-DD HH:mm' });
      },
    },
    {
      title: '',
      dataIndex: 'option',
      key: 'option',
      width: 180,
      align: 'center',

      render: (x: any, record: any) => {
        return (
          <>
            {record.id === enterRowId && isTaskReadyToAnnotate && (
              <Link to={`/tasks/${taskId}/samples/${record.id}`}>
                <Button type="link">进入标注</Button>
              </Link>
            )}
          </>
        );
      },
    },
  ];

  const rowSelection = {
    columnWidth: 58,
    onChange: (selectedKeys: number[]) => {
      setSelectedSampleIds(selectedKeys);
    },
    getCheckboxProps: (record: any) => {
      return {
        disabled: false, // Column configuration not to be checked
        name: record.packageID,
        key: record.packageID,
      };
    },
    selectedKeys: () => {},
  };

  // @ts-ignore
  const handleTableChange = (pagination, filters, sorter) => {
    if (!_.isEmpty(pagination)) {
      searchParams.set('pageNo', `${pagination.current}`);
      searchParams.set('pageSize', `${pagination.pageSize}`);
    }

    if (sorter) {
      let sortValue = '';
      switch (sorter.order) {
        case 'ascend':
          sortValue = 'asc';
          break;
        case 'descend':
          sortValue = 'desc';
          break;
        case undefined:
          sortValue = 'desc';
          break;
      }
      searchParams.set('sort', `${_.get(sorter, 'field')}:${sortValue}`);
    } else {
      searchParams.delete('sort');
    }

    setSearchParams(searchParams);
  };
  const handlePaginationChange = (page: number, pageSize: number) => {
    searchParams.set('pageNo', `${page}`);
    searchParams.set('pageSize', `${pageSize}`);
    setSearchParams(searchParams);
  };

  const onMouseEnterRow = (rowId: any) => {
    setEnterRowId(rowId);
  };
  const onRow = (record: any) => {
    return {
      onMouseLeave: () => setEnterRowId(undefined),
      onMouseOver: () => {
        onMouseEnterRow(record.id);
      },
    };
  };

  return (
    <FlexLayout direction="column" full gap="2rem">
      <HeaderWrapper flex items="center">
        <FlexLayout.Content full>
          <BlockContainer>
            {isTaskReadyToAnnotate ? <Statistical /> : <GoToEditTask taskStatus={taskStatus} />}
          </BlockContainer>
        </FlexLayout.Content>
      </HeaderWrapper>

      <FlexLayout.Content scroll>
        <BlockContainer>
          <FlexLayout justify="space-between" direction="column" gap="1rem">
            <Table
              columns={columns}
              dataSource={samples || []}
              pagination={false}
              rowKey={(record) => record.id!}
              rowSelection={rowSelection}
              onRow={onRow}
              onChange={handleTableChange}
            />
            <FlexLayout justify="space-between">
              <ExportPortal taskId={+taskId!} sampleIds={selectedSampleIds} mediaType={task!.media_type!}>
                <Button type="link" disabled={selectedSampleIds.length === 0}>
                  批量数据导出
                </Button>
              </ExportPortal>
              <Pagination
                current={parseInt(searchParams.get('pageNo') || '1')}
                pageSize={parseInt(searchParams.get('pageSize') || '10')}
                total={metaData?.total}
                showSizeChanger
                showQuickJumper
                onChange={handlePaginationChange}
              />
            </FlexLayout>
          </FlexLayout>
        </BlockContainer>
      </FlexLayout.Content>
    </FlexLayout>
  );
};

export default Samples;
