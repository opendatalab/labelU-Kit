import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Link, useParams, useRevalidator, useRouteLoaderData, useSearchParams } from 'react-router-dom';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { Table, Pagination, Button, Popconfirm, Tag, Tooltip } from 'antd';
import { VideoCard, FlexLayout } from '@labelu/components-react';
import _ from 'lodash-es';
import formatter from '@labelu/formatter';
import styled from 'styled-components';
import { QuestionCircleOutlined } from '@ant-design/icons';

import type { PreAnnotationFileResponse, SampleResponse } from '@/api/types';
import { MediaType, TaskStatus } from '@/api/types';
import ExportPortal from '@/components/ExportPortal';
import type { TaskLoaderResult } from '@/loaders/task.loader';
import BlockContainer from '@/layouts/BlockContainer';
import { downloadFromUrl } from '@/utils';
import { deletePreAnnotationFile } from '@/api/services/preAnnotations';
import { deleteSamples } from '@/api/services/samples';

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
  const revalidator = useRevalidator();
  const preAnnotations = _.get(routerData, 'preAnnotations.data') as any;
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

  const sampleNamesWithPreAnnotation = useMemo(() => {
    return _.chain(preAnnotations).map('sample_names').flatten().value();
  }, [preAnnotations]);

  const taskStatus = _.get(task, 'status');
  const isTaskReadyToAnnotate =
    ![TaskStatus.DRAFT, TaskStatus.IMPORTED].includes(taskStatus!) &&
    task?.config &&
    Object.keys(task?.config).length > 0;
  const [enterRowId, setEnterRowId] = useState<any>(undefined);
  const [selectedSampleIds, setSelectedSampleIds] = useState<any>([]);

  const handleDeleteJsonl = async (id: number) => {
    await deletePreAnnotationFile({
      task_id: taskId,
      file_id: id,
    });

    revalidator.revalidate();
  };

  const handleDeleteSample = async (ids: number[]) => {
    await deleteSamples({ task_id: taskId }, { sample_ids: ids });
    revalidator.revalidate();
  };

  const columns: ColumnsType<SampleResponse | PreAnnotationFileResponse> = [
    {
      title: '数据ID',
      dataIndex: 'inner_id',
      key: 'inner_id',
      align: 'left',
      sorter: true,
    },
    {
      title: '文件名',
      dataIndex: ['file', 'filename'],
      key: 'filename',
      align: 'left',
      render: (filename, record) => {
        const _filename = (record as SampleResponse).file?.filename ?? '';

        if ((record as PreAnnotationFileResponse).sample_names) {
          return (
            <span>
              {formatter.format('ellipsis', _.get(record, 'filename'), { maxWidth: 160, type: 'tooltip' })}
              &nbsp;
              <Tag color="processing">预标注</Tag>
            </span>
          );
        }
        return formatter.format('ellipsis', _filename, { maxWidth: 160, type: 'tooltip' });
      },
    },
    {
      title: '数据预览',
      dataIndex: 'file',
      key: 'file',
      align: 'left',
      render: (data, record) => {
        if ((record as PreAnnotationFileResponse).sample_names) {
          return '-';
        }

        if (task!.media_type === MediaType.IMAGE) {
          return <img src={data?.url} style={{ width: '116px', height: '70px' }} />;
        } else if (task!.media_type === MediaType.AUDIO) {
          return <audio src={data?.url} controls />;
        } else {
          return <VideoCard size={{ width: 116, height: 70 }} src={data?.url} showPlayIcon showDuration />;
        }
      },
    },
    {
      title: (
        <>
          预标注 &nbsp;
          <Tooltip
            title={
              <>
                数据导入时上传 label.jsonl 即可导入预标注，预标注格式参考{' '}
                <a
                  href="https://opendatalab.github.io/labelU/#/schema/pre-annotation/image"
                  target="_blank"
                  rel="noreferrer"
                >
                  示例
                </a>
              </>
            }
          >
            <QuestionCircleOutlined />
          </Tooltip>
        </>
      ),
      dataIndex: 'unknown',
      key: 'unknown',
      align: 'left',
      render: (text, record) => {
        const sampleNames = _.get(record, 'sample_names');
        if (sampleNames) {
          return '-';
        }

        const realSampleName = (record as SampleResponse).file?.filename;

        return sampleNamesWithPreAnnotation.includes(realSampleName) ? '是' : '无';
      },
    },
    {
      title: '标注情况',
      dataIndex: 'state',
      key: 'state',
      align: 'left',
      render: (text, record) => {
        if (record.file?.filename?.endsWith('.jsonl')) {
          return '-';
        }

        if (!isTaskReadyToAnnotate) {
          return '-';
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
      render: (_unused, record) => {
        if (record.file?.filename?.endsWith('.jsonl')) {
          return '-';
        }

        let result = 0;
        const resultJson = record?.data?.result ? JSON.parse(record?.data?.result) : {};
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
      width: 80,
    },
    {
      title: '标注者',
      dataIndex: 'created_by',
      key: 'created_by',
      align: 'left',
      render: (created_by, record) => {
        if ((record as unknown as PreAnnotationFileResponse)?.filename?.endsWith('.jsonl')) {
          return '-';
        }

        if (!isTaskReadyToAnnotate) {
          return '-';
        }

        return created_by.username;
      },
    },
    {
      title: '上次标注时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      align: 'left',
      sorter: true,
      render: (updated_at, record) => {
        const sampleNames = _.get(record, 'sample_names');

        if (sampleNames) {
          return '-';
        }

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
      width: 140,
      align: 'center',
      fixed: 'right',
      render: (x, record) => {
        const sampleNames = _.get(record, 'sample_names');

        if (record.id !== enterRowId) {
          return '';
        }

        if (sampleNames) {
          return (
            <FlexLayout items="center">
              <Button type="link" onClick={() => downloadFromUrl(record.url, record?.filename)}>
                下载
              </Button>
              <Popconfirm title="确定删除此文件？" onConfirm={() => handleDeleteJsonl(record.id!)}>
                <Button type="link" danger>
                  删除
                </Button>
              </Popconfirm>
            </FlexLayout>
          );
        }

        return (
          <FlexLayout items="center" gap="0.5rem">
            {isTaskReadyToAnnotate && (
              <Link to={`/tasks/${taskId}/samples/${record.id}`}>
                <Button type="link">进入标注</Button>
              </Link>
            )}
            <Popconfirm title="确定删除此文件？" onConfirm={() => handleDeleteSample([record.id!])}>
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </FlexLayout>
        );
      },
    },
  ];

  const rowSelection: TableProps<SampleResponse>['rowSelection'] = {
    columnWidth: 58,
    onChange: (selectedKeys) => {
      setSelectedSampleIds(selectedKeys);
    },
  };

  const handleTableChange: TableProps<SampleResponse>['onChange'] = (pagination, filters, sorter) => {
    if (!_.isEmpty(pagination)) {
      searchParams.set('pageNo', `${pagination.current}`);
      searchParams.set('pageSize', `${pagination.pageSize}`);
    }

    if (sorter) {
      let sortValue = '';
      // @ts-ignore
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

  useLayoutEffect(() => {
    if (task?.media_type !== MediaType.AUDIO) {
      return;
    }

    const handleOnPlay = (e: Event) => {
      const audios = document.getElementsByTagName('audio');
      // 使当前只有一条音频在播放
      for (let i = 0, len = audios.length; i < len; i++) {
        if (audios[i] !== e.target) {
          (audios[i] as HTMLAudioElement).pause();
        }
      }
    };

    document.addEventListener('play', handleOnPlay, true);

    return () => {
      document.removeEventListener('play', handleOnPlay, true);
    };
  }, [task?.media_type]);

  const data = useMemo(() => {
    return [...(preAnnotations ?? []), ...(samples ?? [])];
  }, [preAnnotations, samples]);

  console.log('data', sampleNamesWithPreAnnotation);

  return (
    <FlexLayout flex="column" full gap="2rem">
      <HeaderWrapper flex items="center">
        <FlexLayout.Content full>
          <BlockContainer>
            {isTaskReadyToAnnotate ? <Statistical /> : <GoToEditTask taskStatus={taskStatus} />}
          </BlockContainer>
        </FlexLayout.Content>
      </HeaderWrapper>

      <FlexLayout.Content scroll>
        <FlexLayout justify="space-between" flex="column" gap="1rem" padding="0 1.5rem 1.5rem">
          <Table
            columns={columns}
            dataSource={data}
            pagination={false}
            rowKey={(record) => record.id!}
            rowSelection={rowSelection}
            onRow={onRow}
            onChange={handleTableChange}
          />
          <FlexLayout justify="space-between">
            <ExportPortal
              taskId={+taskId!}
              sampleIds={selectedSampleIds}
              mediaType={task!.media_type!}
              tools={task?.config?.tools}
            >
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
      </FlexLayout.Content>
    </FlexLayout>
  );
};

export default Samples;
