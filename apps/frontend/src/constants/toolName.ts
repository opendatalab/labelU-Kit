import { EAudioToolName, EGlobalToolName, EVideoToolName, ImageToolName } from '@/enums';

export const TOOL_NAME: Record<string, string> = {
  [ImageToolName.Rect]: '拉框',
  [EGlobalToolName.Tag]: '标签分类',
  [EGlobalToolName.Text]: '文本描述',
  [ImageToolName.Point]: '标点',
  [ImageToolName.Polygon]: '多边形',
  [ImageToolName.Cuboid]: '立体框',
  [ImageToolName.Line]: '标线',
  [EVideoToolName.VideoSegmentTool]: '片断分割',
  [EVideoToolName.VideoFrameTool]: '时间戳',
  [EAudioToolName.AudioSegmentTool]: '片断分割',
  [EAudioToolName.AudioFrameTool]: '时间戳',
};
