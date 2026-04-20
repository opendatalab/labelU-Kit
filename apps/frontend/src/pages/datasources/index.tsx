import { useState } from 'react';
import { Button, Pagination, Popconfirm, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { FlexLayout } from '@labelu/components-react';
import { useTranslation } from '@labelu/i18n';
import formatter from '@labelu/formatter';

import CustomEmpty from '@/components/CustomEmpty';
import type { DataSourceResponse, CreateDataSourceCommand, UpdateDataSourceCommand } from '@/api/types';
import { getDataSources, updateDataSource } from '@/api/services/datasource';
import { datasourceKey } from '@/api/queryKeyFactories/datasource';
import { useCreateDataSourceMutation, useDeleteDataSourceMutation } from '@/api/mutations/datasource';

import DataSourceFormModal from './DataSourceFormModal';
import { Wrapper, Header, Footer } from './style';

const DataSources = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = searchParams.get('page') ? +searchParams.get('page')! : 1;
  const pageSize = searchParams.get('size') ? +searchParams.get('size')! : 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDs, setEditingDs] = useState<DataSourceResponse | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: datasourceKey.list({ page, size: pageSize }),
    queryFn: () => getDataSources({ page, size: pageSize }),
  });

  const createMutation = useCreateDataSourceMutation();
  const deleteMutation = useDeleteDataSourceMutation();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ dsId, payload }: { dsId: number; payload: UpdateDataSourceCommand }) =>
      updateDataSource(dsId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKey.lists() });
    },
  });

  const handleCreate = () => {
    setEditingDs(null);
    setModalOpen(true);
  };

  const handleEdit = (record: DataSourceResponse) => {
    setEditingDs(record);
    setModalOpen(true);
  };

  const handleDelete = (dsId: number) => {
    deleteMutation.mutate(dsId, {
      onSuccess: () => {
        message.success(t('dataSourceDeleted'));
      },
    });
  };

  const handleSubmit = (values: CreateDataSourceCommand | UpdateDataSourceCommand) => {
    if (editingDs) {
      updateMutation.mutate(
        { dsId: editingDs.id, payload: values as UpdateDataSourceCommand },
        {
          onSuccess: () => {
            message.success(t('dataSourceUpdated'));
            setModalOpen(false);
          },
        },
      );
    } else {
      createMutation.mutate(values as CreateDataSourceCommand, {
        onSuccess: () => {
          message.success(t('dataSourceCreated'));
          setModalOpen(false);
        },
      });
    }
  };

  const columns = [
    {
      title: t('dataSourceName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('endpoint'),
      dataIndex: 'endpoint',
      key: 'endpoint',
      render: (v: string) => v || '-',
    },
    {
      title: t('bucket'),
      dataIndex: 'bucket',
      key: 'bucket',
    },
    {
      title: t('region'),
      dataIndex: 'region',
      key: 'region',
      render: (v: string) => v || '-',
    },
    {
      title: t('createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => (v ? formatter.format('dateTime', v, { style: 'YYYY-MM-DD HH:mm' }) : '-'),
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 160,
      render: (_: unknown, record: DataSourceResponse) => (
        <FlexLayout.Item flex gap=".5rem">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            {t('editDataSource')}
          </Button>
          <Popconfirm title={t('deleteDataSourceConfirm')} onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>
              {t('delete')}
            </Button>
          </Popconfirm>
        </FlexLayout.Item>
      ),
    },
  ];

  const total = data?.meta_data?.total ?? 0;

  return (
    <Wrapper flex="column">
      <Header>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('createDataSource')}
        </Button>
      </Header>
      <FlexLayout.Content scroll flex="column">
        <Table
          dataSource={data?.data ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          locale={{ emptyText: <CustomEmpty description={t('noDataSources')} /> }}
        />
      </FlexLayout.Content>
      {total > pageSize && (
        <Footer flex="row" justify="flex-end">
          <Pagination
            current={page}
            total={total}
            pageSize={pageSize}
            onChange={(value, _pageSize) => {
              searchParams.set('page', String(value));
              searchParams.set('size', String(_pageSize));
              setSearchParams(searchParams);
            }}
          />
        </Footer>
      )}
      <DataSourceFormModal
        open={modalOpen}
        editingDataSource={editingDs}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </Wrapper>
  );
};

export default DataSources;
