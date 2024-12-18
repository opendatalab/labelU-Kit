import { useMemo, useCallback, useContext } from 'react';
import type { TableColumnType } from 'antd';
import { Popconfirm, Button, Table, Tooltip, Tag } from 'antd';
import _ from 'lodash-es';
import formatter from '@labelu/formatter';
import { FileOutlined, FolderOpenOutlined, QuestionCircleOutlined, UploadOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/lib/upload/interface';
import { FlexLayout } from '@labelu/components-react';
import { useRevalidator } from 'react-router';

import IconText from '@/components/IconText';
import type { StatusType } from '@/components/Status';
import Status from '@/components/Status';
import { ReactComponent as FileIcon } from '@/assets/svg/file.svg';
import commonController from '@/utils/common';
import NativeUpload from '@/components/NativeUpload';
import { deleteFile } from '@/api/services/task';
import { ReactComponent as UploadBg } from '@/assets/svg/upload-bg.svg';
import { MediaType } from '@/api/types';
import { FileExtensionText, FileMimeType, MediaFileSize } from '@/constants/mediaType';
import type { TaskInLoader } from '@/loaders/task.loader';
import { useUploadFileMutation } from '@/api/mutations/attachment';
import { deleteSamples } from '@/api/services/samples';
import { deletePreAnnotationFile } from '@/api/services/preAnnotations';

import { TaskCreationContext } from '../../taskCreation.context';
import { Bar, ButtonWrapper, Header, Left, Right, Spot, UploadArea, Wrapper } from './style';
import imageSchema from './imagePreAnnotationJsonl.schema.json';
import imageJsonSchema from './imagePreAnnotationJson.schema.json';
import audioJsonSchema from './audioPreAnnotationJson.schema.json';
import videoJsonSchema from './videoPreAnnotationJson.schema.json';
import audioSchema from './audioPreAnnotationJsonl.schema.json';
import videoSchema from './videoPreAnnotationJsonl.schema.json';
import { isCorrectFiles, isPreAnnotationFile, normalizeFiles, readFile, UploadStatus } from './utils';

const statusTextMapping = {
  [UploadStatus.Uploading]: '上传中',
  [UploadStatus.Waiting]: '等待上传',
  [UploadStatus.Success]: '上传成功',
  [UploadStatus.Fail]: '上传失败',
  [UploadStatus.Error]: '解析失败',
};

const jsonlMapping = {
  [MediaType.IMAGE]: imageSchema,
  [MediaType.VIDEO]: videoSchema,
  [MediaType.AUDIO]: audioSchema,
};

const jsonMapping = {
  [MediaType.IMAGE]: imageJsonSchema,
  [MediaType.VIDEO]: videoJsonSchema,
  [MediaType.AUDIO]: audioJsonSchema,
};

export interface QueuedFile {
  id?: number;
  url?: string;
  uid: string;
  name: string;
  size: number;
  status: UploadStatus;
  reason?: string;
  file: File;
  // sample id or pre-annotation id
  refId?: number;
}

const InputData = () => {
  // 上传队列，包括成功和失败的任务
  const {
    uploadFileList: fileQueue,
    setUploadFileList: setFileQueue,
    task = {} as NonNullable<TaskInLoader>,
  } = useContext(TaskCreationContext);
  const uploadMutation = useUploadFileMutation();
  const revalidator = useRevalidator();

  const taskId = task.id;

  const amountMapping = useMemo(() => {
    let succeeded = 0;
    let failed = 0;
    let uploading = 0;

    for (const file of fileQueue) {
      switch (file.status) {
        case UploadStatus.Success:
          succeeded++;
          break;
        case UploadStatus.Fail:
          failed++;
          break;
        case UploadStatus.Uploading:
          uploading++;
          break;
        default:
          break;
      }
    }
    return {
      succeeded,
      failed,
      uploading,
    };
  }, [fileQueue]);

  const processUpload = useCallback(
    async (files: QueuedFile[], mediaType: MediaType) => {
      // 开始上传
      setFileQueue((pre) => _.uniqBy([...pre, ...files], 'uid'));
      let succeed = 0;
      let failed = 0;

      const { Draft07 } = await import('json-schema-library');
      const jsonSchema = new Draft07(jsonlMapping[mediaType]);

      for (const file of files) {
        const { file: fileBlob } = file;

        // jsonl需要校验文件内容
        if (fileBlob.name.endsWith('.jsonl')) {
          try {
            const content = await readFile(fileBlob, 'text');

            for (const line of content.split('\n')) {
              const jsonLine = JSON.parse(line as string);

              // 校验 jsonl 文件格式
              const errors = jsonSchema.validate(jsonLine);

              if (errors.length > 0) {
                throw new Error(errors.map((error) => error.message).join('; \n'));
              }
            }
          } catch (error: any) {
            setFileQueue((pre) =>
              pre.map((item) => {
                if (item.uid === file.uid) {
                  return {
                    ...item,
                    status: UploadStatus.Error,
                    reason: error.message,
                  };
                }
                return item;
              }),
            );

            continue;
          }
        }

        // 解析labelu导出的json文件
        if (fileBlob.name.endsWith('.json')) {
          try {
            const preAnnotationJsonSchema = new Draft07(jsonMapping[mediaType]);
            const content = await readFile(fileBlob, 'text');
            const json = JSON.parse(content);

            for (let i = 0; i < json.length; i += 1) {
              if (typeof json[i].result === 'string') {
                json[i].result = JSON.parse(json[i].result);
              }

              const errors = preAnnotationJsonSchema.validate(json[i]);

              if (errors.length > 0) {
                throw new Error(errors.map((error) => error.message).join('; \n'));
              }
            }
          } catch (error: any) {
            setFileQueue((pre) =>
              pre.map((item) => {
                if (item.uid === file.uid) {
                  return {
                    ...item,
                    status: UploadStatus.Error,
                    reason: error.message,
                  };
                }
                return item;
              }),
            );

            continue;
          }
        }

        if ([UploadStatus.Success, UploadStatus.Uploading].includes(file.status)) {
          continue;
        }

        try {
          const { data } = await uploadMutation.mutateAsync({
            task_id: taskId!,
            file: fileBlob,
          });

          succeed += 1;

          await setFileQueue((pre) =>
            pre.map((item) => {
              if (item.uid === file.uid) {
                return {
                  ...item,
                  ...data,
                  status: UploadStatus.Success,
                };
              }
              return item;
            }),
          );
        } catch (error) {
          failed += 1;
          await setFileQueue((pre) =>
            pre.map((item) => {
              if (item.uid === file.uid) {
                return {
                  ...item,
                  status: UploadStatus.Fail,
                };
              }
              return item;
            }),
          );
        }
      }

      if (succeed > 0 && failed > 0) {
        commonController.notificationWarnMessage({ message: `${succeed} 个文件上传成功，${failed} 个文件上传失败` }, 3);
      } else if (succeed > 0 && failed === 0) {
        commonController.notificationSuccessMessage({ message: `${succeed} 个文件上传成功` }, 3);
      } else if (failed > 0 && succeed === 0) {
        commonController.notificationWarnMessage({ message: `${failed} 个文件上传失败` }, 3);
      }
    },
    [setFileQueue, taskId, uploadMutation],
  );

  const handleFilesChange = (files: RcFile[]) => {
    const isCorrectCondition = isCorrectFiles(files, task.media_type!);

    if (!isCorrectCondition) {
      return;
    } else {
      commonController.notificationSuccessMessage({ message: '已添加' + files.length + '个文件至上传列表' }, 3);
    }

    processUpload(normalizeFiles(files), task.media_type!);
  };

  const handleFileDelete = useCallback(
    async (file: QueuedFile) => {
      if (file.status === UploadStatus.Success) {
        await deleteFile(
          { task_id: taskId! },
          {
            attachment_ids: [file.id!],
          },
        );
      }

      if (file.refId) {
        if (isPreAnnotationFile(file.name)) {
          // 删除预标注
          await deletePreAnnotationFile({
            task_id: taskId!,
            file_id: file.refId,
          });
        } else {
          // 删除样本
          await deleteSamples(
            {
              task_id: taskId!,
            },
            { sample_ids: [file.refId] },
          );
        }
      }

      setFileQueue((pre) => pre.filter((item) => item.uid !== file.uid));
      commonController.notificationSuccessMessage({ message: '已删除一个文件' }, 3);
      revalidator.revalidate();
    },
    [revalidator, setFileQueue, taskId],
  );

  const tableColumns = useMemo(() => {
    return [
      {
        title: '文件名',
        dataIndex: 'name',
        align: 'left',
        responsive: ['md', 'lg', 'sm'],
        key: 'name',
        render: (text: string) => {
          return (
            <IconText icon={<FileIcon />}>
              <div>
                {formatter.format('ellipsis', text, { maxWidth: 540, type: 'tooltip' })}
                &nbsp;
                {isPreAnnotationFile(text) && <Tag color="processing">预标注</Tag>}
              </div>
            </IconText>
          );
        },
      },
      {
        title: '地址',
        dataIndex: 'url',
        align: 'left',
        responsive: ['md', 'lg'],
        key: 'url',
        render: (text: string) => {
          return formatter.format('ellipsis', `${location.protocol}//${location.host}${text}`, {
            maxWidth: 160,
            type: 'tooltip',
          });
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        align: 'left',
        responsive: ['md', 'lg', 'sm'],
        width: 160,
        key: 'status',
        render: (text: UploadStatus, record: QueuedFile) => {
          return (
            <FlexLayout.Item flex gap="0.5rem">
              <Status type={_.lowerCase(record.status) as StatusType} icon={<Spot />}>
                {statusTextMapping[text]}
              </Status>
              {record.reason && (
                <Tooltip title={record.reason}>
                  <QuestionCircleOutlined />
                </Tooltip>
              )}
            </FlexLayout.Item>
          );
        },
      },
      {
        title: '操作',
        dataIndex: 'action',
        align: 'left',
        responsive: ['md', 'lg'],
        width: 160,
        key: 'action',
        render: (text: string, record: QueuedFile) => {
          return (
            <>
              {record.status === UploadStatus.Fail && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    processUpload(fileQueue, task.media_type!);
                  }}
                >
                  重新上传
                </Button>
              )}
              <Popconfirm
                title="确定删除此文件吗？"
                onConfirm={() => {
                  handleFileDelete(record);
                }}
              >
                <Button type="link" size="small" danger>
                  删除
                </Button>
              </Popconfirm>
            </>
          );
        },
      },
    ] as TableColumnType<QueuedFile>[];
  }, [fileQueue, handleFileDelete, processUpload, task.media_type]);

  return (
    <Wrapper flex="column" full>
      <Header flex items="center">
        <Bar />
        <h3>数据导入</h3>
      </Header>
      <FlexLayout.Content flex items="stretch" gap="1.5rem">
        <Left flex="column">
          <h4>标注文件上传</h4>
          <UploadArea flex="column" gap="1rem" items="center">
            <UploadBg />

            <FlexLayout gap="1rem">
              <NativeUpload
                type="primary"
                icon={<FileOutlined />}
                onChange={handleFilesChange}
                directory={false}
                multiple={true}
                accept={FileMimeType[task.media_type!]}
              >
                上传文件
              </NativeUpload>
              <NativeUpload
                type="primary"
                ghost
                icon={<FolderOpenOutlined />}
                onChange={handleFilesChange}
                directory={true}
                accept={FileMimeType[task.media_type!]}
              >
                上传文件夹
              </NativeUpload>
            </FlexLayout>
            <ButtonWrapper flex="column" items="center" gap="0.25rem">
              <div>支持文件类型包括：{FileExtensionText[task.media_type!]}</div>
              <div> 单次上传文件最大数量为100个，建议单个文件大小不超过{MediaFileSize[task.media_type!]}MB </div>
            </ButtonWrapper>
          </UploadArea>
          <h4>预标注上传</h4>
          <FlexLayout.Item flex="column" items="flex-start" gap="0.5rem">
            <NativeUpload
              icon={<UploadOutlined />}
              onChange={handleFilesChange}
              directory={false}
              multiple={true}
              accept={'.jsonl, .json'}
            >
              上传文件
            </NativeUpload>
            <div style={{ color: '#999', fontSize: 12 }}>
              支持上传 jsonl 或 json 格式的预标注文件，参考{' '}
              <a
                target="_blank"
                href="https://opendatalab.github.io/labelU/schema/pre-annotation/json"
                rel="noreferrer"
              >
                示例
              </a>
            </div>
          </FlexLayout.Item>
        </Left>
        <Right flex="column" gap="1rem">
          {fileQueue.length > 0 && (
            <FlexLayout.Header items="center" gap="0.25rem" flex>
              <b>上传列表</b>
              <div>正在上传</div>
              <FlexLayout gap=".25rem">
                <span style={{ display: 'inline-block', color: 'var(--color-primary)' }}>
                  {amountMapping.uploading}
                </span>
                <span>个；</span>
              </FlexLayout>
              <FlexLayout gap=".25rem">
                <span>上传成功</span>
                <Status type="success" icon={null} style={{ display: 'inline-block' }}>
                  {amountMapping.succeeded}
                </Status>
                <span>个，</span>
              </FlexLayout>
              <FlexLayout gap=".25rem">
                <span>上传失败</span>
                <Status type="failed" icon={null} style={{ display: 'inline-block' }}>
                  {amountMapping.failed}
                </Status>
                <span>个。</span>
              </FlexLayout>
            </FlexLayout.Header>
          )}
          <FlexLayout.Content scroll>
            <Table columns={tableColumns} dataSource={fileQueue} rowKey={(record) => record.uid} />
          </FlexLayout.Content>
        </Right>
      </FlexLayout.Content>
    </Wrapper>
  );
};

export default InputData;
