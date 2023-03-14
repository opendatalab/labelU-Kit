import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Pagination, Button } from 'antd';
import _ from 'lodash-es';
import moment from 'moment';

import type { Dispatch, RootState } from '@/store';
import { SampleState, TaskStatus } from '@/services/types';
import ExportPortal from '@/components/ExportPortal';

import currentStyles from './index.module.scss';
import Statistical from './components/Statistical';
import GoToEditTask from './components/GoToEditTask';
import statisticalStyles from './components/Statistical/index.module.scss';

const Samples = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<Dispatch>();
  const routeParams = useParams();
  const taskId = +routeParams.taskId!;
  const taskData = useSelector((state: RootState) => state.task.item);

  // 查询参数
  const [searchParams, setSearchParams] = useSearchParams(
    new URLSearchParams({
      // 默认按照最后更新时间倒序
      pageNo: '1',
      pageSize: '10',
    }),
  );

  const taskStatus = _.get(taskData, 'status');
  const isTaskReadyToAnnotate = ![TaskStatus.DRAFT, TaskStatus.IMPORTED].includes(taskStatus!);
  const {
    meta_data = {
      total: 0,
    },
    data: samples,
  } = useSelector((state: RootState) => state.sample.list);

  // 初始化获取样本列表
  useEffect(() => {
    dispatch.sample.fetchSamples({
      task_id: +taskId!,
      ...Object.fromEntries(searchParams.entries()),
    });
  }, [dispatch.sample, searchParams, taskId]);

  // 获取任务信息
  useEffect(() => {
    dispatch.task.fetchTask(taskId);
  }, [dispatch.task, taskId]);

  const [enterRowId, setEnterRowId] = useState<any>(undefined);
  const [selectedSampleIds, setSelectedSampleIds] = useState<any>([]);

  const handleGoAnnotation = (sampleId: number) => {
    navigate(`/tasks/${taskId}/samples/${sampleId}`);
  };

  const columns: any = [
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
      render: (data: any) => {
        let url = '';
        for (const sampleId in data.urls) {
          url = data.urls[sampleId];
        }
        return <img src={url} style={{ width: '116px', height: '70px' }} />;
      },
    },
    {
      title: '标注情况',
      dataIndex: 'state',
      key: 'packageID',
      align: 'left',

      render: (text: string) => {
        if (!isTaskReadyToAnnotate) {
          return '';
        }

        const icons: Record<SampleState, React.ReactNode> = {
          [SampleState.DONE]: <div className={statisticalStyles.leftTitleContentOptionBlueIcon} />,
          [SampleState.NEW]: <div className={statisticalStyles.leftTitleContentOptionGrayIcon} />,
          [SampleState.SKIPPED]: <div className={statisticalStyles.leftTitleContentOptionOrangeIcon} />,
        };

        const texts: Record<SampleState, string> = {
          [SampleState.DONE]: '已标注',
          [SampleState.NEW]: '未标注',
          [SampleState.SKIPPED]: '跳过',
        };

        return (
          <div className={currentStyles.leftTitleContentOption}>
            {icons[text as SampleState]}
            <div className={statisticalStyles.leftTitleContentOptionContent}>{texts[text as SampleState]}</div>
          </div>
        );
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
        return moment(updated_at).format('YYYY-MM-DD HH:MM');
      },
    },
    {
      title: '',
      dataIndex: 'option',
      key: 'option',
      width: 180,
      align: 'left',

      render: (x: any, record: any) => {
        return (
          <React.Fragment>
            {record.id === enterRowId && (
              <div className={currentStyles.optionItem}>
                {isTaskReadyToAnnotate && (
                  <div className={currentStyles.optionItemEnter} onClick={() => handleGoAnnotation(record.id)}>
                    进入标注
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
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

  // @ts-ignore
  return (
    <div className={currentStyles.outerFrame}>
      <div className={currentStyles.stepsRow}>
        {isTaskReadyToAnnotate ? <Statistical /> : <GoToEditTask taskStatus={taskStatus} />}
      </div>
      <div className={currentStyles.content}>
        <Table
          columns={columns}
          dataSource={samples || []}
          pagination={false}
          rowKey={(record) => record.id!}
          rowSelection={rowSelection}
          onRow={onRow}
          onChange={handleTableChange}
        />
        <div className={currentStyles.pagination}>
          <div className={currentStyles.dataProcess}>
            <ExportPortal taskId={+taskId!} sampleIds={selectedSampleIds}>
              <Button type="link" disabled={selectedSampleIds.length === 0}>
                批量数据导出
              </Button>
            </ExportPortal>
          </div>
          <Pagination
            current={parseInt(searchParams.get('pageNo') || '1')}
            pageSize={parseInt(searchParams.get('pageSize') || '10')}
            total={meta_data?.total}
            showSizeChanger
            showQuickJumper
            onChange={handlePaginationChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Samples;
