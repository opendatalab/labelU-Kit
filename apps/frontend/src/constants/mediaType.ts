import { MediaType } from '@/api/types';

export const MediaTypeText = {
  [MediaType.IMAGE]: '图片',
  [MediaType.VIDEO]: '视频',
  [MediaType.AUDIO]: '音频',
};

export const FileExtensionText = {
  [MediaType.IMAGE]: 'jpg、png、bmp、gif',
  [MediaType.VIDEO]: 'mp4(h.264编码)',
  [MediaType.AUDIO]: 'mp3、wav、ogg',
};

export const FileExtension = {
  [MediaType.IMAGE]: ['jpg', 'png', 'bmp', 'gif', 'jpeg'],
  [MediaType.VIDEO]: ['mp4'],
  [MediaType.AUDIO]: ['mp3', 'wav', 'ogg'],
};

export const MediaFileSize = {
  [MediaType.IMAGE]: 100,
  [MediaType.VIDEO]: 200,
  [MediaType.AUDIO]: 200,
};

export const MediaRouterPrefix = {
  [MediaType.IMAGE]: 'image',
  [MediaType.VIDEO]: 'video',
  [MediaType.AUDIO]: 'audio',
};

export const FileMimeType = {
  [MediaType.IMAGE]: 'image/png,image/jpeg,image/bmp,image/gif',
  [MediaType.VIDEO]: 'video/mp4',
  [MediaType.AUDIO]: 'audio/mpeg,audio/x-wav,audio/vnd.wav,audio/ogg',
};
