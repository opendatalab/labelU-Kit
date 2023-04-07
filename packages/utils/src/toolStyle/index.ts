/**
 * Config2Color
 */

/**
 * 默认基础 5 配置
 */
const DEFAULT_COLORS = [
  'rgba(102, 111, 255, 1)',
  'rgba(102, 230, 255, 1)',
  'rgba(191, 255, 102, 1)',
  'rgba(255, 230, 102, 1)',
  'rgba(230, 102, 255, 1)',
];

/**
 * 属性标注主颜色
 */
export const ATTRIBUTE_COLORS = [
  'rgba(128, 12, 249, 1)',
  'rgba(0, 255, 48, 1)',
  'rgba(255, 136, 247, 1)',
  'rgba(255, 226, 50, 1)',
  'rgba(153, 66, 23, 1)',
  'rgba(2, 130, 250, 1)',
  'rgba(255, 35, 35, 1)',
  'rgba(0, 255, 234, 1)',
];

export const INVALID_COLOR = 'rgba(255, 51, 51, 1)';
export const NULL_COLOR = 'rgba(204, 204, 204, 1)';

class ToolStyleConverter {
  private _defaultColors: string[]; // 默认颜色列表
  private _attributeColors: string[]; // 默认属性列表
  constructor() {
    this._defaultColors = DEFAULT_COLORS;
    this._attributeColors = ATTRIBUTE_COLORS;
  }

  get defaultColors() {
    return this._defaultColors;
  }

  get attributeColors() {
    return this._attributeColors;
  }
}

export default new ToolStyleConverter();

export { ToolStyleConverter };
