import { TOOL_NAME, EToolName } from '@label-u/annotation';

export const toolnames = [
  TOOL_NAME[EToolName.Rect],
  TOOL_NAME[EToolName.Point],
  TOOL_NAME[EToolName.Polygon],
  TOOL_NAME[EToolName.Line],
  TOOL_NAME[EToolName.Tag],
  TOOL_NAME[EToolName.Text],
  TOOL_NAME[EToolName.Cuboid],
];
export const toolnameT = {
  [TOOL_NAME[EToolName.Rect]]: EToolName.Rect,
  [TOOL_NAME[EToolName.Point]]: EToolName.Point,
  [TOOL_NAME[EToolName.Polygon]]: EToolName.Polygon,
  [TOOL_NAME[EToolName.Line]]: EToolName.Line,
  [TOOL_NAME[EToolName.Tag]]: EToolName.Tag,
  [TOOL_NAME[EToolName.Text]]: EToolName.Text,
  [TOOL_NAME[EToolName.Cuboid]]: EToolName.Cuboid,
};

export const toolnameC = {
  [EToolName.Rect]: TOOL_NAME[EToolName.Rect],
  [EToolName.Point]: TOOL_NAME[EToolName.Point],
  [EToolName.Polygon]: TOOL_NAME[EToolName.Polygon],
  [EToolName.Line]: TOOL_NAME[EToolName.Line],
  [EToolName.Tag]: TOOL_NAME[EToolName.Tag],
  [EToolName.Text]: TOOL_NAME[EToolName.Text],
  [EToolName.Cuboid]: TOOL_NAME[EToolName.Cuboid],
};

export const types = ['图片'];

export const delayTime = 3000;
