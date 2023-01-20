import type { IToolConfig } from './common';

export interface ITagConfig extends IToolConfig {
  pageSize: number;
  inputList: IInputList[];
}

export interface ITagResult {
  id: string;
  sourceID: string;
  result: Record<string, string>;
}

export interface IInputList {
  key: string;
  value: string;
  isMulti?: boolean;
  subSelected?: IInfoList[];
}

interface IInfoList {
  key: string;
  value: string;
  isDefault?: boolean; // 是否为默认值
}
