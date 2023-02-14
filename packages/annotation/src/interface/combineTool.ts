import type { ToolNameType } from '@/constant/tool';
import type { Result } from '@/types/annotationTask';

export interface Attribute {
  key: string;
  value: string;
}

interface CommonConfig {
  copyBackwardResult?: boolean;
}

export interface IMeasureToolConfig extends CommonConfig {
  textConfigurable: boolean;
  attributeConfigurable: boolean;
  attributeList: Attribute[];
}

export interface OneTag {
  key: string;
  value: string;
  isMulti: boolean;
  subSelected: SubSelected[];
}

export interface SubSelected {
  key: string;
  value: string;
  isDefault: boolean;
}

export interface RectConfig extends CommonConfig {
  drawOutsideTarget: boolean; // 框是否可以画至图片以外
  minWidth: number; // 拉框最小宽度
  minHeight: number; // 拉框最小高度
  isShowOrder: boolean; // 是否显示拉框序号
  attributeConfigurable: boolean; // 是否显示拉框标签配置选项
  attributeList: Attribute[]; // 拉框标签配置选项
  textConfigurable: boolean; // 拉框标签是否可配置
  textCheckType: number; //
}

export interface TagToolConfig extends CommonConfig {
  pageSize: number;
  inputList: OneTag[];
}

export interface LineToolConfig extends CommonConfig {
  lineType: number; // 配置拉线类型 0 为普通拉线，2为贝塞尔曲线
  lineColor: number; // 配置拉线颜色，0为单一色，1 为多色（暂未生效）
  edgeAdsorption: boolean; // 多线条情况下是否支持 点吸附
  outOfTarget: boolean;
  isShowOrder: boolean; // 是否显示划线序号
  attributeConfigurable: boolean; // 是否显示划线标签配置选项
  attributeList: Attribute[]; // 划线标签配置选项
  textConfigurable: boolean; // 划线标签是否可配置
  textCheckType: number; // 划线标签检查输入类型配置 1 为数字 2 为英文 3为数字 4 为任意字符(配合customFormat 使用)
  customFormat: string; // 划线标签检查输入格式正则
  showConfirm: boolean; // 无效配置
  lowerLimitPointNum: number; // 最少定点数
  upperLimitPointNum: string; // 最多顶点数
}

export interface OneText {
  label: string;
  key: string;
  required: boolean;
  default: string;
  maxLength: number;
}

export interface TextToolConfig extends CommonConfig {
  enableTextRecognition: boolean;
  recognitionMode: string;
  configList: OneText[];
}

export interface PolygonConfig extends CommonConfig {
  lineType: number; // 配置拉线类型 0 为普通拉线，2为贝塞尔曲线
  lineColor: number; // 配置拉线颜色，0为单一色，1 为多色（暂未生效）
  edgeAdsorption: boolean; // 多线条情况下是否支持 点吸附
  isShowOrder: boolean; // 是否显示分割序号
  attributeConfigurable: true; // 是否显示分割标签配置选项
  attributeList: Attribute[];
  extConfigurable: boolean; // 分割标签是否可配置
  textCheckType: number; // 分割标签检查输入类型配置 1 为数字 2 为英文 3为数字 4 为任意字符(配合customFormat 使用)
  customFormat: string; // 分割标签检查输入格式正则
}

export interface PrevResult {
  toolName: string;
  result: Result[];
}

export type ToolConfig =
  | PolygonConfig
  | TextToolConfig
  | LineToolConfig
  | TagToolConfig
  | RectConfig
  | IMeasureToolConfig;

export interface StepConfig {
  step: number;
  dataSourceStep: number;
  tool: ToolNameType;
  config: string;
}

export interface StepConfigState {
  stepConfig: StepConfig[];
}
