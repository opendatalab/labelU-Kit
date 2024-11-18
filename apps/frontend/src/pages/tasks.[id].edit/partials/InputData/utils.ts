import { v4 as uuid4 } from 'uuid';

import type { MediaType } from '@/api/types';
import { FileExtensionText, MediaFileSize } from '@/constants/mediaType';
import commonController from '@/utils/common';

export enum UploadStatus {
  Uploading = 'Uploading',
  Waiting = 'Waiting',
  Success = 'Success',
  Fail = 'Fail',
  Error = 'Error',
}

export const readFile = async (file: File, type?: 'text') => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };

    if (type === 'text') {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
};

export const isPreAnnotationFile = (filename: string) => {
  if (!filename) {
    return false;
  }

  return filename.endsWith('.jsonl') || filename.endsWith('.json');
};

export const isCorrectFiles = (files: File[], type: MediaType) => {
  let result = true;

  if (files.length > 100) {
    commonController.notificationErrorMessage({ message: '单次上传文件数量超过上限100个，请分批上传' }, 3);
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const fileUnit = files[i];
    const isOverSize = commonController.isOverSize(fileUnit.size, type);

    if (isOverSize) {
      commonController.notificationErrorMessage({ message: `单个文件大小超过${MediaFileSize[type]}MB限制` }, 3);
      result = false;
      break;
    }

    // 忽略jsonl文件的类型校验
    if (isPreAnnotationFile(fileUnit.name)) {
      continue;
    }

    const isCorrectFileType = commonController.isCorrectFileType(fileUnit.name, type);

    if (!isCorrectFileType) {
      commonController.notificationErrorMessage(
        { message: `请上传支持的文件类型，类型包括：${FileExtensionText[type]}` },
        3,
      );
      result = false;
      break;
    }
  }

  return result;
};

export const normalizeFiles = (files: File[]) => {
  return files.map((file) => {
    return {
      uid: uuid4(),
      name: file.name,
      size: file.size,
      status: UploadStatus.Waiting,
      file,
    };
  });
};