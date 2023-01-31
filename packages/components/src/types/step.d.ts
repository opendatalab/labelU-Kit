/** 步骤对象 */
import type { ToolConfig } from '@/interface/toolConfig';

export interface IStepInfo {
  type: number; // 1 为标注， 2 为质检
  config: ToolConfig; // 配置信息
  dataSourceStep: number;
  tool: string;
  name: string;
  step: number; // 仅用于质检时的 stepList 的步骤定位
  loadPreStep: number; // 载入预标注数据
  preDataSourceStep: number; // 预标注数据
}
