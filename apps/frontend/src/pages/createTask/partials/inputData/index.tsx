import { useMemo, useCallback, useContext } from 'react';
import { v4 as uuid4 } from 'uuid';
import type { TableColumnType } from 'antd';
import { Popconfirm, Button, Table } from 'antd';
import _ from 'lodash-es';
import formatter from '@label-u/formatter';
import { FileOutlined, FolderOpenOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/lib/upload/interface';

import IconText from '@/components/IconText';
import type { StatusType } from '@/components/Status';
import Status from '@/components/Status';
import { ReactComponent as FileIcon } from '@/assets/svg/file.svg';
import commonController from '@/utils/common/common';
import NativeUpload from '@/components/nativeUpload';
import { deleteFile, uploadFile as uploadFileService } from '@/services/task';

import styles from './index.module.scss';
import { TaskCreationContext } from '../../taskCreation.context';

export enum UploadStatus {
  Uploading = 'Uploading',
  Waiting = 'Waiting',
  Success = 'Success',
  Fail = 'Fail',
}

const statusTextMapping = {
  [UploadStatus.Uploading]: '上传中',
  [UploadStatus.Waiting]: '等待上传',
  [UploadStatus.Success]: '上传成功',
  [UploadStatus.Fail]: '上传失败',
};

export interface QueuedFile {
  id?: number;
  url?: string;
  uid: string;
  name: string;
  size: number;
  status: UploadStatus;
  path: string;
  file: File;
}

const isCorrectFiles = (files: File[]) => {
  let result = true;
  if (files.length > 100) {
    commonController.notificationErrorMessage({ message: '单次上传文件数量超过上限100个，请分批上传' }, 3);
    return;
  }
  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const fileUnit = files[fileIndex];
    const isOverSize = commonController.isOverSize(fileUnit.size);
    if (isOverSize) {
      commonController.notificationErrorMessage({ message: '单个文件大小超过100MB限制' }, 3);
      result = false;
      break;
    }
    const isCorrectFileType = commonController.isCorrectFileType(fileUnit.name);
    if (!isCorrectFileType) {
      commonController.notificationErrorMessage({ message: '请上传支持的文件类型，类型包括：jpg、png、bmp、gif' }, 3);
      result = false;
      break;
    }
  }
  return result;
};

const normalizeFiles = (files: File[]) => {
  return files.map((file) => {
    return {
      uid: uuid4(),
      name: file.name,
      size: file.size,
      status: UploadStatus.Waiting,
      path: file.webkitRelativePath === '' ? './' : file.webkitRelativePath,
      file,
    };
  });
};

const InputData = () => {
  // 上传队列，包括成功和失败的任务
  const { uploadFileList: fileQueue, setUploadFileList: setFileQueue, task = {} } = useContext(TaskCreationContext);
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
    async (files: QueuedFile[]) => {
      // 开始上传
      setFileQueue((pre) => _.uniqBy([...pre, ...files], 'uid'));
      let succeed = 0;
      let failed = 0;

      for (const file of files) {
        const { file: fileBlob } = file;

        if ([UploadStatus.Success, UploadStatus.Uploading].includes(file.status)) {
          continue;
        }

        try {
          const { data } = await uploadFileService({
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
    [setFileQueue, taskId],
  );

  const handleFilesChange = (files: RcFile[]) => {
    const isCorrectCondition = isCorrectFiles(files);
    if (!isCorrectCondition) {
      return;
    } else {
      commonController.notificationSuccessMessage({ message: '已添加' + files.length + '个项目至上传列表' }, 3);
    }

    processUpload(normalizeFiles(files));
  };

  const handleFileDelete = useCallback(
    async (file: QueuedFile) => {
      await deleteFile(
        { task_id: taskId! },
        {
          attachment_ids: [file.id!],
        },
      );
      setFileQueue((pre) => pre.filter((item) => item.uid !== file.uid));
      commonController.notificationSuccessMessage({ message: '已删除一个文件' }, 3);
    },
    [setFileQueue, taskId],
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
            <div className={styles.fileItem}>
              <IconText icon={<FileIcon />}>
                {formatter.format('ellipsis', text, { maxWidth: 540, type: 'tooltip' })}
              </IconText>
            </div>
          );
        },
      },
      {
        title: '地址',
        dataIndex: 'path',
        align: 'left',
        responsive: ['md', 'lg'],
        key: 'path',
        render: (text: string) => {
          return formatter.format('ellipsis', text, { maxWidth: 160, type: 'tooltip' });
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
            <Status
              type={_.lowerCase(record.status) as StatusType}
              icon={<span className={styles.spot} style={{ backgroundColor: 'var(--status-color)' }} />}
            >
              {statusTextMapping[text]}
            </Status>
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
                    processUpload(fileQueue);
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
  }, [fileQueue, handleFileDelete, processUpload]);

  return (
    <div className={styles.outerFrame}>
      <div className={styles.title}>
        <div className={styles.icon} />
        <div className={styles.titleText}>数据导入</div>
      </div>
      <div className={styles.content}>
        <div className={styles.left}>
          <div className={styles.leftTitle}>本地上传</div>
          <div className={styles.dragAndDrop}>
            <div className={styles.survey} />
            <div className={styles.buttons}>
              <Button type="primary" icon={<FileOutlined />}>
                <NativeUpload
                  onChange={handleFilesChange}
                  directory={false}
                  multiple={true}
                  accept={'image/png,image/jpeg,image/bmp,image/gif'}
                >
                  上传文件
                </NativeUpload>
              </Button>
              <Button type="primary" ghost icon={<FolderOpenOutlined />}>
                <NativeUpload
                  onChange={handleFilesChange}
                  directory={true}
                  accept={'image/jpg,image/jpeg,image/bmp,image/gif'}
                >
                  上传文件夹
                </NativeUpload>
              </Button>
            </div>
            <div className={styles.illustration}>
              <div className={styles.supportType}>支持文件类型包括：jpg、png、bmp、gif</div>
              <div className={styles.advises}> 单次上传文件最大数量为100个，建议单个文件大小不超过100MB </div>
            </div>
            <div />
          </div>
        </div>
        <div className={styles.right}>
          {fileQueue.length > 0 && (
            <>
              <div className={styles.rightTitle}>
                <div className={styles.rightTitleLeft}>上传列表</div>
                <div>正在上传</div>
                <div>
                  <div style={{ display: 'inline-block', color: 'var(--primary-color)' }}>
                    {amountMapping.uploading}
                  </div>
                  个；
                </div>
                <div>
                  上传成功
                  <Status type="success" icon={null} style={{ display: 'inline-block' }}>
                    {amountMapping.succeeded}
                  </Status>
                  个，
                </div>
                <div>
                  上传失败
                  <Status type="failed" icon={null} style={{ display: 'inline-block' }}>
                    {amountMapping.failed}
                  </Status>
                  个。
                </div>
              </div>
            </>
          )}
          <div className={styles.rightContent}>
            <Table columns={tableColumns} dataSource={fileQueue} rowKey={(record) => record.uid} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default InputData;
