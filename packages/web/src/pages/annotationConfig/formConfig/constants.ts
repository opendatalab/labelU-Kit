import { TOOL_NAME, EToolName } from '@label-u/annotation';

export const toolnames = [
  TOOL_NAME[EToolName.Rect],
  TOOL_NAME[EToolName.Point],
  TOOL_NAME[EToolName.Polygon],
  TOOL_NAME[EToolName.Line],
  TOOL_NAME[EToolName.Tag],
  TOOL_NAME[EToolName.Text]
];
export const toolnameT = {
  [TOOL_NAME[EToolName.Rect]]: EToolName.Rect,
  [TOOL_NAME[EToolName.Point]]: EToolName.Point,
  [TOOL_NAME[EToolName.Polygon]]: EToolName.Polygon,
  [TOOL_NAME[EToolName.Line]]: EToolName.Line,
  [TOOL_NAME[EToolName.Tag]]: EToolName.Tag,
  [TOOL_NAME[EToolName.Text]]: EToolName.Text
};

export const toolnameC = {
  [EToolName.Rect]: TOOL_NAME[EToolName.Rect],
  [EToolName.Point]: TOOL_NAME[EToolName.Point],
  [EToolName.Polygon]: TOOL_NAME[EToolName.Polygon],
  [EToolName.Line]: TOOL_NAME[EToolName.Line],
  [EToolName.Tag]: TOOL_NAME[EToolName.Tag],
  [EToolName.Text]: TOOL_NAME[EToolName.Text]
};

export const types = ['图片'];

export const delayTime = 300;
