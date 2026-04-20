import { useState, useMemo, useCallback } from 'react';
import { Modal, Select, Button, Table, message } from 'antd';
import { FolderOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { FlexLayout } from '@labelu/components-react';
import { useTranslation } from '@labelu/i18n';
import { Link } from 'react-router-dom';
import formatter from '@labelu/formatter';

import type { MediaType, S3ObjectItem } from '@/api/types';
import { getDataSources, listS3Objects } from '@/api/services/datasource';
import { datasourceKey } from '@/api/queryKeyFactories/datasource';
import { useImportS3SamplesMutation } from '@/api/mutations/datasource';
import { FileExtension } from '@/constants/mediaType';

import { BreadcrumbNav } from './S3ImportModal.style';

interface S3ImportModalProps {
  open: boolean;
  onClose: () => void;
  taskId: number;
  mediaType: MediaType;
  onImportSuccess: (fileNames: string[]) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const S3ImportModal = ({ open, onClose, taskId, mediaType, onImportSuccess }: S3ImportModalProps) => {
  const { t } = useTranslation();
  const [selectedDsId, setSelectedDsId] = useState<number | undefined>();
  const [prefix, setPrefix] = useState<string | undefined>(undefined);
  const [objects, setObjects] = useState<S3ObjectItem[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const extension = useMemo(() => {
    const exts = FileExtension[mediaType];
    return exts ? exts.join(',') : undefined;
  }, [mediaType]);

  const { data: dsListData } = useQuery({
    queryKey: datasourceKey.list({ page: 1, size: 100 }),
    queryFn: () => getDataSources({ page: 1, size: 100 }),
    enabled: open,
  });

  const { isFetching } = useQuery({
    queryKey: datasourceKey.objectList({ ds_id: selectedDsId!, prefix, extension, page_token: null, size: 100 }),
    queryFn: async () => {
      const res = await listS3Objects({ ds_id: selectedDsId!, prefix, extension, page_token: null, size: 100 });
      setObjects(res.data.objects);
      setPageToken(res.data.next_page_token ?? null);
      setTruncated(res.data.truncated);
      return res;
    },
    enabled: open && !!selectedDsId,
  });

  const importMutation = useImportS3SamplesMutation(taskId);

  const handleLoadMore = useCallback(async () => {
    if (!selectedDsId || !pageToken) return;
    const res = await listS3Objects({ ds_id: selectedDsId, prefix, extension, page_token: pageToken, size: 100 });
    setObjects((prev) => [...prev, ...res.data.objects]);
    setPageToken(res.data.next_page_token ?? null);
    setTruncated(res.data.truncated);
  }, [selectedDsId, prefix, extension, pageToken]);

  const handleDsChange = (dsId: number) => {
    setSelectedDsId(dsId);
    setPrefix(undefined);
    setObjects([]);
    setPageToken(null);
    setTruncated(false);
    setSelectedKeys([]);
  };

  const handleFolderClick = (key: string) => {
    setPrefix(key);
    setObjects([]);
    setPageToken(null);
    setTruncated(false);
    setSelectedKeys([]);
  };

  const prefixSegments = useMemo(() => {
    if (!prefix) return [];
    const parts = prefix.replace(/\/$/, '').split('/');
    return parts.map((part, i) => ({
      label: part,
      prefix: parts.slice(0, i + 1).join('/') + '/',
    }));
  }, [prefix]);

  const isFolder = (key: string) => key.endsWith('/');

  const handleImport = () => {
    if (!selectedDsId || selectedKeys.length === 0) return;
    importMutation.mutate(
      { data_source_id: selectedDsId, object_keys: selectedKeys },
      {
        onSuccess: () => {
          message.success(t('importSuccess').replace('{count}', String(selectedKeys.length)));
          const fileNames = selectedKeys.map((key) => key.split('/').pop() ?? key);
          setSelectedKeys([]);
          onImportSuccess(fileNames);
          onClose();
        },
      },
    );
  };

  const handleImportAll = () => {
    if (!selectedDsId) return;
    const currentFileNames = objects.filter((o) => !isFolder(o.key)).map((o) => o.key.split('/').pop() ?? o.key);
    importMutation.mutate(
      { data_source_id: selectedDsId, prefix: prefix ?? '', extension },
      {
        onSuccess: (res) => {
          const count = res?.data?.ids?.length ?? 0;
          message.success(t('importSuccess').replace('{count}', String(count)));
          setSelectedKeys([]);
          onImportSuccess(count > 0 ? (currentFileNames.length > 0 ? currentFileNames : [`${count} files`]) : []);
          onClose();
        },
      },
    );
  };

  const columns = [
    {
      title: t('filename'),
      dataIndex: 'key',
      key: 'key',
      render: (key: string) => {
        const name = key.replace(prefix ?? '', '');
        if (isFolder(key)) {
          return (
            <Button type="link" icon={<FolderOutlined />} onClick={() => handleFolderClick(key)} style={{ padding: 0 }}>
              {name}
            </Button>
          );
        }
        return name;
      },
    },
    {
      title: t('fileSize'),
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number, record: S3ObjectItem) => (isFolder(record.key) ? '-' : formatFileSize(size)),
    },
    {
      title: t('lastModified'),
      dataIndex: 'last_modified',
      key: 'last_modified',
      width: 180,
      render: (v: string) => (v ? formatter.format('dateTime', v, { style: 'YYYY-MM-DD HH:mm' }) : '-'),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedKeys,
    onChange: (keys: React.Key[]) => setSelectedKeys(keys as string[]),
    getCheckboxProps: (record: S3ObjectItem) => ({
      disabled: isFolder(record.key),
    }),
  };

  return (
    <Modal
      open={open}
      title={t('importFromS3')}
      onCancel={onClose}
      width={800}
      footer={
        <FlexLayout flex items="center" justify="space-between">
          <span style={{ color: '#999', fontSize: 12 }}>
            {selectedKeys.length > 0 && `${selectedKeys.length} ${t('select')}`}
          </span>
          <FlexLayout.Item flex gap="0.5rem">
            <Button
              disabled={!selectedDsId}
              loading={importMutation.isPending && selectedKeys.length === 0}
              onClick={handleImportAll}
            >
              {t('importAll')}
            </Button>
            <Button
              type="primary"
              disabled={selectedKeys.length === 0}
              loading={importMutation.isPending && selectedKeys.length > 0}
              onClick={handleImport}
            >
              {importMutation.isPending ? t('importing') : t('importSelected')}
            </Button>
          </FlexLayout.Item>
        </FlexLayout>
      }
      destroyOnClose
    >
      <FlexLayout flex="column" gap="1rem">
        <FlexLayout flex items="center" gap="0.5rem">
          <Select
            style={{ flex: 1 }}
            placeholder={t('selectDataSource')}
            value={selectedDsId}
            onChange={handleDsChange}
            options={(dsListData?.data ?? []).map((ds) => ({
              label: `${ds.name} (${ds.bucket})`,
              value: ds.id,
            }))}
          />
          <Link to="/datasources" target="_blank">
            <Button type="link">{t('manageDataSources')}</Button>
          </Link>
        </FlexLayout>

        {selectedDsId && (
          <>
            <BreadcrumbNav>
              <span
                className={prefixSegments.length > 0 ? 'breadcrumb-item' : 'breadcrumb-current'}
                onClick={() => prefixSegments.length > 0 && handleFolderClick('')}
              >
                {t('rootDirectory')}
              </span>
              {prefixSegments.map((seg, i) => (
                <span key={seg.prefix}>
                  <span className="breadcrumb-separator">/</span>
                  <span
                    className={i < prefixSegments.length - 1 ? 'breadcrumb-item' : 'breadcrumb-current'}
                    onClick={() => i < prefixSegments.length - 1 && handleFolderClick(seg.prefix)}
                  >
                    {seg.label}
                  </span>
                </span>
              ))}
            </BreadcrumbNav>

            <Table
              dataSource={objects}
              columns={columns}
              rowKey="key"
              rowSelection={rowSelection}
              loading={isFetching}
              pagination={false}
              size="small"
              scroll={{ y: 360 }}
            />

            {truncated && (
              <Button onClick={handleLoadMore} block>
                {t('loadMore')}
              </Button>
            )}
          </>
        )}
      </FlexLayout>
    </Modal>
  );
};

export default S3ImportModal;
