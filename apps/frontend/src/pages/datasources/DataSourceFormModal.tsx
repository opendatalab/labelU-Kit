import { useEffect } from 'react';
import { Form, Input, InputNumber, Modal, Switch } from 'antd';
import { useTranslation } from '@labelu/i18n';

import type { DataSourceResponse, CreateDataSourceCommand, UpdateDataSourceCommand } from '@/api/types';

interface DataSourceFormModalProps {
  open: boolean;
  editingDataSource?: DataSourceResponse | null;
  onCancel: () => void;
  onSubmit: (values: CreateDataSourceCommand | UpdateDataSourceCommand) => void;
  loading?: boolean;
}

const DataSourceFormModal = ({ open, editingDataSource, onCancel, onSubmit, loading }: DataSourceFormModalProps) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const isEditing = !!editingDataSource;

  useEffect(() => {
    if (open && editingDataSource) {
      form.setFieldsValue({
        name: editingDataSource.name,
        endpoint: editingDataSource.endpoint,
        region: editingDataSource.region,
        bucket: editingDataSource.bucket,
        prefix: editingDataSource.prefix,
        path_style: editingDataSource.path_style ?? false,
        use_ssl: editingDataSource.use_ssl ?? true,
        presign_expire_secs: editingDataSource.presign_expire_secs ?? 3600,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, editingDataSource, form]);

  const handleOk = async () => {
    const values = await form.validateFields();

    if (isEditing) {
      const payload: UpdateDataSourceCommand = {};
      const fields = [
        'name',
        'endpoint',
        'region',
        'bucket',
        'prefix',
        'path_style',
        'use_ssl',
        'presign_expire_secs',
      ] as const;

      for (const field of fields) {
        if (values[field] !== undefined && values[field] !== editingDataSource?.[field as keyof DataSourceResponse]) {
          (payload as any)[field] = values[field];
        }
      }

      if (values.access_key_id) {
        payload.access_key_id = values.access_key_id;
      }
      if (values.secret_access_key) {
        payload.secret_access_key = values.secret_access_key;
      }

      onSubmit(payload);
    } else {
      onSubmit(values as CreateDataSourceCommand);
    }
  };

  return (
    <Modal
      open={open}
      title={isEditing ? t('editDataSource') : t('createDataSource')}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
      width={520}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ path_style: false, use_ssl: true, presign_expire_secs: 3600 }}
      >
        <Form.Item name="name" label={t('dataSourceName')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="endpoint" label={t('endpoint')}>
          <Input placeholder="https://s3.amazonaws.com" />
        </Form.Item>
        <Form.Item name="region" label={t('region')}>
          <Input placeholder="us-east-1" />
        </Form.Item>
        <Form.Item name="bucket" label={t('bucket')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="prefix" label={t('prefix')}>
          <Input placeholder="data/" />
        </Form.Item>
        <Form.Item name="access_key_id" label={t('accessKeyId')} rules={isEditing ? [] : [{ required: true }]}>
          <Input placeholder={isEditing ? (t('enterToChange') as string) : undefined} />
        </Form.Item>
        <Form.Item name="secret_access_key" label={t('secretAccessKey')} rules={isEditing ? [] : [{ required: true }]}>
          <Input.Password placeholder={isEditing ? (t('enterToChange') as string) : undefined} />
        </Form.Item>
        <Form.Item name="path_style" label={t('pathStyle')} valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="use_ssl" label={t('useSSL')} valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="presign_expire_secs" label={t('presignExpireSecs')}>
          <InputNumber min={60} max={604800} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DataSourceFormModal;
